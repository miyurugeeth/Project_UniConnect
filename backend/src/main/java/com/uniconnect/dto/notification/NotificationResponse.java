package com.uniconnect.dto.notification;

import com.uniconnect.entity.NotificationType;
import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String type,
        String message,
        String linkTarget,
        boolean isRead,
        Instant createdAt,
        UUID actorId,
        String actorFullName,
        String actorProfileImageUrl) {}