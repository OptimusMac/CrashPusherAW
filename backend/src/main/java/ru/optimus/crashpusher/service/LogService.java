package ru.optimus.crashpusher.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import ru.optimus.crashpusher.dto.LogFilterDTO;
import ru.optimus.crashpusher.model.Log;
import ru.optimus.crashpusher.repository.LogRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LogService {

    private final LogRepository logRepository;

    /**
     * Получить все логи с фильтрацией по дате и пагинацией
     */
    public Page<Log> getLogsWithFilters(LogFilterDTO filter, Pageable pageable) {
        log.debug("Fetching logs with filters: {}, pageable: {}", filter, pageable);

        Specification<Log> spec = buildSpecification(filter);
        return logRepository.findAll(spec, pageable);
    }

    /**
     * Получить все логи без пагинации (для экспорта)
     */
    public List<Log> getAllLogs(LogFilterDTO filter) {
        log.debug("Fetching all logs with filters: {}", filter);

        Specification<Log> spec = buildSpecification(filter);
        return logRepository.findAll(spec);
    }

    /**
     * Получить статистику по логам
     */
    public Map<String, Object> getLogsStats(LogFilterDTO filter) {
        log.debug("Fetching logs stats with filters: {}", filter);

        Specification<Log> spec = buildSpecification(filter);

        long totalLogs = logRepository.count(spec);
        long uniquePlayers = logRepository.countDistinctPlayers();

        // Статистика по датам
        List<Object[]> logsByDateList = logRepository.countLogsByDate();
        Map<String, Long> logsByDate = logsByDateList.stream()
                .collect(Collectors.toMap(
                        obj -> obj[0].toString(),
                        obj -> ((Number) obj[1]).longValue()
                ));

        // Статистика по типам
        List<Object[]> logsByTypeList = logRepository.countLogsByType();
        Map<String, Long> logsByType = logsByTypeList.stream()
                .collect(Collectors.toMap(
                        obj -> obj[0] != null ? obj[0].toString() : "UNKNOWN",
                        obj -> ((Number) obj[1]).longValue()
                ));

        return Map.of(
                "total", totalLogs,
                "uniquePlayers", uniquePlayers,
                "byDate", logsByDate,
                "byType", logsByType
        );
    }

    /**
     * Получить уникальные типы логов
     */
    public List<String> getLogTypes() {
        return logRepository.findDistinctTypes();
    }

    /**
     * Получить уникальных игроков
     */
    public List<String> getLogPlayers() {
        return logRepository.findDistinctPlayers();
    }

    /**
     * Найти лог по ID
     */
    public Log findById(Long id) {
        return logRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Log not found with id: " + id));
    }

    /**
     * Удалить лог по ID
     */
    public void deleteLog(Long id) {
        log.debug("Deleting log with id: {}", id);
        logRepository.deleteById(id);
    }

    /**
     * Удалить несколько логов
     */
    public void deleteLogs(List<Long> ids) {
        log.debug("Deleting logs with ids: {}", ids);
        logRepository.deleteAllById(ids);
    }

    /**
     * Создать новый лог
     */
    public Log create(Log log) {
        return logRepository.save(log);
    }

    /**
     * Build specification (сделай метод public или package-private)
     */
    public Specification<Log> buildSpecification(LogFilterDTO filter) {
        return unrestricted()
                .and(inDateRange(filter.getDateFrom(), filter.getDateTo()));
    }

    private Specification<Log> unrestricted() {
        return (root, query, cb) -> null;
    }

    /**
     * Count logs with specification
     */
    public long getLogsCount(Specification<Log> spec) {
        return logRepository.count(spec);
    }



    private Specification<Log> inDateRange(LocalDateTime from, LocalDateTime to) {
        return (root, query, cb) -> {
            if (from == null && to == null) {
                return null;
            }

            if (from != null && to != null) {
                return cb.between(root.get("createdAt"), from, to);
            } else if (from != null) {
                return cb.greaterThanOrEqualTo(root.get("createdAt"), from);
            } else {
                return cb.lessThanOrEqualTo(root.get("timestamp"), to);
            }
        };
    }
}