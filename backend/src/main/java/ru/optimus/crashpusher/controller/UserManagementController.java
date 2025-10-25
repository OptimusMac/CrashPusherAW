package ru.optimus.crashpusher.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import ru.optimus.crashpusher.model.Log;
import ru.optimus.crashpusher.model.User;
import ru.optimus.crashpusher.service.LogService;
import ru.optimus.crashpusher.service.UserService;
import ru.optimus.crashpusher.ws.MinecraftWebSocketHandler;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {

    private final UserService userService;
    private final LogService logService;
    private final MinecraftWebSocketHandler minecraftWebSocketHandler;

    @Value("${secret_key_validation}")
    private String token;

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

    @PostMapping("/back-item")
    public ResponseEntity<?> backItem(@RequestParam Long id) {
        try {
            System.out.println("🔍 BackItem called with id: " + id);

            Log log = logService.findById(id);
            String player = (String) log.getValue().get("player");
            Object items = log.getValue().get("items-data");

            Map<String, Object> minecraftMessage = new HashMap<>();
            minecraftMessage.put("type", "RESTORE_ITEMS");
            minecraftMessage.put("player", player);
            minecraftMessage.put("items-data", items);
            minecraftMessage.put("logId", id);
            minecraftMessage.put("timestamp", System.currentTimeMillis());
            minecraftMessage.put("token", token);

            String jsonMessage = new ObjectMapper().writeValueAsString(minecraftMessage);
            minecraftWebSocketHandler.sendToMinecraft(jsonMessage);

            System.out.println("✅ Message sent to Minecraft: " + jsonMessage);

            return ResponseEntity.ok().body(Map.of(
                    "status", "success",
                    "message", "Restoration request sent to Minecraft server",
                    "logId", id,
                    "player", player
            ));

        } catch (Exception e) {
            System.err.println("❌ Error in backItem: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
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