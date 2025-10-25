package ru.optimus.crashpusher.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.optimus.crashpusher.dto.LogDTO;
import ru.optimus.crashpusher.dto.LogFilterDTO;
import ru.optimus.crashpusher.model.Log;
import ru.optimus.crashpusher.model.LogType;
import ru.optimus.crashpusher.service.LogService;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Slf4j(topic = "logger")
@RestController
@RequestMapping("/api/admin/logs")
@RequiredArgsConstructor
public class LogsController {

    private final LogService logService;

    /**
     * GET /admin/logs - Get logs list with pagination and date filtering
     */
    @GetMapping("/fetch")
    public ResponseEntity<Page<LogDTO>> getLogs(LogFilterDTO filter) {
        log.info("GET /admin/logs - filters: {}", filter);

        try {
            Pageable pageable = createPageable(filter);
            Page<Log> logs = logService.getLogsWithFilters(filter, pageable);
            return ResponseEntity.ok(logs.map(LogDTO::of));
        } catch (Exception e) {
            log.error("Error fetching logs with filters: {}", filter, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /admin/logs/stats - Get logs statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getLogsStats(LogFilterDTO filter) {
        log.info("GET /admin/logs/stats - filters: {}", filter);

        try {
            Map<String, Object> stats = logService.getLogsStats(filter);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching logs stats with filters: {}", filter, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /admin/logs/{logId} - Get log by ID
     */
    @GetMapping("/{logId}")
    public ResponseEntity<LogDTO> getLogById(@PathVariable Long logId) {
        log.info("GET /admin/logs/{}", logId);

        try {
            Log log = logService.findById(logId);
            return ResponseEntity.ok(LogDTO.of(log));
        } catch (RuntimeException e) {
            log.warn("Log not found with id: {}", logId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching log with id: {}", logId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * DELETE /admin/logs/{logId} - Delete log by ID
     */
    @DeleteMapping("/{logId}")
    public ResponseEntity<Void> deleteLog(@PathVariable Long logId) {
        log.info("DELETE /admin/logs/{}", logId);

        try {
            logService.deleteLog(logId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting log with id: {}", logId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * DELETE /admin/logs/batch - Delete multiple logs
     */
    @DeleteMapping("/batch")
    public ResponseEntity<Void> deleteLogs(@RequestBody Map<String, List<Long>> request) {
        List<Long> logIds = request.get("logIds");
        log.info("DELETE /admin/logs/batch - ids: {}", logIds);

        if (logIds == null || logIds.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            logService.deleteLogs(logIds);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting logs with ids: {}", logIds, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /admin/logs/types - Get available log types
     */
    @GetMapping("/types")
    public ResponseEntity<List<String>> getLogTypes() {
        log.info("GET /admin/logs/types");

        try {
            List<String> types = logService.getLogTypes();
            return ResponseEntity.ok(types);
        } catch (Exception e) {
            log.error("Error fetching log types", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /admin/logs/players - Get players list from logs
     */
    @GetMapping("/players")
    public ResponseEntity<List<String>> getLogPlayers() {
        log.info("GET /admin/logs/players");

        try {
            List<String> players = logService.getLogPlayers();
            return ResponseEntity.ok(players);
        } catch (Exception e) {
            log.error("Error fetching log players", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/event-types")
    public ResponseEntity<?> eventTypes(){
        return ResponseEntity.ok(Arrays.stream(LogType.values()).map(Enum::name));
    }

    /**
     * GET /admin/logs/export - Export logs to JSON file
     */
    @GetMapping("/export")
    public ResponseEntity<Resource> exportLogs(LogFilterDTO filter) {
        log.info("GET /admin/logs/export - filters: {}", filter);

        try {
            List<Log> logs = logService.getAllLogs(filter);

            // Convert logs to JSON string
            String jsonData = convertLogsToJson(logs);
            byte[] jsonBytes = jsonData.getBytes();

            ByteArrayResource resource = new ByteArrayResource(jsonBytes);

            String filename = String.format("logs_export_%s.json", LocalDateTime.now().toString().replace(":", "-"));

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .contentType(MediaType.APPLICATION_JSON)
                    .contentLength(jsonBytes.length)
                    .body(resource);

        } catch (Exception e) {
            log.error("Error exporting logs with filters: {}", filter, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * POST /admin/logs - Create new log
     */
    @PostMapping
    public ResponseEntity<LogDTO> createLog(@RequestBody Log logs) {
        log.info("POST /admin/logs - creating new log");

        System.out.println(logs.getValue());
        try {
            if (logs.getCreatedAt() == null) {
                logs.setCreatedAt(LocalDateTime.now());
            }

            Log createdLog = logService.create(logs);

            return ResponseEntity.ok(LogDTO.of(createdLog));
        } catch (Exception e) {
            log.error("Error creating log", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * PUT /admin/logs/{logId} - Update log (if needed)
     */
    @PutMapping("/{logId}")
    public ResponseEntity<LogDTO> updateLog(@PathVariable Long logId, @RequestBody Log logs) {
        log.info("PUT /admin/logs/{} - updating log", logId);

        try {
            Log existingLog = logService.findById(logId);

            if (logs.getValue() != null) {
                existingLog.setValue(logs.getValue());
            }
            if (logs.getCreatedAt() != null) {
                existingLog.setCreatedAt(logs.getCreatedAt());
            }

            Log updatedLog = logService.create(existingLog); // save acts as update when id exists
            return ResponseEntity.ok(LogDTO.of(updatedLog));
        } catch (RuntimeException e) {
            log.warn("Log not found with id: {}", logId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error updating log with id: {}", logId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /admin/logs/count - Get total logs count with optional filtering
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getLogsCount(LogFilterDTO filter) {
        log.info("GET /admin/logs/count - filters: {}", filter);

        try {
            Specification<Log> spec = logService.buildSpecification(filter);
            long count = logService.getLogsCount(spec);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            log.error("Error counting logs with filters: {}", filter, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Create Pageable from DTO with validation
     */
    private Pageable createPageable(LogFilterDTO filter) {
        String sortField = filter.getSort() != null && !filter.getSort().isEmpty()
                ? filter.getSort()
                : "createdAt";

        String order = filter.getOrder() != null && !filter.getOrder().isEmpty()
                ? filter.getOrder()
                : "desc";

        Sort.Direction direction = "asc".equalsIgnoreCase(order)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        int page = filter.getPage() != null && filter.getPage() >= 0
                ? filter.getPage()
                : 0;

        int size = filter.getSize() != null && filter.getSize() > 0 && filter.getSize() <= 1000
                ? filter.getSize()
                : 50;

        Sort sort = Sort.by(direction, sortField);
        return PageRequest.of(page, size, sort);
    }

    /**
     * Convert logs to JSON string (simplified implementation)
     */
    private String convertLogsToJson(List<Log> logs) {
        StringBuilder json = new StringBuilder();
        json.append("{\n  \"logs\": [\n");

        for (int i = 0; i < logs.size(); i++) {
            Log log = logs.get(i);
            json.append("    {\n");
            json.append("      \"id\": ").append(log.getId()).append(",\n");
            json.append("      \"createdAt\": \"").append(log.getCreatedAt()).append("\",\n");
            json.append("      \"value\": ").append(log.getValue() != null ? log.getValue().toString() : "{}");

            if (i < logs.size() - 1) {
                json.append("\n    },\n");
            } else {
                json.append("\n    }\n");
            }
        }

        json.append("  ]\n}");
        return json.toString();
    }
}