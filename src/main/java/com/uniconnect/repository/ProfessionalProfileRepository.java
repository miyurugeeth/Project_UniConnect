package com.uniconnect.repository;

import com.uniconnect.entity.ProfessionalProfile;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfessionalProfileRepository extends JpaRepository<ProfessionalProfile, UUID> {
}
