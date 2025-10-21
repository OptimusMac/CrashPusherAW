package ru.optimus.crashpusher.discord;

import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.JDABuilder;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.requests.GatewayIntent;
import net.dv8tion.jda.api.utils.FileUpload;

import javax.security.auth.login.LoginException;
import java.util.concurrent.CompletableFuture;

public class DiscordBot {
    private final JDA jda;
    private final String defaultChannelName;

    public DiscordBot(String token, String defaultChannelName) throws InterruptedException {
        this.defaultChannelName = defaultChannelName;

        this.jda = JDABuilder.createDefault(token)
                .enableIntents(GatewayIntent.GUILD_MESSAGES)
                .build();

        this.jda.awaitReady();
        System.out.println("Discord бот запущен: " + jda.getSelfUser().getAsTag());
    }

    /**
     * Отправка сообщения с файлом (СИНХРОННАЯ версия)
     */
    public CompletableFuture<Void> sendMessageWithFile(String message, FileUpload fileUpload) {
        return sendMessageWithFileToChannel(defaultChannelName, message, fileUpload);
    }

    /**
     * Отправка сообщения с файлом в конкретный канал (СИНХРОННАЯ версия)
     */
    public CompletableFuture<Void> sendMessageWithFileToChannel(String channelName, String message, FileUpload fileUpload) {
        return CompletableFuture.runAsync(() -> {
            try {
                TextChannel channel = findTextChannelByName(channelName);
                if (channel != null) {
                    channel.sendMessage(message)
                            .addFiles(fileUpload)
                            .complete();

                    System.out.println("Сообщение с файлом отправлено в канал: " + channelName);
                } else {
                    System.err.println("Канал не найден: " + channelName);
                    throw new RuntimeException("Channel not found: " + channelName);
                }
            } catch (Exception e) {
                System.err.println("Ошибка отправки файла в Discord: " + e.getMessage());
                throw new RuntimeException(e);
            }
        });
    }

    /**
     * Отправка простого сообщения
     */
    public CompletableFuture<Void> sendMessage(String message) {
        return CompletableFuture.runAsync(() -> {
            try {
                TextChannel channel = findTextChannelByName(defaultChannelName);
                if (channel != null) {
                    channel.sendMessage(message).complete();
                    System.out.println("Сообщение отправлено в канал: " + defaultChannelName);
                } else {
                    System.err.println("Канал не найден: " + defaultChannelName);
                }
            } catch (Exception e) {
                System.err.println("Ошибка отправки сообщения в Discord: " + e.getMessage());
            }
        });
    }

    public CompletableFuture<Void> sendMessage(String message, String channelName) {
        return CompletableFuture.runAsync(() -> {
            try {
                TextChannel channel = findTextChannelByName(channelName);
                if (channel != null) {
                    channel.sendMessage(message).complete();
                } else {
                    System.err.println("Канал не найден: " + defaultChannelName);
                }
            } catch (Exception e) {
                System.err.println("Ошибка отправки сообщения в Discord: " + e.getMessage());
            }
        });
    }




    /**
     * Отправка простого сообщения в указанный канал
     */
    public CompletableFuture<Void> sendMessageToChannel(String channelName, String message) {
        return CompletableFuture.runAsync(() -> {
            try {
                TextChannel channel = findTextChannelByName(channelName);
                if (channel != null) {
                    channel.sendMessage(message).complete();
                    System.out.println("Сообщение отправлено в канал: " + channelName);
                } else {
                    System.err.println("Канал не найден: " + channelName);
                }
            } catch (Exception e) {
                System.err.println("Ошибка отправки сообщения в Discord: " + e.getMessage());
            }
        });
    }

    /**
     * Поиск текстового канала по имени
     */
    TextChannel findTextChannelByName(String channelName) {
        return jda.getTextChannelsByName(channelName, true)
                .stream()
                .findFirst()
                .orElse(null);
    }

    /**
     * Получение списка доступных каналов
     */
    public void printAvailableChannels() {
        System.out.println("=== Доступные текстовые каналы ===");
        jda.getTextChannels().forEach(channel ->
                System.out.println("• " + channel.getName() + " (ID: " + channel.getId() + ")")
        );
    }

    /**
     * Корректное отключение бота
     */
    public void shutdown() {
        if (jda != null) {
            jda.shutdown();
            System.out.println("Discord бот отключен");
        }
    }

    public JDA getJda() {
        return jda;
    }
}