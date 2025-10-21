package ru.optimus.crashpusher.dto;

public class UpdateCrashFixRequest {
    private Boolean isFix;

    // Конструкторы
    public UpdateCrashFixRequest() {}

    public UpdateCrashFixRequest(Boolean isFix) {
        this.isFix = isFix;
    }

    // Геттеры и сеттеры
    public Boolean getIsFix() {
        return isFix;
    }

    public void setIsFix(Boolean isFix) {
        this.isFix = isFix;
    }
}