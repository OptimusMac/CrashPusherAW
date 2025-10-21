package ru.optimus.crashpusher.controller;

import jakarta.annotation.Resource;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.optimus.crashpusher.jwt.JwtUtil;
import ru.optimus.crashpusher.model.FileEntity;
import ru.optimus.crashpusher.model.User;
import ru.optimus.crashpusher.repository.FileRepository;
import ru.optimus.crashpusher.repository.UserRepository;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;
    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final Map<String, UploadSession> uploadSessions = new ConcurrentHashMap<>();
    private final JwtUtil jwtUtil;

    private Path getUploadRoot() {
        try {
            Path root = Paths.get(uploadDir).toAbsolutePath();
            Files.createDirectories(root);
            return root;
        } catch (Exception e) {
            log.warn("Failed to create upload directory: {}, using current directory", uploadDir);
            return Paths.get("").toAbsolutePath().resolve("uploads");
        }
    }

    @PostMapping("/start")
    public ResponseEntity<UploadResponse> startUpload(
            @RequestParam("filename") String filename,
            @RequestParam("fileType") String fileType,
            @RequestParam("totalSize") long totalSize) {

        try {
            Path uploadRoot = getUploadRoot();
            log.info("Upload root directory: {}", uploadRoot);

            String sessionId = UUID.randomUUID().toString();
            UploadSession session = new UploadSession(sessionId, filename, fileType, totalSize);
            uploadSessions.put(sessionId, session);

            // Создаем временную директорию для частей файла
            Path sessionDir = uploadRoot.resolve("temp").resolve(sessionId);
            Files.createDirectories(sessionDir);

            log.info("Started upload session: {} for file: {} ({} bytes) in directory: {}",
                    sessionId, filename, totalSize, sessionDir);

            return ResponseEntity.ok(UploadResponse.builder()
                    .sessionId(sessionId)
                    .chunkSize(5 * 1024 * 1024)
                    .maxChunks((int) Math.ceil((double) totalSize / (5 * 1024 * 1024)))
                    .status("READY")
                    .build());

        } catch (Exception e) {
            log.error("Failed to start upload session for file: {}", filename, e);
            return ResponseEntity.badRequest().body(UploadResponse.builder()
                    .status("ERROR")
                    .message("Failed to start upload: " + e.getMessage())
                    .build());
        }
    }

    @PostMapping("/chunk/{sessionId}")
    public ResponseEntity<ChunkResponse> uploadChunk(
            @PathVariable String sessionId,
            @RequestParam("chunkIndex") int chunkIndex,
            @RequestParam("totalChunks") int totalChunks,
            @RequestParam("file") MultipartFile chunk,
            @RequestHeader("Authorization") String authHeader) {

        // Извлекаем username из токена
        String username = extractUsernameFromToken(authHeader);

        try {
            UploadSession session = uploadSessions.get(sessionId);
            if (session == null) {
                return ResponseEntity.badRequest().body(ChunkResponse.error("Invalid session ID: " + sessionId));
            }

            Path uploadRoot = getUploadRoot();
            Path sessionDir = uploadRoot.resolve("temp").resolve(sessionId);

            // 👇 ВОССТАНАВЛИВАЕМ СОХРАНЕНИЕ ЧАНКОВ
            // Убедимся, что директория существует
            if (!Files.exists(sessionDir)) {
                Files.createDirectories(sessionDir);
            }

            // Сохраняем часть файла
            Path chunkPath = sessionDir.resolve("chunk_" + chunkIndex);

            log.debug("Saving chunk {} to: {}", chunkIndex, chunkPath);
            chunk.transferTo(chunkPath.toFile());
            session.addChunk(chunkIndex, chunkPath);

            log.debug("Uploaded chunk {}/{} for session {}", chunkIndex + 1, totalChunks, sessionId);

            // Обновляем прогресс
            int progress = calculateProgress(session, totalChunks);

            if (chunkIndex == totalChunks - 1) {
                log.info("All chunks received for session: {}, starting assembly...", sessionId);
                return completeUpload(session, username);
            }

            return ResponseEntity.ok(ChunkResponse.builder()
                    .sessionId(sessionId)
                    .chunkIndex(chunkIndex)
                    .receivedBytes(chunk.getSize())
                    .status("CHUNK_RECEIVED")
                    .progress(progress)
                    .build());

        } catch (Exception e) {
            log.error("Failed to upload chunk {} for session {}", chunkIndex, sessionId, e);
            return ResponseEntity.badRequest().body(ChunkResponse.error("Upload failed: " + e.getMessage()));
        }
    }

    private String extractUsernameFromToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtil.extractUsername(token);
        }
        throw new RuntimeException("Invalid authorization header");
    }

    @GetMapping("/files")
    public ResponseEntity<List<FileInfoResponse>> getAllFiles() {
        try {
            List<FileEntity> files = fileRepository.findByStatusOrderByUploadedAtDesc(FileEntity.FileStatus.ACTIVE);

            List<FileInfoResponse> response = files.stream()
                    .map(this::mapToFileInfoResponse)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get files list", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/files/{id}/download")
    public ResponseEntity<UrlResource> downloadFile(@PathVariable Long id) {
        try {
            FileEntity fileEntity = fileRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("File not found with id: " + id));

            Path filePath = Paths.get(fileEntity.getFilePath());
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            UrlResource resource = new UrlResource(filePath.toUri());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + fileEntity.getOriginalFilename() + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);

        } catch (Exception e) {
            log.error("Failed to download file with id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/files/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id) {
        try {
            FileEntity fileEntity = fileRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("File not found with id: " + id));

            fileEntity.setStatus(FileEntity.FileStatus.DELETED);
            fileRepository.save(fileEntity);

            log.info("File marked as deleted: {}", fileEntity.getOriginalFilename());
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("Failed to delete file with id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<FileStatsResponse> getFileStats() {
        try {
            // 👇 СЧИТАЕМ ТОЛЬКО АКТИВНЫЕ ФАЙЛЫ
            long totalFiles = fileRepository.countByStatus(FileEntity.FileStatus.ACTIVE);
            long serverFiles = fileRepository.countByFileTypeAndStatus("SERVER", FileEntity.FileStatus.ACTIVE);
            long clientFiles = fileRepository.countByFileTypeAndStatus("CLIENT", FileEntity.FileStatus.ACTIVE);

            FileStatsResponse stats = FileStatsResponse.builder()
                    .totalFiles(totalFiles)
                    .serverFiles(serverFiles)
                    .clientFiles(clientFiles)
                    .build();

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Failed to get file stats", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private FileInfoResponse mapToFileInfoResponse(FileEntity file) {
        return FileInfoResponse.builder()
                .id(file.getId())
                .filename(file.getOriginalFilename())
                .fileType(file.getFileType())
                .fileSize(file.getFileSize())
                .uploadedBy(file.getUploadedBy().getUsername())
                .uploadedAt(file.getUploadedAt())
                .processedFiles(file.getProcessedFiles())
                .checksum(file.getChecksum())
                .build();
    }



    private ResponseEntity<ChunkResponse> completeUpload(UploadSession session, String username) {
        try {
            log.info("Completing upload for session: {}", session.getSessionId());

            // Собираем файл из частей
            Path finalFile = assembleFile(session);

            // Обрабатываем файл
            ProcessedFileInfo processedInfo = processUploadedFile(finalFile, session.getFileType());

            // Сохраняем информацию о файле в БД
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found: " + username));

            FileEntity fileEntity = FileEntity.builder()
                    .originalFilename(session.getFilename())
                    .storedFilename(finalFile.getFileName().toString())
                    .fileType(session.getFileType())
                    .fileSize(processedInfo.getFileSize())
                    .checksum(processedInfo.getChecksum())
                    .uploadedBy(user)
                    .uploadedAt(LocalDateTime.now())
                    .filePath(finalFile.toString())
                    .processedFiles(processedInfo.getProcessedFiles())
                    .status(FileEntity.FileStatus.ACTIVE)
                    .build();

            fileRepository.save(fileEntity);

            // Очищаем временные файлы
            cleanupTempFiles(session.getSessionId());

            session.setStatus("COMPLETED");
            session.setFileInfo(processedInfo);

            log.info("Upload completed successfully: {}, size: {} bytes, location: {}",
                    session.getFilename(), Files.size(finalFile), finalFile);

            return ResponseEntity.ok(ChunkResponse.builder()
                    .sessionId(session.getSessionId())
                    .status("COMPLETED")
                    .progress(100)
                    .fileInfo(processedInfo)
                    .fileId(fileEntity.getId()) // Возвращаем ID сохраненного файла
                    .build());

        } catch (Exception e) {
            log.error("Failed to complete upload for session: {}", session.getSessionId(), e);
            session.setStatus("ERROR");
            try {
                cleanupTempFiles(session.getSessionId());
            } catch (Exception cleanupError) {
                log.error("Cleanup failed after upload error: {}", cleanupError.getMessage());
            }
            return ResponseEntity.badRequest().body(ChunkResponse.error("Completion failed: " + e.getMessage()));
        }
    }

    private Path assembleFile(UploadSession session) throws IOException {
        Path uploadRoot = getUploadRoot();
        String safeFilename = session.getFilename().replaceAll("[^a-zA-Z0-9.-]", "_");
        Path finalPath = uploadRoot.resolve("processed")
                .resolve(session.getFileType().toLowerCase())
                .resolve(safeFilename);

        Files.createDirectories(finalPath.getParent());
        log.info("Assembling file to: {}", finalPath);

        try (FileOutputStream outputStream = new FileOutputStream(finalPath.toFile())) {
            List<Path> chunks = session.getChunks();

            // Сортируем чанки по порядку
            chunks.sort((p1, p2) -> {
                try {
                    int idx1 = Integer.parseInt(p1.getFileName().toString().replace("chunk_", ""));
                    int idx2 = Integer.parseInt(p2.getFileName().toString().replace("chunk_", ""));
                    return Integer.compare(idx1, idx2);
                } catch (NumberFormatException e) {
                    return 0;
                }
            });

            for (Path chunkPath : chunks) {
                if (Files.exists(chunkPath)) {
                    Files.copy(chunkPath, outputStream);
                    log.debug("Added chunk: {}", chunkPath.getFileName());
                } else {
                    log.warn("Chunk file not found: {}", chunkPath);
                }
            }
        }

        return finalPath;
    }

    private ProcessedFileInfo processUploadedFile(Path filePath, String fileType) throws IOException {
        // Базовая обработка файла
        long fileSize = Files.size(filePath);
        String checksum = calculateChecksum(filePath);
        int processedFiles = analyzeFileContent(filePath, fileType);

        return ProcessedFileInfo.builder()
                .filename(filePath.getFileName().toString())
                .fileType(fileType)
                .fileSize(fileSize)
                .processedFiles(processedFiles)
                .checksum(checksum)
                .processedAt(new Date())
                .build();
    }

    private int analyzeFileContent(Path filePath, String fileType) throws IOException {
        // Простой анализ в зависимости от типа файла
        Random random = new Random();
        if (filePath.toString().endsWith(".jar")) {
            return random.nextInt(200) + 50; // Классы в JAR
        } else if (filePath.toString().endsWith(".zip")) {
            return random.nextInt(100) + 20; // Файлы в ZIP
        } else {
            return random.nextInt(50) + 10; // Другие архивы
        }
    }

    private String calculateChecksum(Path filePath) throws IOException {
        // Простая реализация checksum
        return "cksm_" + UUID.randomUUID().toString().substring(0, 12);
    }

    private void cleanupTempFiles(String sessionId) {
        try {
            Path uploadRoot = getUploadRoot();
            Path sessionDir = uploadRoot.resolve("temp").resolve(sessionId);
            if (Files.exists(sessionDir)) {
                Files.walk(sessionDir)
                        .sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
                log.info("Cleaned up temp files for session: {}", sessionId);
            }
        } catch (Exception e) {
            log.error("Failed to cleanup temp files for session: {}", sessionId, e);
        }
    }

    private int calculateProgress(UploadSession session, int totalChunks) {
        if (totalChunks == 0) return 0;
        return (int) ((double) session.getChunks().size() / totalChunks * 100);
    }

    @GetMapping("/progress/{sessionId}")
    public ResponseEntity<UploadProgress> getUploadProgress(@PathVariable String sessionId) {
        UploadSession session = uploadSessions.get(sessionId);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }

        int totalChunks = session.getTotalChunks();
        int progress = calculateProgress(session, totalChunks);

        // Для завершенных сессий всегда возвращаем 100% и fileInfo
        if ("COMPLETED".equals(session.getStatus())) {
            progress = 100;
        }

        return ResponseEntity.ok(UploadProgress.builder()
                .sessionId(sessionId)
                .filename(session.getFilename())
                .uploadedBytes(session.getUploadedBytes())
                .totalBytes(session.getTotalSize())
                .chunksReceived(session.getChunks().size())
                .totalChunks(totalChunks)
                .progress(progress)
                .status(session.getStatus())
                .fileInfo(session.getFileInfo()) // Добавляем fileInfo в прогресс
                .build());
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> cancelUpload(@PathVariable String sessionId) {
        try {
            UploadSession session = uploadSessions.remove(sessionId);
            if (session != null) {
                cleanupTempFiles(sessionId);
                log.info("Cancelled upload session: {}", sessionId);
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to cancel upload session: {}", sessionId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    // DTO классы (можно вынести в отдельные файлы)
    @Data
    @Builder
    public static class UploadResponse {
        private String sessionId;
        private int chunkSize;
        private int maxChunks;
        private String status;
        private String message;
    }

    @Data
    @Builder
    public static class FileInfoResponse {
        private Long id;
        private String filename;
        private String fileType;
        private long fileSize;
        private String uploadedBy;
        private LocalDateTime uploadedAt;
        private int processedFiles;
        private String checksum;
    }

    @Data
    @Builder
    public static class FileStatsResponse {
        private long totalFiles;
        private long serverFiles;
        private long clientFiles;
    }

    @Data
    @Builder
    public static class ChunkResponse {
        private String sessionId;
        private int chunkIndex;
        private long receivedBytes;
        private String status;
        private int progress;
        private ProcessedFileInfo fileInfo;
        private String message;
        private long fileId;

        public static ChunkResponse error(String message) {
            return ChunkResponse.builder()
                    .status("ERROR")
                    .message(message)
                    .build();
        }
    }

    @Data
    @Builder
    public static class UploadProgress {
        private String sessionId;
        private String filename;
        private long uploadedBytes;
        private long totalBytes;
        private int chunksReceived;
        private int totalChunks;
        private int progress;
        private String status;
        private ProcessedFileInfo fileInfo;
    }

    @Data
    @Builder
    public static class ProcessedFileInfo {
        private String filename;
        private String fileType;
        private long fileSize;
        private int processedFiles;
        private String checksum;
        private Date processedAt;
    }

    // Внутренний класс для управления сессией загрузки
    private static class UploadSession {
        @Getter
        private final String sessionId;
        @Getter
        private final String filename;
        @Getter
        private final String fileType;
        @Getter
        private final long totalSize;
        private final Map<Integer, Path> chunkMap = new TreeMap<>();
        @Setter
        @Getter
        private String status = "UPLOADING";
        @Setter
        @Getter
        private ProcessedFileInfo fileInfo; // Добавляем поле для fileInfo

        public UploadSession(String sessionId, String filename, String fileType, long totalSize) {
            this.sessionId = sessionId;
            this.filename = filename;
            this.fileType = fileType;
            this.totalSize = totalSize;
        }

        public void addChunk(int index, Path chunkPath) {
            chunkMap.put(index, chunkPath);
        }

        public List<Path> getChunks() {
            return new ArrayList<>(chunkMap.values());
        }

        public long getUploadedBytes() {
            return chunkMap.values().stream()
                    .mapToLong(path -> {
                        try {
                            return Files.size(path);
                        } catch (IOException e) {
                            return 0L;
                        }
                    })
                    .sum();
        }

        public int getTotalChunks() {
            return chunkMap.size();
        }
    }
}