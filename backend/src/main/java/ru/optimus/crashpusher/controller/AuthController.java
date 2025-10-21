// AuthController.java
package ru.optimus.crashpusher.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import ru.optimus.crashpusher.dto.AdminRegistrationRequest;
import ru.optimus.crashpusher.dto.AuthRequest;
import ru.optimus.crashpusher.dto.AuthResponse;
import ru.optimus.crashpusher.jwt.JwtUtil;
import ru.optimus.crashpusher.model.User;
import ru.optimus.crashpusher.service.UserService;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        var userDetails = (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
        var roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        String token = jwtUtil.generateToken(userDetails.getUsername(), roles);

        return ResponseEntity.ok(new AuthResponse(token, userDetails.getUsername(),
                new HashSet<>(roles), "Login successful"));
    }
    @PostMapping("/register/user")
    public ResponseEntity<AuthResponse> registerUser(@RequestBody AuthRequest request) {
        User userCrash = userService.registerUser(request.getUsername(), request.getPassword());

        String token = jwtUtil.generateToken(userCrash.getUsername(),
                new ArrayList<>(userCrash.getRoles()));

        return ResponseEntity.ok(new AuthResponse(token, userCrash.getUsername(),
                userCrash.getRoles(), "User registered successfully"));
    }



    @PostMapping("/generate-admin-token")
    public ResponseEntity<AuthResponse> generateAdminToken() {
        String token = userService.generateAdminConfirmationToken();
        return ResponseEntity.ok(new AuthResponse(null, null, null,
                "Admin confirmation token generated and sent to Discord"));
    }

    @PostMapping("/validate-admin-token")
    public ResponseEntity<AuthResponse> validateAdminToken(@RequestParam String token) {
        boolean isValid = userService.validateAdminToken(token);
        if (isValid) {
            return ResponseEntity.ok(new AuthResponse(null, null, null, "Token is valid"));
        } else {
            return ResponseEntity.badRequest().body(new AuthResponse(null, null, null, "Invalid token"));
        }
    }

    @PostMapping("/register/admin")
    public ResponseEntity<AuthResponse> registerAdmin(@RequestBody AdminRegistrationRequest request) {
        User admin = userService.registerAdmin(request.getConfirmationToken(),
                request.getUsername(), request.getPassword());

        String token = jwtUtil.generateToken(admin.getUsername(),
                new ArrayList<>(admin.getRoles()));

        return ResponseEntity.ok(new AuthResponse(token, admin.getUsername(),
                admin.getRoles(), "Admin registered successfully"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestHeader("Authorization") String authHeader) {
        try {
            // Извлекаем токен из заголовка
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new AuthResponse(null, null, null, "Invalid authorization header"));
            }

            String oldToken = authHeader.substring(7);

            // Проверяем валидность текущего токена (включая password version)
            if (!jwtUtil.validateToken(oldToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new AuthResponse(null, null, null, "Invalid or expired token"));
            }

            // Получаем username из токена
            String username = jwtUtil.getUsernameFromToken(oldToken);

            // Загружаем актуальные данные пользователя
            User user = userService.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Проверяем, не изменились ли роли с момента выдачи токена
            List<String> tokenRoles = jwtUtil.getRolesFromToken(oldToken);
            List<String> currentRoles = new ArrayList<>(user.getRoles());

            boolean rolesChanged = !new HashSet<>(tokenRoles).equals(new HashSet<>(currentRoles));

            if (rolesChanged) {
                System.out.println("🔄 Roles changed since token was issued for user: " + username);
                System.out.println("Token roles: " + tokenRoles + ", Current roles: " + currentRoles);
            }

            // Генерируем новый токен с АКТУАЛЬНЫМИ ролями
            String newToken = jwtUtil.generateToken(user.getUsername(), currentRoles);

            String message = rolesChanged ?
                    "Token refreshed. Roles updated: " + currentRoles :
                    "Token refreshed successfully";

            return ResponseEntity.ok(new AuthResponse(newToken, user.getUsername(),
                    user.getRoles(), message));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(null, null, null, "Token refresh failed: " + e.getMessage()));
        }
    }
}