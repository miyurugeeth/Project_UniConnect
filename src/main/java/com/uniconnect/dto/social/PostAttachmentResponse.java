package com.uniconnect.dto.social;

import java.time.Instant;
import java.util.UUID;

public record PostAttachmentResponse(
        UUID id,
        String mediaType,
        String contentType,
        long fileSizeBytes,
        String contentUrl,
        Instant createdAt) {
}
