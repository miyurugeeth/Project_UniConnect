package com.uniconnect.dto.profile;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record StudentProfileUpdateRequest(
        @NotBlank @Size(max = 120) String fullName,
        @Size(max = 2048) String profileImageUrl,
        @NotBlank @Size(max = 200) String universityName,
        @NotBlank @Size(max = 150) String faculty,
        @NotBlank @Size(max = 150) String departmentOrField,
        @NotNull @Min(1900) @Max(2200) Integer batchYear,
        @NotNull @Min(1) @Max(20) Integer currentAcademicYear,
        @NotNull @Size(max = 100) Set<@NotBlank @Size(max = 80) String> skills,
        @NotNull @Size(max = 100) Set<@NotBlank @Size(max = 80) String> interests) {
}
