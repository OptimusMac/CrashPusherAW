package ru.optimus.crashpusher.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.optimus.crashpusher.model.Crash;

import java.time.LocalDateTime;
import java.util.List;

public interface CrashRepository extends JpaRepository<Crash, Long> {
    List<Crash> findAllByUserCrashId(Long userId);

    long countByFix(boolean fix);
    long countByCreateAtBefore(LocalDateTime date);
    List<Crash> findByCreateAtAfter(LocalDateTime date);

    // Исправленные запросы с userCrash вместо user
    @Query("SELECT c.userCrash.username, COUNT(c), c.userCrash.id FROM Crash c WHERE c.createAt >= :startDate GROUP BY c.userCrash.id, c.userCrash.username ORDER BY COUNT(c) DESC")
    List<Object[]> findTopUsersByCrashes(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT f.frequency, COUNT(f.userId) FROM (" +
            "SELECT u.id as userId, COUNT(c) as frequency FROM UserCrash u LEFT JOIN u.crashes c GROUP BY u.id" +
            ") f GROUP BY f.frequency ORDER BY f.frequency")
    List<Object[]> findCrashFrequencyDistribution();

    @Query("SELECT HOUR(c.createAt), COUNT(c) FROM Crash c GROUP BY HOUR(c.createAt) ORDER BY HOUR(c.createAt)")
    List<Object[]> findCrashesByHour();

    @Query("SELECT COUNT(c) FROM Crash c WHERE c.createAt BETWEEN :startDate AND :endDate")
    long countByCreateAtBetween(@Param("startDate") LocalDateTime startDate,
                                @Param("endDate") LocalDateTime endDate);

}