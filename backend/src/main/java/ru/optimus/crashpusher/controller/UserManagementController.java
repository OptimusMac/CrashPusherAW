package ru.optimus.crashpusher.controller;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.optimus.crashpusher.model.User;
import ru.optimus.crashpusher.service.UserService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getUsers(
            @RequestParam(value = "q", required = false, defaultValue = "") String q) {

        List<User> users = userService.findAllUsers(q);

        List<Map<String, Object>> result = users.stream().map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("username", user.getUsername());
            map.put("roles", user.getRoles());
            map.put("enabled", user.isEnabled());
            return map;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        try {
            User user = userService.updateUser(id, request);
            return ResponseEntity.ok(createUserResponse(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest request) {
        try {
            User user = userService.createUser(request);
            return ResponseEntity.ok(createUserResponse(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> createUserResponse(User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("roles", user.getRoles());
        response.put("enabled", user.isEnabled());
        return response;
    }

    // DTO классы
    @Setter
    @Getter
    public static class UpdateUserRequest {
        // Getters and Setters
        private String username;
        private String password;
        private java.util.Set<String> roles;
        private boolean enabled;

    }

    @Setter
    @Getter
    public static class CreateUserRequest {
        // Getters and Setters
        private String username;
        private String password;
        private java.util.Set<String> roles;
        private boolean enabled;

    }
}