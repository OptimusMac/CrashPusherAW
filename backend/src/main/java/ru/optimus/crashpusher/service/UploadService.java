package ru.optimus.crashpusher.service;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ru.optimus.crashpusher.model.UploadResponse;
import ru.optimus.crashpusher.pushers.AdaptPusher;


import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@AllArgsConstructor
public class UploadService {

    private static final long MAX_SIZE = 10 * 1024 * 1024;
    private final AdaptPusher adaptPusher;

    public UploadResponse handleFileUpload(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("File exceeds 10MB limit");
        }

        String fileName = sanitizeFileName(file.getOriginalFilename());
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        byte[] data = file.getBytes();
        String content = new String(data, StandardCharsets.UTF_8);

        String playerName = extractPlayerNameFromFileName(fileName, content);

        try {
            Map<String, String> values = new HashMap<>();
            values.put("player_name", playerName);
            values.put("file_name", fileName);
            values.put("size", String.valueOf(file.getSize()));
            values.put("content_type", contentType);
            values.put("content", content);

            adaptPusher.push(values);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return new UploadResponse("success", fileName, file.getSize(), playerName);
    }

    // ---------------- Утилиты ----------------

    private String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.isEmpty())
            return "file_" + System.currentTimeMillis();
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private String extractPlayerNameFromFileName(String fileName, String fileContent) {
        try {
            Pattern[] patterns = {
                    Pattern.compile("full_crash_(.+?)_\\d+\\.txt"),
                    Pattern.compile("crash_(.+?)_\\d+\\.txt"),
                    Pattern.compile("emergency_crash_(.+?)_\\d+\\.txt"),
                    Pattern.compile("sync_crash_(.+?)_\\d+\\.txt")
            };
            for (Pattern p : patterns) {
                Matcher m = p.matcher(fileName);
                if (m.find() && !m.group(1).isEmpty())
                    return m.group(1);
            }
        } catch (Exception ignored) {}

        return extractPlayerNameFromCrash(fileContent);
    }

    private String extractPlayerNameFromCrash(String content) {
        try {
            if (content.contains("Player: ")) {
                int start = content.indexOf("Player: ") + "Player: ".length();
                int end = content.indexOf("\n", start);
                if (end > start) {
                    String name = content.substring(start, end).trim();
                    if (!name.isEmpty() && !"null".equals(name))
                        return name;
                }
            }
            if (content.contains("EntityClientPlayerMP['")) {
                int start = content.indexOf("EntityClientPlayerMP['") + "EntityClientPlayerMP['".length();
                int end = content.indexOf("'", start);
                if (end > start)
                    return content.substring(start, end).trim();
            }
        } catch (Exception ignored) {}
        return "unknown";
    }



}
