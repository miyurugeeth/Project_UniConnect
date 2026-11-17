package com.uniconnect.dto.social;

import java.util.UUID;

public record PostLikeAggregate(UUID postId, long likeCount) {
}
