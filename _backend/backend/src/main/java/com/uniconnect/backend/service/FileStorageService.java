package com.uniconnect.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "video/mp4", "video/webm", "video/quicktime",
            "application/pdf"
    );

    private final Path uploadDirectory;

    public FileStorageService(
            @Value("${app.upload-dir:uploads}") String uploadDirectory) {
        this.uploadDirectory = Paths.get(uploadDirectory).toAbsolutePath().normalize();
    }

    public StoredFile store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only images, videos, and PDF files are allowed");
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null
                ? "attachment"
                : file.getOriginalFilename());
        String storedName = UUID.randomUUID() + "-" + originalName;

        try {
            Files.createDirectories(uploadDirectory);
            Files.copy(file.getInputStream(), uploadDirectory.resolve(storedName));
            return new StoredFile("/uploads/" + storedName, originalName, contentType);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to store attachment", exception);
        }
    }

    public record StoredFile(String url, String name, String type) {
    }
}
