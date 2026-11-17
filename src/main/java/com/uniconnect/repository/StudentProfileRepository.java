package com.uniconnect.repository;

import com.uniconnect.entity.StudentProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, UUID> {

    @EntityGraph(attributePaths = "user")
    Optional<StudentProfile> findWithUserById(UUID id);

    @EntityGraph(attributePaths = "user")
    @Query(
            """
            select profile
            from StudentProfile profile
            join profile.user user
            where lower(user.fullName) like lower(concat('%', :query, '%'))
                or lower(profile.universityName) like lower(concat('%', :query, '%'))
                or lower(profile.faculty) like lower(concat('%', :query, '%'))
                or lower(profile.departmentOrField) like lower(concat('%', :query, '%'))
            """)
    Page<StudentProfile> searchStudents(
            @Param("query") String query, Pageable pageable);
}
