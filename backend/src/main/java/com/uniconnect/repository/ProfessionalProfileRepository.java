package com.uniconnect.repository;

import com.uniconnect.entity.ProfessionalProfile;
import java.util.UUID;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfessionalProfileRepository extends JpaRepository<ProfessionalProfile, UUID> {

    @EntityGraph(attributePaths = "user")
    Optional<ProfessionalProfile> findWithUserById(UUID id);
}
