package ru.optimus.crashpusher.repository;

import ru.optimus.crashpusher.model.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileRepository extends JpaRepository<FileEntity, Long> {
    List<FileEntity> findByStatusOrderByUploadedAtDesc(FileEntity.FileStatus status);
    Optional<FileEntity> findByChecksum(String checksum);
    List<FileEntity> findByFileTypeOrderByUploadedAtDesc(String fileType);

    @Query("SELECT f FROM FileEntity f WHERE f.originalFilename LIKE %:query% OR f.description LIKE %:query%")
    List<FileEntity> searchFiles(String query);

    // 👇 СТАРЫЕ МЕТОДЫ (считают все файлы)
    long countByFileType(String fileType);

    // 👇 НОВЫЕ МЕТОДЫ (считают только активные файлы)
    long countByStatus(FileEntity.FileStatus status);
    long countByFileTypeAndStatus(String fileType, FileEntity.FileStatus status);
}