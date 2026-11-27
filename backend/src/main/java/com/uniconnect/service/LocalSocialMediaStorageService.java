package com.uniconnect.service;

import com.uniconnect.config.SocialMediaProperties;
import com.uniconnect.entity.PostMediaType;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.AtomicMoveNotSupportedException;
import java.util.Arrays;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@ConditionalOnProperty(
        prefix = "app.social.media",
        name = "provider",
        havingValue = "local",
        matchIfMissing = true)
public class LocalSocialMediaStorageService implements SocialMediaStorageService {

    private static final byte[] PNG_SIGNATURE =
            new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a};
    private static final byte[] WEBM_SIGNATURE =
            new byte[] {0x1a, 0x45, (byte) 0xdf, (byte) 0xa3};
    private static final String STORAGE_KEY_PATTERN =
            "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|gif|mp4|webm|pdf)$";

    private final Path storageRoot;
    private final SocialMediaProperties properties;

    public LocalSocialMediaStorageService(SocialMediaProperties properties) {
        this.storageRoot = properties.getStorageDir().toAbsolutePath().normalize();
        this.properties = properties;
    }

    @Override
    public StoredMedia store(MultipartFile upload) {
        if (upload == null || upload.isEmpty()) {
            throw badRequest("Attachment must not be empty.");
        }
        if (upload.getSize() > properties.getMaxVideoBytes()) {
            throw payloadTooLarge();
        }

        Path temporaryFile = null;
        try {
            Files.createDirectories(storageRoot);
            temporaryFile = Files.createTempFile(storageRoot, "upload-", ".tmp");
            try (InputStream input = upload.getInputStream()) {
                Files.copy(input, temporaryFile, StandardCopyOption.REPLACE_EXISTING);
            }

            long fileSize = Files.size(temporaryFile);
            DetectedMedia detected = detectMedia(temporaryFile);
            long maximumSize =
                    detected.mediaType() == PostMediaType.IMAGE
                            ? properties.getMaxImageBytes()
                            : properties.getMaxVideoBytes();
            if (fileSize > maximumSize) {
                throw payloadTooLarge();
            }

            String storageKey = UUID.randomUUID() + detected.extension();
            Path destination = resolveStoragePath(storageKey);
            try {
                Files.move(temporaryFile, destination, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException exception) {
                Files.move(temporaryFile, destination);
            }
            temporaryFile = null;
            return new StoredMedia(
                    storageKey, detected.mediaType(), detected.contentType(), fileSize);
        } catch (ResponseStatusException exception) {
            deleteTemporaryFile(temporaryFile, exception);
            throw exception;
        } catch (IOException exception) {
            deleteTemporaryFile(temporaryFile, exception);
            throw new IllegalStateException("Attachment storage failed.", exception);
        }
    }

    @Override
    public Resource load(String storageKey) {
        Path path = resolveStoragePath(storageKey);
        try {
            Path realRoot = storageRoot.toRealPath();
            Path realPath = path.toRealPath();
            if (!realPath.startsWith(realRoot) || !Files.isRegularFile(realPath)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            }
            return new FileSystemResource(realPath);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment was not found.");
        }
    }

    @Override
    public void delete(String storageKey) throws IOException {
        Files.deleteIfExists(resolveStoragePath(storageKey));
    }

    private DetectedMedia detectMedia(Path file) throws IOException {
        byte[] header = new byte[16];
        int headerLength;
        try (InputStream input = Files.newInputStream(file)) {
            headerLength = input.readNBytes(header, 0, header.length);
        }

        if (headerLength >= 3
                && (header[0] & 0xff) == 0xff
                && (header[1] & 0xff) == 0xd8
                && (header[2] & 0xff) == 0xff) {
            return validateImage(file, "jpg");
        }
        if (headerLength >= PNG_SIGNATURE.length
                && startsWith(header, headerLength, PNG_SIGNATURE)) {
            return validateImage(file, "png");
        }
        if (headerLength >= 6
                && (startsWithAscii(header, "GIF87a") || startsWithAscii(header, "GIF89a"))) {
            return validateImage(file, "gif");
        }
        if (containsPdfHeader(file)) {
            return new DetectedMedia(PostMediaType.PDF, "application/pdf", ".pdf");
        }
        if (headerLength >= 12
                && header[4] == 'f'
                && header[5] == 't'
                && header[6] == 'y'
                && header[7] == 'p') {
            return new DetectedMedia(PostMediaType.VIDEO, "video/mp4", ".mp4");
        }
        if (headerLength >= WEBM_SIGNATURE.length
                && startsWith(header, headerLength, WEBM_SIGNATURE)
                && containsWebmDocType(file)) {
            return new DetectedMedia(PostMediaType.VIDEO, "video/webm", ".webm");
        }
        throw badRequest("Only valid JPEG, PNG, GIF, MP4, WebM, or PDF attachments are supported.");
    }

    private DetectedMedia validateImage(Path file, String expectedFormat) throws IOException {
        try (ImageInputStream imageInput = ImageIO.createImageInputStream(file.toFile())) {
            if (imageInput == null) {
                throw badRequest("Image attachment is invalid.");
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInput);
            if (!readers.hasNext()) {
                throw badRequest("Image attachment is invalid.");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(imageInput, true, true);
                String actualFormat = reader.getFormatName().toLowerCase(Locale.ROOT);
                boolean validFormat =
                        expectedFormat.equals("jpg")
                                ? actualFormat.equals("jpg") || actualFormat.equals("jpeg")
                                : actualFormat.equals(expectedFormat);
                if (!validFormat) {
                    throw badRequest("Image content does not match a supported image format.");
                }

                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                long pixels = (long) width * height;
                if (width < 1
                        || height < 1
                        || width > properties.getMaxImageDimension()
                        || height > properties.getMaxImageDimension()
                        || pixels > properties.getMaxImagePixels()) {
                    throw badRequest("Image dimensions exceed the supported limits.");
                }
            } finally {
                reader.dispose();
            }
        }

        String contentType = switch (expectedFormat) {
            case "jpg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            default -> throw new IllegalStateException("Unsupported image format.");
        };
        return new DetectedMedia(PostMediaType.IMAGE, contentType, "." + expectedFormat);
    }

    private static boolean containsWebmDocType(Path file) throws IOException {
        byte[] prefix;
        try (InputStream input = Files.newInputStream(file)) {
            prefix = input.readNBytes(8192);
        }
        byte[] webm = "webm".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        for (int index = 0; index <= prefix.length - webm.length; index++) {
            if (Arrays.equals(
                    Arrays.copyOfRange(prefix, index, index + webm.length), webm)) {
                return true;
            }
        }
        return false;
    }

    private static boolean containsPdfHeader(Path file) throws IOException {
        byte[] prefix;
        try (InputStream input = Files.newInputStream(file)) {
            prefix = input.readNBytes(1024);
        }
        byte[] signature = "%PDF-".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        for (int index = 0; index <= prefix.length - signature.length; index++) {
            if (Arrays.equals(
                    Arrays.copyOfRange(prefix, index, index + signature.length), signature)) {
                return true;
            }
        }
        return false;
    }

    private Path resolveStoragePath(String storageKey) {
        if (storageKey == null || !storageKey.matches(STORAGE_KEY_PATTERN)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment was not found.");
        }
        Path path = storageRoot.resolve(storageKey).normalize();
        if (!path.startsWith(storageRoot)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment was not found.");
        }
        return path;
    }

    private static boolean startsWith(byte[] bytes, int length, byte[] prefix) {
        if (length < prefix.length) {
            return false;
        }
        for (int index = 0; index < prefix.length; index++) {
            if (bytes[index] != prefix[index]) {
                return false;
            }
        }
        return true;
    }

    private static boolean startsWithAscii(byte[] bytes, String prefix) {
        byte[] expected = prefix.getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        return startsWith(bytes, bytes.length, expected);
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static ResponseStatusException payloadTooLarge() {
        return new ResponseStatusException(
                HttpStatus.PAYLOAD_TOO_LARGE, "Attachment exceeds the configured size limit.");
    }

    private static void deleteTemporaryFile(Path temporaryFile, Exception cause) {
        if (temporaryFile == null) {
            return;
        }
        try {
            Files.deleteIfExists(temporaryFile);
        } catch (IOException cleanupException) {
            cause.addSuppressed(cleanupException);
        }
    }

    private record DetectedMedia(PostMediaType mediaType, String contentType, String extension) {
    }
}
