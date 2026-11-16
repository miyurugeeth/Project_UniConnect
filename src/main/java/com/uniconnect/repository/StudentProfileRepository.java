package com.uniconnect.repository;

import com.uniconnect.entity.StudentProfile;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, UUID> {
}
