package com.uniconnect.dto.social;

import java.util.UUID;

public record StudentSummaryResponse(
        UUID id,
        String fullName,
        String profileImageUrl,
        String universityName,
        String faculty,
        String departmentOrField) {
}
