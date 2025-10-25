package ru.optimus.crashpusher.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import ru.optimus.crashpusher.model.Log;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class LogDTO {
    private long id;
    private Map<String, Object> value;
    private LocalDateTime createdAt;

    public static LogDTO of(Log log){
        LogDTO dto = new LogDTO(log.getId(), log.getValue(), log.getCreatedAt());
        dto.getValue().remove("token");
        dto.getValue().remove("items-data");
        dto.getValue().put("id", log.getId());
        return dto;
    }
}
