package com.uniconnect.dto.admin;

public record AdminDashboardSummaryResponse(
        long totalUsers, long administrators, long suspendedUsers) {
}
