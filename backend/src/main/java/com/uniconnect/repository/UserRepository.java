package com.uniconnect.repository;

import com.uniconnect.entity.User;
import com.uniconnect.entity.RoleCode;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByEmail(String email);

    boolean existsByUsernameIgnoreCase(String username);

    long countByRole_Code(RoleCode roleCode);

    long countBySuspendedTrue();

    @Override
    @EntityGraph(attributePaths = "role")
    Page<User> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "role")
    Page<User> findByFullNameContainingIgnoreCaseAndIdNot(
            String fullName, UUID excludedUserId, Pageable pageable);
}
