package com.uniconnect.dto.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminProfileUpdateRequest(
        @NotBlank @Size(max = 120) String fullName,
        @Size(max = 2048) String profileImageUrl) {
}
