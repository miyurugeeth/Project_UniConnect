package com.uniconnect.dto.profile;

import java.util.Set;

public record StudentProfileDetailsResponse(
        String universityName,
        String faculty,
        String departmentOrField,
        Integer batchYear,
        Integer currentAcademicYear,
        Set<String> skills,
        Set<String> interests) {

    public StudentProfileDetailsResponse {
        skills = Set.copyOf(skills);
        interests = Set.copyOf(interests);
    }
}
