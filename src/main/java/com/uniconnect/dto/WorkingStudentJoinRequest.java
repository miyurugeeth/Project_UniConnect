package com.uniconnect.industrial.dto;

import java.util.UUID;

public record WorkingStudentJoinRequest(
        UUID userId,
        String industryName,
        String companyName,
        String jobTitle
) {}