package ru.optimus.crashpusher.dto;

import lombok.Data;

@Data
public class AdminRegistrationRequest {
    private String confirmationToken;
    private String username;
    private String password;
}