package com.uniconnect.dto.social;

import java.time.Instant;
import java.util.UUID;

public record StudentPostCommentResponse(
        UUID id,
        UUID postId,
        String content,
        Instant createdAt,
        Instant updatedAt,
        PostAuthorResponse author) {
}
