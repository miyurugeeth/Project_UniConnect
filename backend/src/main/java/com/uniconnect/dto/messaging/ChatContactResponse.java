package com.uniconnect.dto.messaging;

import com.uniconnect.entity.RoleCode;
import java.util.UUID;

public record ChatContactResponse(
        UUID id, String fullName, String profileImageUrl, RoleCode role) {
}
