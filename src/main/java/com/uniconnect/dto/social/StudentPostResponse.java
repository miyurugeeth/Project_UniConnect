package com.uniconnect.dto.social;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StudentPostResponse(
        UUID id,
        String content,
        String imageUrl,
        Instant createdAt,
        Instant updatedAt,
        StudentSummaryResponse author,
        PostCategoryResponse category,
        List<PostAttachmentResponse> attachments,
        long likeCount,
        boolean likedByCurrentUser,
        long commentCount) {
}
