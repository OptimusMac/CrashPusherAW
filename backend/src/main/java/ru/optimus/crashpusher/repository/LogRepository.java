package ru.optimus.crashpusher.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.optimus.crashpusher.model.Log;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LogRepository extends JpaRepository<Log, Long>, JpaSpecificationExecutor<Log> {

    /**
     * Подсчитать количество уникальных игроков (нативный запрос для PostgreSQL)
     */
    @Query(value = "SELECT COUNT(DISTINCT (value->>'player')) FROM logs", nativeQuery = true)
    Long countDistinctPlayers();

    /**
     * Статистика логов по датам (группировка по дням)
     */
    @Query(value = "SELECT DATE(created_at), COUNT(*) FROM logs GROUP BY DATE(created_at) ORDER BY DATE(created_at)", nativeQuery = true)
    List<Object[]> countLogsByDate();

    /**
     * Найти уникальные типы из JSON поля value (нативный запрос)
     */
    @Query(value = "SELECT DISTINCT value->>'type' FROM logs WHERE value->>'type' IS NOT NULL ORDER BY value->>'type'", nativeQuery = true)
    List<String> findDistinctTypes();

    /**
     * Найти уникальных игроков из JSON поля value (нативный запрос)
     */
    @Query(value = "SELECT DISTINCT value->>'player' FROM logs WHERE value->>'player' IS NOT NULL ORDER BY value->>'player'", nativeQuery = true)
    List<String> findDistinctPlayers();

    /**
     * Статистика логов по типам (нативный запрос)
     */
    @Query(value = "SELECT value->>'type', COUNT(*) FROM logs WHERE value->>'type' IS NOT NULL GROUP BY value->>'type'", nativeQuery = true)
    List<Object[]> countLogsByType();

    /**
     * Найти логи по дате создания с пагинацией
     */
    Page<Log> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    /**
     * Найти логи после указанной даты
     */
    Page<Log> findByCreatedAtAfter(LocalDateTime date, Pageable pageable);

    /**
     * Найти логи до указанной даты
     */
    Page<Log> findByCreatedAtBefore(LocalDateTime date, Pageable pageable);

    /**
     * Найти лог по ID
     */
    Optional<Log> findById(Long id);
}