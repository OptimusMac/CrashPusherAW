package ru.optimus.crashpusher.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Data
public class LogFilterDTO {
    private String sort = "createdAt"; // поле сортировки по умолчанию
    private String order = "desc"; // порядок сортировки по умолчанию

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime dateFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime dateTo;

    private Integer page = 0;
    private Integer size = 50;
}