package ru.optimus.crashpusher.pushers;

import lombok.AllArgsConstructor;
import ru.optimus.crashpusher.discord.DiscordManager;
import ru.optimus.crashpusher.model.Crash;
import ru.optimus.crashpusher.service.CrashService;

import java.util.Map;

@AllArgsConstructor
public class AdaptPusher implements IPusher {

    private final DiscordManager discordManager;
    private CrashService service;
    @Override
    public void push(Map<String, String> data) {

        String fileName = data.get("file_name");
        String fileContent = data.get("content");
        String playerName = data.get("player_name");


        if (DiscordManager.isEnabled()) {
            discordManager.sendCrashNotification(playerName, fileContent, fileName);
        }

        Crash crash = new Crash();
        crash.setContent(fileContent);

        service.appendCrashToUser(playerName, crash);

    }
}
