package com.uniconnect.dto.profile;

import java.util.Set;

public record ProfessionalProfileDetailsResponse(
        String companyName,
        String industry,
        String jobPosition,
        Set<String> skills) {

    public ProfessionalProfileDetailsResponse {
        skills = Set.copyOf(skills);
    }
}
