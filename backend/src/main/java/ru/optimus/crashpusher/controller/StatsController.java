package ru.optimus.crashpusher.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.optimus.crashpusher.service.StatsService;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/overall")
    public ResponseEntity<Map<String, Object>> getOverallStats() {
        return ResponseEntity.ok(statsService.getOverallStatistics());
    }

    @GetMapping("/trends")
    public ResponseEntity<Map<String, Object>> getCrashTrends(
            @RequestParam(defaultValue = "7d") String period) {
        return ResponseEntity.ok(statsService.getCrashTrends(period));
    }

    @GetMapping("/top-players")
    public ResponseEntity<Map<String, Object>> getTopPlayers(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "all") String period) {
        return ResponseEntity.ok(statsService.getTopPlayers(limit, period));
    }

    @GetMapping("/frequency")
    public ResponseEntity<Map<String, Object>> getCrashFrequency() {
        return ResponseEntity.ok(statsService.getCrashFrequencyDistribution());
    }

    @GetMapping("/fix-status")
    public ResponseEntity<Map<String, Object>> getFixStats() {
        return ResponseEntity.ok(statsService.getFixStatusStatistics());
    }

    @GetMapping("/hourly")
    public ResponseEntity<Map<String, Object>> getHourlyStats() {
        return ResponseEntity.ok(statsService.getHourlyDistribution());
    }

    @GetMapping("/exceptions")
    public ResponseEntity<Map<String, Object>> getExceptionStats(
            @RequestParam(defaultValue = "15") int limit) {
        return ResponseEntity.ok(statsService.getExceptionStatistics(limit));
    }

    @GetMapping("/user-patterns")
    public ResponseEntity<Map<String, Object>> getUserPatterns() {
        return ResponseEntity.ok(statsService.getUserPatterns());
    }

    @GetMapping("/recent-activity")
    public ResponseEntity<Map<String, Object>> getRecentActivity(
            @RequestParam(defaultValue = "24") int hours) {
        return ResponseEntity.ok(statsService.getRecentActivity(hours));
    }
}