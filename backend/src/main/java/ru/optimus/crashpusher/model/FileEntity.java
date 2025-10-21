package ru.optimus.crashpusher.model;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "uploaded_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String originalFilename;
    private String storedFilename;
    private String fileType;
    private long fileSize;
    private String checksum;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    private LocalDateTime uploadedAt;
    private String filePath;

    private int processedFiles;
    private String description;

    @Enumerated(EnumType.STRING)
    private FileStatus status;

    public enum FileStatus {
        ACTIVE, DELETED, PROCESSING
    }
}