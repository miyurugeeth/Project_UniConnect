package com.uniconnect.backend.dto;

public class AdminStatsResponse {

    private final long totalStudents;
    private final long activeStudents;
    private final long suspendedStudents;
    private final long totalPosts;
    private final long totalComments;
    private final long totalLikes;
    private final long totalAdmins;

    public AdminStatsResponse(
            long totalStudents,
            long activeStudents,
            long suspendedStudents,
            long totalPosts,
            long totalComments,
            long totalLikes,
            long totalAdmins) {
        this.totalStudents = totalStudents;
        this.activeStudents = activeStudents;
        this.suspendedStudents = suspendedStudents;
        this.totalPosts = totalPosts;
        this.totalComments = totalComments;
        this.totalLikes = totalLikes;
        this.totalAdmins = totalAdmins;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public long getActiveStudents() {
        return activeStudents;
    }

    public long getSuspendedStudents() {
        return suspendedStudents;
    }

    public long getTotalPosts() {
        return totalPosts;
    }

    public long getTotalComments() {
        return totalComments;
    }

    public long getTotalLikes() {
        return totalLikes;
    }

    public long getTotalAdmins() {
        return totalAdmins;
    }
}
