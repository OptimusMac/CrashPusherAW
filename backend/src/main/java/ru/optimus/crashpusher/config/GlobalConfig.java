package ru.optimus.crashpusher.config;

import lombok.SneakyThrows;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import ru.optimus.crashpusher.discord.DiscordBot;
import ru.optimus.crashpusher.discord.DiscordManager;
import ru.optimus.crashpusher.pushers.AdaptPusher;
import ru.optimus.crashpusher.service.CrashService;

@Configuration
public class GlobalConfig {


    @SneakyThrows
    @Bean
    public DiscordBot discordBot(@Value("${bot.token}") String token, @Value("${bot.channel.feedback}") String channel) {
        DiscordManager.setEnabled(true);
        return new DiscordBot(token, channel);
    }

    @Bean
    public AdaptPusher adaptPusher(@Lazy DiscordManager discordManager, @Lazy CrashService service) {
        return new AdaptPusher(discordManager, service);
    }

    @Bean
    public DiscordManager discordManager(DiscordBot discordBot) {
        return new DiscordManager(discordBot);
    }
}
