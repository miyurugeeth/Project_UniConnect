package com.uniconnect.dto.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record ProfessionalProfileUpdateRequest(
        @NotBlank @Size(max = 120) String fullName,
        @Size(max = 2048) String profileImageUrl,
        @NotBlank @Size(max = 200) String companyName,
        @NotBlank @Size(max = 120) String industry,
        @NotBlank @Size(max = 150) String jobPosition,
        @NotNull @Size(max = 100) Set<@NotBlank @Size(max = 80) String> skills) {
}
