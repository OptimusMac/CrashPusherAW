package ru.optimus.crashpusher.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String username;
    private String password;
}
