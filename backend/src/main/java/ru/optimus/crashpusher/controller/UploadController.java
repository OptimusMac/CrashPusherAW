package ru.optimus.crashpusher.controller;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.optimus.crashpusher.model.UploadResponse;
import ru.optimus.crashpusher.service.CrashService;
import ru.optimus.crashpusher.service.UploadService;

@RestController
@RequestMapping("/upload")
@AllArgsConstructor
public class UploadController {

    private final UploadService uploadService;

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

}
