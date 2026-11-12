package com.uniconnect.backend.repository;

import com.uniconnect.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

        List<User> findByRole(String role);

        List<User> findByRoleAndNameContainingIgnoreCaseOrRoleAndEmailContainingIgnoreCase(
            String role,
            String name,
            String roleForEmail,
            String email
        );

        long countByRole(String role);

        long countByRoleAndAccountStatus(String role, String accountStatus);

        long countByRoleAndAccountStatusIsNull(String role);

    // Search users by name or email
    List<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String name,
            String email
    );
}