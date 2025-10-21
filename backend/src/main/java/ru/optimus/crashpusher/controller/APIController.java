package ru.optimus.crashpusher.controller;


import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import ru.optimus.crashpusher.dto.*;
import ru.optimus.crashpusher.model.Crash;
import ru.optimus.crashpusher.model.User;
import ru.optimus.crashpusher.model.UserCrash;
import ru.optimus.crashpusher.service.CrashService;

import org.springframework.web.bind.annotation.*;
import ru.optimus.crashpusher.service.UserCrashService;
import ru.optimus.crashpusher.service.UserService;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@AllArgsConstructor
@Slf4j
public class APIController {

    private final UserCrashService userCrashService;
    private final CrashService crashService;
    private final UserService userService;

    @GetMapping("/users")
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
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }


    @GetMapping("/users/{id}/crashes")
    public ResponseEntity<List<Map<String, Object>>> getUserCrashes(
            @PathVariable("id") Long userId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "50") int size
    ) {
        List<Crash> crashes = userCrashService.getCrashesByUser(userId);

        int fromIndex = Math.min(page * size, crashes.size());
        int toIndex = Math.min(fromIndex + size, crashes.size());
        List<Crash> pageCrashes = crashes.subList(fromIndex, toIndex);

        List<Map<String, Object>> result = pageCrashes.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("createdAt", c.getId());
            map.put("summary", c.getContent() != null && c.getContent().length() > 100
                    ? c.getContent().substring(0, 100)
                    : c.getContent());
            return map;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/crashes/{id}")
    public ResponseEntity<Crash> getCrashById(@PathVariable("id") Long crashId) {
        Crash crash = crashService.getCrashById(crashId);
        if (crash == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(crash);
    }

    @GetMapping("/crashes")
    public ResponseEntity<List<Map<String, Object>>> getGlobalCrashes(
            @RequestParam(value = "grouped", required = false, defaultValue = "false") boolean grouped,
            @RequestParam(value = "q", required = false, defaultValue = "") String q,
            @RequestParam(value = "sort", required = false, defaultValue = "count_desc") String sort
    ) {
        List<Crash> allCrashes = crashService.getGlobalCrashes();

        if (!q.isEmpty()) {
            allCrashes = allCrashes.stream()
                    .filter(c -> c.getContent() != null && c.getContent().toLowerCase().contains(q.toLowerCase()))
                    .toList();
        }

        if (!grouped) {
            List<Map<String, Object>> result = allCrashes.stream().map(c -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", c.getId());
                map.put("userId", c.getUserCrash() != null ? c.getUserCrash().getId() : null);
                map.put("content", c.getContent());
                map.put("isFix", c.isFix());
                map.put("createAt", c.getCreateAt());
                return map;
            }).toList();
            return ResponseEntity.ok(result);
        }

        Map<String, List<Crash>> groupedMap = allCrashes.stream()
                .collect(Collectors.groupingBy(c -> c.getContent() != null ? c.getContent() : ""));

        List<Map<String, Object>> result = groupedMap.entrySet().stream().map(e -> {
            List<Crash> crashes = e.getValue();
            if (crashes.isEmpty()) return null;

            if (sort.equals("date_desc")) {
                crashes = crashes.stream()
                        .sorted((a, b) -> b.getCreateAt().compareTo(a.getCreateAt()))
                        .toList();
            } else if (sort.equals("date_asc")) {
                crashes = crashes.stream()
                        .sorted(Comparator.comparing(Crash::getCreateAt))
                        .toList();
            }

            Crash first = crashes.getFirst();
            Crash last = crashes.getLast();

            boolean hasFix = crashes.stream().anyMatch(Crash::isFix);

            Map<String, Object> map = new HashMap<>();
            map.put("id", first.getId());
            map.put("signature", e.getKey());
            map.put("count", crashes.size());
            map.put("lastSeen", last.getId());
            map.put("example", e.getKey());
            map.put("exampleId", first.getId());
            map.put("examplePlayer", first.getUserCrash() != null ? first.getUserCrash().getUsername() : "-");
            map.put("isFix", hasFix);
            map.put("createAt", first.getCreateAt());
            map.put("lastCreateAt", last.getCreateAt());
            return map;
        }).filter(Objects::nonNull).toList();

        if (sort.equals("count_desc")) {
            result = result.stream()
                    .sorted((a, b) -> Long.compare((Integer) b.get("count"), (Integer) a.get("count")))
                    .toList();
        }
        else if (sort.equals("date_desc")) {
            result = result.stream()
                    .sorted((a, b) -> ((LocalDateTime) b.get("createAt")).compareTo((LocalDateTime) a.get("createAt")))
                    .toList();
        } else if (sort.equals("date_asc")) {
            result = result.stream()
                    .sorted(Comparator.comparing(a -> ((LocalDateTime) a.get("createAt"))))
                    .toList();
        }

        return ResponseEntity.ok(result);
    }


    @PatchMapping("/crashes/{id}/fix")
    public ResponseEntity<?> setFix(@PathVariable long id,  @RequestBody UpdateCrashFixRequest request){
        return ResponseEntity.ok(crashService.setFix(id, request.getIsFix()));
    }

    // GET /crashes/top?limit=
    @GetMapping("/crashes/top")
    public ResponseEntity<List<Map<String, Object>>> getTopCrashes(
            @RequestParam(value = "limit", defaultValue = "10") int limit
    ) {
        List<Crash> allCrashes = crashService.getGlobalCrashes();

        Map<String, Long> countMap = allCrashes.stream()
                .collect(Collectors.groupingBy(c -> c.getContent() != null ? c.getContent() : "", Collectors.counting()));

        List<Map<String, Object>> top = countMap.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(limit)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("signature", e.getKey());
                    map.put("count", e.getValue());
                    map.put("example", e.getKey());
                    return map;
                })
                .toList();

        return ResponseEntity.ok(top);
    }
}
