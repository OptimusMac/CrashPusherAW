package ru.optimus.crashpusher.model;

import lombok.Getter;

@Getter
public class UploadResponse {
    private String status;
    private String filename;
    private long size;
    private String playerName;

    public UploadResponse(String status, String filename, long size, String playerName) {
        this.status = status;
        this.filename = filename;
        this.size = size;
        this.playerName = playerName;
    }

}
