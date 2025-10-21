package ru.optimus.crashpusher.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.optimus.crashpusher.discord.DiscordManager;
import ru.optimus.crashpusher.model.AdminConfirmationToken;
import ru.optimus.crashpusher.repository.AdminConfirmationTokenRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminTokenService {

    private final AdminConfirmationTokenRepository tokenRepository;
    private final DiscordManager discordService;

    @Value("${bot.channel.url}")
    private String channel;

    // Генерация токена
    public String generateAdminConfirmationToken() {
        // Генерируем уникальный токен
        String token = generateSecureToken();

        // Сохраняем в базу
        AdminConfirmationToken tokenEntity = new AdminConfirmationToken(token);
        tokenRepository.save(tokenEntity);

        // Отправляем в Discord
        discordService.sendAdminConfirmationToken(token, channel);

        System.out.println("✅ Admin token generated: " + token + " (expires at: " + tokenEntity.getExpiresAt() + ")");

        return token;
    }

    // Валидация токена
    public boolean validateAdminToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            System.out.println("❌ Admin token validation failed: token is null or empty");
            return false;
        }

        // Ищем неиспользованный токен
        Optional<AdminConfirmationToken> tokenEntity = tokenRepository.findByTokenAndUsedFalse(token);

        if (tokenEntity.isEmpty()) {
            System.out.println("❌ Admin token validation failed: token not found or already used - " + token);
            return false;
        }

        AdminConfirmationToken foundToken = tokenEntity.get();

        // Проверяем срок действия
        if (!foundToken.isValid()) {
            System.out.println("❌ Admin token validation failed: token expired - " + token);
            // Помечаем как использованный если просрочен
            foundToken.markAsUsed();
            tokenRepository.save(foundToken);
            return false;
        }

        System.out.println("✅ Admin token validation successful: " + token);
        return true;
    }

    // Использование токена (пометить как использованный)
    public boolean useAdminToken(String token) {
        Optional<AdminConfirmationToken> tokenEntity = tokenRepository.findByTokenAndUsedFalse(token);

        if (tokenEntity.isPresent() && tokenEntity.get().isValid()) {
            AdminConfirmationToken foundToken = tokenEntity.get();
            foundToken.markAsUsed();
            tokenRepository.save(foundToken);
            System.out.println("✅ Admin token marked as used: " + token);
            return true;
        }

        System.out.println("❌ Failed to use admin token: invalid or not found - " + token);
        return false;
    }

    // Генерация безопасного токена
    private String generateSecureToken() {
        // Используем UUID + timestamp для уникальности
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(8);
        return "ADM-" + uuid + timestamp;
    }

    // Очистка просроченных токенов
    @Scheduled(fixedRate = 300000) // Каждые 5 минут
    @Transactional
    public void cleanupExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();

        // Находим все просроченные неиспользованные токены
        List<AdminConfirmationToken> expiredTokens = tokenRepository.findByExpiresAtBeforeAndUsedFalse(now);

        // Помечаем их как использованные
        for (AdminConfirmationToken token : expiredTokens) {
            token.markAsUsed();
        }

        tokenRepository.saveAll(expiredTokens);

        // Удаляем старые использованные токены (старше 7 дней)
        LocalDateTime weekAgo = now.minusDays(7);
        tokenRepository.deleteExpiredTokens(weekAgo);

        if (!expiredTokens.isEmpty()) {
            System.out.println("🧹 Cleaned up " + expiredTokens.size() + " expired admin tokens");
        }
    }

    // Получить информацию о токене (для отладки)
    public Optional<AdminConfirmationToken> getTokenInfo(String token) {
        return tokenRepository.findByTokenAndUsedFalse(token);
    }
}