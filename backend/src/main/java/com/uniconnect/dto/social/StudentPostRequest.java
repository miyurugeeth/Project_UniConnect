package com.uniconnect.dto.social;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record StudentPostRequest(
        @NotBlank @Size(max = 5000) String content,
        @Size(max = 2048)
                @Pattern(
                        regexp = "(?i)^https?://\\S+$",
                        message = "must be an HTTP or HTTPS URL")
                String imageUrl,
        @NotBlank @Size(max = 64) String categoryCode) {
}
