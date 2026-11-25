package com.uniconnect.dto.social;

import java.util.Set;
import java.util.UUID;

public record StudentProfileResponse(
        UUID id,
        String fullName,
        String profileImageUrl,
        String universityName,
        String faculty,
        String departmentOrField,
        Integer batchYear,
        Integer currentAcademicYear,
        Set<String> skills,
        Set<String> interests,
        long followerCount,
        long followingCount,
        boolean followedByCurrentUser) {

    public StudentProfileResponse {
        skills = Set.copyOf(skills);
        interests = Set.copyOf(interests);
    }
}
