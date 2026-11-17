package com.uniconnect.dto.social;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StudentPostCommentRequest(
        @NotBlank @Size(max = 2000) String content) {
}
