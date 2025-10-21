package ru.optimus.crashpusher.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.optimus.crashpusher.model.AdminConfirmationToken;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AdminConfirmationTokenRepository extends JpaRepository<AdminConfirmationToken, Long> {

    Optional<AdminConfirmationToken> findByTokenAndUsedFalse(String token);

    List<AdminConfirmationToken> findByExpiresAtBeforeAndUsedFalse(LocalDateTime dateTime);

    boolean existsByTokenAndUsedFalse(String token);

    @Modifying
    @Query("DELETE FROM AdminConfirmationToken t WHERE t.expiresAt < :dateTime")
    void deleteExpiredTokens(@Param("dateTime") LocalDateTime dateTime);
}