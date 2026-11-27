package com.uniconnect.dto.social;

import java.util.UUID;

public record PostCommentAggregate(UUID postId, long commentCount) {
}
