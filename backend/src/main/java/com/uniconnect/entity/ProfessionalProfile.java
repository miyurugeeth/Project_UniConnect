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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import org.hibernate.annotations.Nationalized;

@Entity
@Table(name = "professional_profiles", schema = "dbo")
public class ProfessionalProfile {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_professional_profiles_users"))
    private User user;

    @NotBlank
    @Size(max = 200)
    @Nationalized
    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @NotBlank
    @Size(max = 120)
    @Nationalized
    @Column(name = "industry", nullable = false, length = 120)
    private String industry;

    @NotBlank
    @Size(max = 150)
    @Nationalized
    @Column(name = "job_position", nullable = false, length = 150)
    private String jobPosition;

    @Size(max = 100)
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "professional_profile_skills",
            schema = "dbo",
            joinColumns = @JoinColumn(name = "user_id"),
            foreignKey = @ForeignKey(name = "fk_professional_profile_skills_profile"))
    @Nationalized
    @Column(name = "skill", nullable = false, length = 80)
    private Set<@NotBlank @Size(max = 80) String> skills = new LinkedHashSet<>();

    protected ProfessionalProfile() {
    }

    public ProfessionalProfile(User user, String companyName, String industry, String jobPosition) {
        this.user = user;
        this.companyName = companyName;
        this.industry = industry;
        this.jobPosition = jobPosition;
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getJobPosition() {
        return jobPosition;
    }

    public void setJobPosition(String jobPosition) {
        this.jobPosition = jobPosition;
    }

    public Set<String> getSkills() {
        return skills;
    }
}
