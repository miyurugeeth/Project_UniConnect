package com.uniconnect.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import org.hibernate.annotations.Nationalized;

@Entity
@Table(name = "student_profiles", schema = "dbo")
public class StudentProfile {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_student_profiles_users"))
    private User user;

    @NotBlank
    @Size(max = 200)
    @Nationalized
    @Column(name = "university_name", nullable = false, length = 200)
    private String universityName;

    @NotBlank
    @Size(max = 150)
    @Nationalized
    @Column(name = "faculty", nullable = false, length = 150)
    private String faculty;

    @NotBlank
    @Size(max = 150)
    @Nationalized
    @Column(name = "department_or_field", nullable = false, length = 150)
    private String departmentOrField;

    @NotNull
    @Min(1900)
    @Max(2200)
    @Column(name = "batch_year", nullable = false)
    private Integer batchYear;

    @NotNull
    @Min(1)
    @Max(20)
    @Column(name = "current_academic_year", nullable = false)
    private Integer currentAcademicYear;

    @Size(max = 100)
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "student_profile_skills",
            schema = "dbo",
            joinColumns = @JoinColumn(name = "user_id"),
            foreignKey = @ForeignKey(name = "fk_student_profile_skills_profile"))
    @Nationalized
    @Column(name = "skill", nullable = false, length = 80)
    private Set<@NotBlank @Size(max = 80) String> skills = new LinkedHashSet<>();

    @Size(max = 100)
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "student_profile_interests",
            schema = "dbo",
            joinColumns = @JoinColumn(name = "user_id"),
            foreignKey = @ForeignKey(name = "fk_student_profile_interests_profile"))
    @Nationalized
    @Column(name = "interest", nullable = false, length = 80)
    private Set<@NotBlank @Size(max = 80) String> interests = new LinkedHashSet<>();

    protected StudentProfile() {
    }

    public StudentProfile(
            User user,
            String universityName,
            String faculty,
            String departmentOrField,
            Integer batchYear,
            Integer currentAcademicYear) {
        this.user = user;
        this.universityName = universityName;
        this.faculty = faculty;
        this.departmentOrField = departmentOrField;
        this.batchYear = batchYear;
        this.currentAcademicYear = currentAcademicYear;
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getUniversityName() {
        return universityName;
    }

    public void setUniversityName(String universityName) {
        this.universityName = universityName;
    }

    public String getFaculty() {
        return faculty;
    }

    public void setFaculty(String faculty) {
        this.faculty = faculty;
    }

    public String getDepartmentOrField() {
        return departmentOrField;
    }

    public void setDepartmentOrField(String departmentOrField) {
        this.departmentOrField = departmentOrField;
    }

    public Integer getBatchYear() {
        return batchYear;
    }

    public void setBatchYear(Integer batchYear) {
        this.batchYear = batchYear;
    }

    public Integer getCurrentAcademicYear() {
        return currentAcademicYear;
    }

    public void setCurrentAcademicYear(Integer currentAcademicYear) {
        this.currentAcademicYear = currentAcademicYear;
    }

    public Set<String> getSkills() {
        return skills;
    }

    public Set<String> getInterests() {
        return interests;
    }
}
