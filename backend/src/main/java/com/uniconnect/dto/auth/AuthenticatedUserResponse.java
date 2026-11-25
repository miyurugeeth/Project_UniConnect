package com.uniconnect.dto.auth;

import com.uniconnect.entity.RoleCode;
import java.util.UUID;

public record AuthenticatedUserResponse(
        UUID userId,
        String fullName,
        String email,
        RoleCode role,
        String profileImageUrl) {
}
