package ru.optimus.crashpusher.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.optimus.crashpusher.model.Crash;
import ru.optimus.crashpusher.repository.CrashRepository;
import ru.optimus.crashpusher.repository.UserCrashRepository;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final CrashRepository crashRepository;
    private final UserCrashRepository userCrashRepository;

    public Map<String, Object> getOverallStatistics() {
        long totalCrashes = crashRepository.count();
        long uniqueUsers = userCrashRepository.count();
        long fixedCrashes = crashRepository.countByFix(true);

        double fixRate = totalCrashes > 0 ? (fixedCrashes * 100.0) / totalCrashes : 0;
        double avgCrashesPerUser = uniqueUsers > 0 ? (double) totalCrashes / uniqueUsers : 0;

        // Calculate changes (you might want to compare with previous period)
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        long previousCrashes = crashRepository.countByCreateAtBefore(weekAgo);
        long crashChange = totalCrashes - previousCrashes;

        return Map.of(
                "totalCrashes", totalCrashes,
                "uniqueUsers", uniqueUsers,
                "fixedCrashes", fixedCrashes,
                "fixRate", Math.round(fixRate),
                "avgCrashesPerUser", avgCrashesPerUser,
                "crashChange", crashChange,
                "userChange", 0, // Implement similar logic for users
                "avgChange", 0.0
        );
    }

    public Map<String, Object> getCrashTrends(String period) {
        LocalDateTime startDate = getStartDateForPeriod(period);
        List<Crash> crashes = crashRepository.findByCreateAtAfter(startDate);

        Map<String, Long> dailyTrends = crashes.stream()
                .collect(Collectors.groupingBy(
                        crash -> crash.getCreateAt().toLocalDate().toString(),
                        Collectors.counting()
                ));

        List<Map<String, Object>> trendsList = dailyTrends.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("date", entry.getKey());
                    map.put("count", entry.getValue());
                    return map;
                })
                .sorted(Comparator.comparing(m -> m.get("date").toString()))
                .toList();

        return Map.of("dailyTrends", trendsList);
    }

    public Map<String, Object> getTopPlayers(int limit, String period) {
        LocalDateTime startDate = getStartDateForPeriod(period);
        List<Object[]> results = crashRepository.findTopUsersByCrashes(startDate);

        List<Map<String, Object>> topPlayers = results.stream()
                .map(result -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("username", result[0]);
                    map.put("crashCount", result[1]);
                    map.put("userId", result[2]);
                    return map;
                })
                .toList();

        return Map.of("topPlayers", topPlayers);
    }

    public Map<String, Object> getCrashFrequencyDistribution() {
        List<Object[]> frequencyData = crashRepository.findCrashFrequencyDistribution();

        List<Map<String, Object>> distribution = frequencyData.stream()
                .map(result -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("frequency", result[0]);
                    map.put("users", result[1]);
                    return map;
                })
                .toList();

        return Map.of("frequencyDistribution", distribution);
    }
    public Map<String, Object> getFixStatusStatistics() {
        long fixed = crashRepository.countByFix(true);
        long notFixed = crashRepository.countByFix(false);

        List<Map<String, Object>> distribution = List.of(
                Map.of("name", "Fixed", "value", fixed, "color", "#10B981"),
                Map.of("name", "Not Fixed", "value", notFixed, "color", "#EF4444")
        );

        return Map.of("distribution", distribution);
    }


    public Map<String, Object> getHourlyDistribution() {
        List<Object[]> hourlyData = crashRepository.findCrashesByHour();

        List<Map<String, Object>> distribution = hourlyData.stream()
                .map(result -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("hour", result[0] + ":00");
                    map.put("count", result[1]);
                    return map;
                })
                .toList();


        return Map.of("hourlyDistribution", distribution);
    }

    public Map<String, Object> getExceptionStatistics(int limit) {
        // Extract exception types from crash content
        List<Crash> crashes = crashRepository.findAll();

        Map<String, Long> exceptionCounts = crashes.stream()
                .map(this::extractExceptionFromContent)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(
                        exception -> exception,
                        Collectors.counting()
                ));

        List<Map<String, Object>> topExceptions = exceptionCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("exception", entry.getKey());
                    map.put("count", entry.getValue());
                    return map;
                })
                .toList();

        return Map.of("topExceptions", topExceptions);
    }
    public Map<String, Object> getUserPatterns() {
        List<Crash> crashes = crashRepository.findAll();

        // Find most active hour
        Map<Integer, Long> hourCounts = crashes.stream()
                .collect(Collectors.groupingBy(
                        crash -> crash.getCreateAt().getHour(),
                        Collectors.counting()
                ));

        int mostActiveHour = hourCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(0);

        // Find top crash day
        Map<String, Long> dayCounts = crashes.stream()
                .collect(Collectors.groupingBy(
                        crash -> crash.getCreateAt().getDayOfWeek().toString(),
                        Collectors.counting()
                ));

        String topCrashDay = dayCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Unknown");

        long totalCrashes = crashes.size();
        long fixedCrashes = crashes.stream().filter(Crash::isFix).count();
        double resolutionRate = totalCrashes > 0 ? (fixedCrashes * 100.0) / totalCrashes : 0;

        return Map.of(
                "mostActiveHour", mostActiveHour + ":00",
                "topCrashDay", topCrashDay,
                "resolutionRate", Math.round(resolutionRate)
        );
    }

    public Map<String, Object> getRecentActivity(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<Crash> recentCrashes = crashRepository.findByCreateAtAfter(since);

        List<Map<String, Object>> activity = recentCrashes.stream()
                .map(crash -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", crash.getId());
                    map.put("username", crash.getUserCrash() != null ? crash.getUserCrash().getUsername() : "Unknown");
                    map.put("timestamp", crash.getCreateAt());
                    map.put("fixed", crash.isFix());
                    return map;
                })
                .sorted((m1, m2) -> {
                    LocalDateTime t1 = (LocalDateTime) m1.get("timestamp");
                    LocalDateTime t2 = (LocalDateTime) m2.get("timestamp");
                    return t2.compareTo(t1);
                })
                .toList();

        return Map.of("recentActivity", activity);
    }

    private String extractExceptionFromContent(Crash crash) {
        if (crash.getContent() == null) return null;

        // Simple regex to find exception patterns
        String content = crash.getContent();
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("([A-Za-z0-9_]+\\.)+[A-Za-z0-9_]+Exception");
        java.util.regex.Matcher matcher = pattern.matcher(content);

        if (matcher.find()) {
            return matcher.group();
        }
        return "UnknownException";
    }

    private LocalDateTime getStartDateForPeriod(String period) {
        return switch (period) {
            case "24h" -> LocalDateTime.now().minusHours(24);
            case "7d" -> LocalDateTime.now().minusDays(7);
            case "30d" -> LocalDateTime.now().minusDays(30);
            default -> LocalDateTime.of(2000, 1, 1, 0, 0); // All time
        };
    }
}