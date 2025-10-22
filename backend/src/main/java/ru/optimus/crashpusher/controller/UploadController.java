package ru.optimus.crashpusher.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.optimus.crashpusher.model.Log;
import ru.optimus.crashpusher.model.UploadResponse;
import ru.optimus.crashpusher.service.LogService;
import ru.optimus.crashpusher.service.UploadService;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/upload")
@RequiredArgsConstructor
@Slf4j
public class UploadController {

    private final UploadService uploadService;
    @Value("${secret_key_validation}")
    private String uploadToken;
    private final LogService logService;

    @PostMapping
    public ResponseEntity<?> handleUpload(@RequestParam("file") MultipartFile file) {
        try {
            UploadResponse response = uploadService.handleFileUpload(file);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    new UploadResponse("error: " + e.getMessage(), null, 0, null)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new UploadResponse("error: " + e.getMessage(), null, 0, null)
            );
        }
    }

    @PostMapping("/logger")
    public ResponseEntity<?> loggerPush(@RequestBody Map<String, Object> content){
        if(!matchesToken(content.get("token").toString())){
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        System.out.println(content);
        Log logModel = new Log();
        logModel.setValue(content);
        logModel.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(logService.create(logModel));

    }

    private boolean matchesToken(String token){
        return Objects.equals(token, uploadToken);

    }

}
