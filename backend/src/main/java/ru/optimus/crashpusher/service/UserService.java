package ru.optimus.crashpusher.service;


import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.optimus.crashpusher.controller.UserManagementController;
import ru.optimus.crashpusher.discord.DiscordManager;
import ru.optimus.crashpusher.model.User;
import ru.optimus.crashpusher.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DiscordManager discordService;
    private final AdminTokenService adminTokenService;


    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities(user.getRoles().toArray(new String[0]))
                .disabled(!user.isEnabled())
                .build();
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public String generateAdminConfirmationToken() {
        return adminTokenService.generateAdminConfirmationToken();
    }

    public boolean validateAdminToken(String token) {
        return adminTokenService.validateAdminToken(token);
    }

    public User registerAdmin(String confirmationToken, String username, String password) {
        // Валидируем токен
        if (!adminTokenService.validateAdminToken(confirmationToken)) {
            throw new RuntimeException("Invalid or expired admin confirmation token");
        }

        // Проверяем существование пользователя
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        // Создаем админа
        User admin = new User();
        admin.setUsername(username);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setRoles(Collections.singleton("ADMIN"));
        admin.setEnabled(true);
        admin.setPasswordVersion(1L);
        admin.setPasswordChangedAt(LocalDateTime.now());

        User savedAdmin = userRepository.save(admin);

        // Помечаем токен как использованный
        adminTokenService.useAdminToken(confirmationToken);

        System.out.println("✅ Admin registered successfully: " + username);

        return savedAdmin;
    }

    public List<User> findAllUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return userRepository.findAll();
        }
        return userRepository.findByUsernameContainingIgnoreCase(query);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public User updateUser(Long id, UserManagementController.UpdateUserRequest request) {
        User user = getUserById(id);

        // Проверяем уникальность username (если изменился)
        if (!user.getUsername().equals(request.getUsername()) &&
                userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        boolean passwordChanged = request.getPassword() != null &&
                !request.getPassword().trim().isEmpty();

        // Сохраняем старые роли для проверки изменений
        Set<String> oldRoles = new HashSet<>(user.getRoles());
        Set<String> newRoles = request.getRoles();

        boolean rolesChanged = !oldRoles.equals(newRoles);
        boolean isSelfUpdate = false;

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            String currentUsername = authentication.getName();
            isSelfUpdate = user.getUsername().equals(currentUsername);
        }

        if (passwordChanged) {
            // Используем метод updatePassword который инкрементит версию
            user.updatePassword(passwordEncoder.encode(request.getPassword()));
            System.out.println("🔄 Password updated for user: " + user.getUsername() +
                    ". New password version: " + user.getPasswordVersion());
        }

        user.setUsername(request.getUsername());
        user.setRoles(request.getRoles());
        user.setEnabled(request.isEnabled());

        User savedUser = userRepository.save(user);

        if (passwordChanged) {
            System.out.println("🚨 Password changed for user: " + user.getUsername() +
                    ". All existing tokens are now invalid.");
        }

        if (rolesChanged) {
            System.out.println("🔄 Roles changed for user: " + user.getUsername() +
                    ". Old roles: " + oldRoles + ", New roles: " + newRoles);

            if (isSelfUpdate) {
                user.setPasswordVersion(user.getPasswordVersion() + 1);
                userRepository.save(user);
                System.out.println("🚨 SELF-ROLE-CHANGE: User " + user.getUsername() +
                        " changed their own roles. Token invalidated.");
            }
        }

        return savedUser;
    }

    public User registerUser(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRoles(Collections.singleton("USER"));
        user.setEnabled(true);
        user.setPasswordVersion(1L);
        user.setPasswordChangedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public User createUser(UserManagementController.CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRoles(request.getRoles() != null ? request.getRoles() : Set.of("USER"));
        user.setEnabled(request.isEnabled());
        user.setPasswordVersion(1L);
        user.setPasswordChangedAt(LocalDateTime.now());

        return userRepository.save(user);
    }


    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }

}