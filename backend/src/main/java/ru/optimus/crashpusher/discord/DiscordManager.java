package ru.optimus.crashpusher.discord;

import lombok.*;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.components.actionrow.ActionRow;
import net.dv8tion.jda.api.components.buttons.Button;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.MessageEmbed;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.entities.emoji.Emoji;
import net.dv8tion.jda.api.utils.FileUpload;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@RequiredArgsConstructor
public class DiscordManager {
    private final DiscordBot bot;
    @Getter
    @Setter
    private static boolean enabled = false;
    private static final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss");

    @Value("${cors}")
    private String corsIp;

    /**
     * Отправка уведомления о краше с прикрепленным файлом
     */
    public void sendCrashNotification(String playerName, String crashContent, String originalFileName) {
        System.out.println(bot);
        System.out.println(enabled);
        if (!enabled || bot == null) {
            System.err.println("Discord бот не инициализирован!");
            return;
        }

        CompletableFuture.runAsync(() -> {
            Path tempFile = null;
            try {
                tempFile = createTempCrashFile(playerName, crashContent, originalFileName);

                sendCrashReportWithFile(playerName, crashContent, tempFile).join();

            } catch (Exception e) {
                System.err.println("Ошибка отправки краш-репорта в Discord: " + e.getMessage());
            } finally {
                // Удаляем файл в finally блоке
                if (tempFile != null) {
                    try {
                        Files.deleteIfExists(tempFile);
                        System.out.println("Временный файл удален: " + tempFile.getFileName());
                    } catch (IOException e) {
                        System.err.println("Не удалось удалить временный файл: " + tempFile + " - " + e.getMessage());
                    }
                }
            }
        });
    }

    /**
     * Создание временного файла для краш-репорта
     */
    private static Path createTempCrashFile(String playerName, String crashContent, String originalFileName) throws IOException {
        String timestamp = dateFormat.format(new Date());
        String safePlayerName = playerName.replaceAll("[^a-zA-Z0-9-_]", "_");
        String fileName = String.format("crash_%s_%s.txt", safePlayerName, timestamp);

        Path tempDir = Paths.get("./temp_crash_reports");
        if (!Files.exists(tempDir)) {
            Files.createDirectories(tempDir);
        }

        Path tempFile = tempDir.resolve(fileName);

        Files.write(tempFile, crashContent.getBytes(StandardCharsets.UTF_8));
        return tempFile;
    }

    /**
     * Отправка краш-репорта с прикрепленным файлом (возвращает CompletableFuture)
     */
    private CompletableFuture<Void> sendCrashReportWithFile(String playerName, String crashContent, Path crashFile) {
        return CompletableFuture.runAsync(() -> {
            try {
                String shortSummary = extractCrashSummary(crashContent);

                String message = String.format(
                        "🚨 **Краш-репорт от игрока** `%s`\n" +
                                "📊 **Краткое описание:** `%s`\n" +
                                "📁 **Полный отчет прикреплен ниже** ⬇️\n" +
                                "🕒 **Время:** <t:%d:F>",
                        playerName, shortSummary, System.currentTimeMillis() / 1000
                );

                File file = crashFile.toFile();
                FileUpload fileUpload = FileUpload.fromData(file, crashFile.getFileName().toString());

                // Ждем завершения отправки
                bot.sendMessageWithFile(message, fileUpload).join();

                System.out.println("Краш-репорт отправлен в Discord с файлом: " + crashFile.getFileName());

            } catch (Exception e) {
                System.err.println("Ошибка отправки файла в Discord: " + e.getMessage());
                throw new RuntimeException(e); // Пробрасываем исключение чтобы обработать в основном потоке
            }
        });
    }

    /**
     * Извлечение краткого описания краша
     */
    private static String extractCrashSummary(String crashContent) {
        // Ищем основное исключение
        if (crashContent.contains("java.lang.NullPointerException")) {
            return "NullPointerException";
        } else if (crashContent.contains("java.lang.ArrayIndexOutOfBoundsException")) {
            return "ArrayIndexOutOfBoundsException";
        } else if (crashContent.contains("java.io.IOException")) {
            return "IOException";
        } else if (crashContent.contains("OutOfMemoryError")) {
            return "OutOfMemoryError";
        }

        // Пытаемся извлечь первую строку с исключением
        String[] lines = crashContent.split("\n");
        for (String line : lines) {
            if (line.contains("Exception") || line.contains("Error")) {
                // Берем только тип исключения без полного пути
                String[] parts = line.trim().split("\\s+");
                for (String part : parts) {
                    if (part.contains("Exception") || part.contains("Error")) {
                        return part.replace(":", "").trim();
                    }
                }
                return line.trim();
            }
        }

        return "Unknown Error";
    }

    /**
     * Отправка сообщения с файлом
     */
    public void sendMessageWithFile(String message, File file) {
        if (!enabled || bot == null) return;

        try {
            FileUpload fileUpload = FileUpload.fromData(file, file.getName());
            bot.sendMessageWithFile(message, fileUpload);
        } catch (Exception e) {
            System.err.println("Ошибка отправки файла: " + e.getMessage());
        }
    }

    public CompletableFuture<Void> sendAdminConfirmationToken(String token, String channelName){
        return CompletableFuture.runAsync(() -> {
            TextChannel channel = bot.findTextChannelByName(channelName);
            if (channel == null) {
                System.err.println("Канал не найден: " + channelName);
                return;
            }
            channel.sendMessage("Токен для подтверждения регистрации %s".formatted(token)).queue();
        });
    }

    public CompletableFuture<Void> sendEmbedWithButtons(String token, String channelName, int expirationHours, String username) {
        return CompletableFuture.runAsync(() -> {
            try {
                TextChannel channel = bot.findTextChannelByName(channelName);
                if (channel == null) {
                    System.err.println("Канал не найден: " + channelName);
                    return;
                }

                // Валидация и формирование URL
                String url = createValidUrl(token);
                if (url == null) {
                    System.err.println("Не удалось создать валидный URL для токена: " + token);
                    return;
                }

                // Получаем гильдию для доступа к пользователям
                Guild guild = channel.getGuild();

                // Создаем сообщение с учетом языка
                MessageData messageData = createLocalizedMessage(token, url, expirationHours, guild, username);

                MessageEmbed embed = new EmbedBuilder()
                        .setTitle(messageData.getTitle())
                        .setDescription(messageData.getDescription())
                        .setColor(0x5865F2)
                        .addField(messageData.getFields().get(0).getName(),
                                messageData.getFields().get(0).getValue(), false)
                        .addField(messageData.getFields().get(1).getName(),
                                messageData.getFields().get(1).getValue(), true)
                        .addField(messageData.getFields().get(2).getName(),
                                messageData.getFields().get(2).getValue(), true)
                        .addField(messageData.getFields().get(3).getName(),
                                messageData.getFields().get(3).getValue(), false)
                        .setThumbnail("https://cdn-icons-png.flaticon.com/512/3063/3063817.png")
                        .setFooter(messageData.getFooter(),
                                "https://cdn-icons-png.flaticon.com/512/1077/1077012.png")
                        .setTimestamp(java.time.Instant.now())
                        .build();

                ActionRow actionRow = ActionRow.of(
                        Button.link(url, messageData.getButton1())
                                .withEmoji(Emoji.fromUnicode("📊")),
                        Button.secondary("copy_token", messageData.getButton2())
                                .withEmoji(Emoji.fromUnicode("📋"))
                );

                channel.sendMessageEmbeds(embed)
                        .setComponents(actionRow)
                        .complete();

                System.out.println("Эмбед успешно отправлен в канал: " + channelName);

            } catch (Exception e) {
                System.err.println("Ошибка отправки эмбеда в Discord: " + e.getMessage());
                e.printStackTrace();
            }
        });
    }

    /**
     * Создание валидного URL с обработкой ошибок
     */
    private String createValidUrl(String token) {
        try {
            if (corsIp == null || corsIp.trim().isEmpty()) {
                System.err.println("corsIp не настроен в конфигурации");
                return null;
            }

            // Очищаем токен от невидимых символов и лишних пробелов
            String cleanToken = token.trim()
                    .replaceAll("\\p{C}", "") // Удаляем все control-символы и невидимые Unicode
                    .replaceAll("[^\\x20-\\x7E]", ""); // Удаляем все non-ASCII символы

            // Очищаем corsIp от лишних пробелов и протоколов
            String cleanCorsIp = corsIp.trim();

            // Удаляем протокол если он уже есть (чтобы не было дублирования)
            if (cleanCorsIp.startsWith("http://") || cleanCorsIp.startsWith("https://")) {
                cleanCorsIp = cleanCorsIp.replaceFirst("^https?://", "");
            }

            // Формируем URL с протоколом
            String url = "http://" + cleanCorsIp + "/users?token=" + cleanToken;


            System.out.println("Сформирован URL: " + url);
            System.out.println("Длина токена: " + cleanToken.length());
            return url;

        } catch (Exception e) {
            System.err.println("Ошибка при создании URL: " + e.getMessage());
            return null;
        }
    }

    /**
     * Простая валидация URL
     */
    private boolean isValidUrl(String url) {
        try {
            // Проверяем базовую структуру URL
            return url != null &&
                    url.startsWith("http://") &&
                    url.length() > 10 && // Минимальная длина валидного URL
                    url.contains(".") && // Должна быть точка (домен)
                    !url.contains(" ") && // Не должно быть пробелов
                    url.chars().allMatch(ch -> ch >= 32 && ch <= 126); // Только ASCII символы
        } catch (Exception e) {
            return false;
        }
    }
    @Data
    // Класс для хранения локализованных данных
    private static class MessageData {
        private String title;
        private String description;
        private List<MessageEmbed.Field> fields;
        private String footer;
        private String button1;
        private String button2;
    }

    private MessageData createLocalizedMessage(String token, String url, int hours, Guild guild, String username) {
        // Анализируем языки пользователей в канале/гильдии
        String dominantLanguage = detectDominantLanguage(guild);

        if ("ru".equals(dominantLanguage)) {
            return createRussianMessage(token, url, hours, username);
        } else {
            return createEnglishMessage(token, url, hours);
        }
    }

    private String detectDominantLanguage(Guild guild) {
        // Здесь можно добавить более сложную логику определения языка
        // Пока возвращаем русский как основной
        return "ru";
    }

    private MessageData createRussianMessage(String token, String url, int hours, String username) {
        MessageData data = new MessageData();
        data.setTitle("🔐 Новый токен доступа создан для %s".formatted(username));
        data.setDescription("Сгенерирован новый безопасный токен доступа для панели аналитики крашей");
        data.setFields(Arrays.asList(
                new MessageEmbed.Field("🌐 URL для доступа", "Нажмите кнопку ниже для перехода", false),
                new MessageEmbed.Field("⏰ Истекает через", hours + " часов", true),
                new MessageEmbed.Field("🆔 ID токена", "||" + token + "||", true),
                new MessageEmbed.Field("📊 Возможности панели",
                        "• Аналитика крашей в реальном времени\n• Статистика пользователей\n• Отслеживание исключений\n• Метрики производительности",
                        false)
        ));
        data.setFooter("Система аналитики крашей • Безопасный доступ");
        data.setButton1("🚀 Открыть панель");
        data.setButton2("📋 Копировать токен");
        return data;
    }

    private MessageData createEnglishMessage(String token, String url, int hours) {
        MessageData data = new MessageData();
        data.setTitle("🔐 New Access Token Generated");
        data.setDescription("A new secure access token has been generated for the Crash Analytics Dashboard");
        data.setFields(Arrays.asList(
                new MessageEmbed.Field("🌐 Access URL", "Click the button below to access", false),
                new MessageEmbed.Field("⏰ Expires In", hours + " hours", true),
                new MessageEmbed.Field("🆔 Token ID", "||" + token + "||", true),
                new MessageEmbed.Field("📊 Dashboard Features",
                        "• Real-time crash analytics\n• User statistics\n• Exception tracking\n• Performance metrics",
                        false)
        ));
        data.setFooter("Crash Analytics System • Secure Access");
        data.setButton1("🚀 Open Dashboard");
        data.setButton2("📋 Copy Token");
        return data;
    }
}