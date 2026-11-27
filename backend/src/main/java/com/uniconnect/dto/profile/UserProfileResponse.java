package com.uniconnect.dto.profile;

import com.uniconnect.entity.RoleCode;
import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String fullName,
        String email,
        String profileImageUrl,
        RoleCode role,
        StudentProfileDetailsResponse studentProfile,
        ProfessionalProfileDetailsResponse professionalProfile) {
}
