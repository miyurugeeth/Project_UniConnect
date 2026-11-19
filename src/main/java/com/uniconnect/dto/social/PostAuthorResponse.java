package com.uniconnect.dto.social;

import java.util.UUID;

public record PostAuthorResponse(
        UUID id,
        String fullName,
        String profileImageUrl,
        String role,
        String universityName,
        String faculty,
        String departmentOrField,
        String companyName,
        String industry,
        String jobPosition) {
}
