package com.uniconnect.dto.messaging;

import java.time.Instant;
import java.util.UUID;

public record DirectMessageResponse(
        UUID id,
        UUID senderId,
        UUID recipientId,
        String content,
        Instant sentAt) {
}
