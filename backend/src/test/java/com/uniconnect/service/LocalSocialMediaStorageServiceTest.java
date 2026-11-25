package com.uniconnect.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.uniconnect.config.SocialMediaProperties;
import com.uniconnect.entity.PostMediaType;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

class LocalSocialMediaStorageServiceTest {

    @TempDir Path tempDir;

    private SocialMediaProperties properties;
    private LocalSocialMediaStorageService storageService;

    @BeforeEach
    void setUp() {
        properties = new SocialMediaProperties();
        properties.setStorageDir(tempDir.resolve("private-media"));
        storageService = new LocalSocialMediaStorageService(properties);
    }

    @Test
    void storesImagesWithGeneratedKeysAndDetectsContentInsteadOfClientMimeType()
            throws IOException {
        byte[] png = pngBytes();
        MockMultipartFile upload =
                new MockMultipartFile("attachments", "../../unsafe.png", "text/plain", png);

        SocialMediaStorageService.StoredMedia stored = storageService.store(upload);

        assertEquals(PostMediaType.IMAGE, stored.mediaType());
        assertEquals("image/png", stored.contentType());
        assertFalse(stored.storageKey().contains("unsafe"));
        assertEquals(png.length, stored.fileSizeBytes());
        assertEquals(png.length, storageService.load(stored.storageKey()).contentLength());

        storageService.delete(stored.storageKey());
        assertFalse(Files.exists(properties.getStorageDir().resolve(stored.storageKey())));
    }

    @Test
    void rejectsSpoofedImageMimeTypesAndCleansTemporaryFiles() throws IOException {
        MockMultipartFile upload =
                new MockMultipartFile(
                        "attachments",
                        "photo.png",
                        "image/png",
                        "not an image".getBytes(java.nio.charset.StandardCharsets.UTF_8));

        ResponseStatusException exception =
                assertThrows(ResponseStatusException.class, () -> storageService.store(upload));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        try (var files = Files.list(properties.getStorageDir())) {
            assertEquals(0, files.count());
        }
    }

    @Test
    void rejectsOversizedImagesAndPathTraversalStorageKeys() throws IOException {
        properties.setMaxImageBytes(1);
        storageService = new LocalSocialMediaStorageService(properties);

        ResponseStatusException sizeException =
                assertThrows(
                        ResponseStatusException.class,
                        () ->
                                storageService.store(
                                        new MockMultipartFile(
                                                "attachments",
                                                "photo.png",
                                                "image/png",
                                                pngBytes())));
        ResponseStatusException pathException =
                assertThrows(
                        ResponseStatusException.class,
                        () -> storageService.load("../../outside.png"));

        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, sizeException.getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, pathException.getStatusCode());
        try (var files = Files.list(properties.getStorageDir())) {
            assertEquals(0, files.count());
        }
    }

    private static byte[] pngBytes() throws IOException {
        BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", output);
            return output.toByteArray();
        }
    }
}
