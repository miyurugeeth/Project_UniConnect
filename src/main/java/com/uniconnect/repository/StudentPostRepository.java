package com.uniconnect.repository;

import com.uniconnect.entity.StudentPost;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentPostRepository extends JpaRepository<StudentPost, UUID> {

    @Override
    @EntityGraph(attributePaths = {"author", "author.user", "category"})
    Page<StudentPost> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"author", "author.user", "category"})
    Optional<StudentPost> findWithAuthorById(UUID id);

    @EntityGraph(attributePaths = {"author", "author.user", "category"})
    Page<StudentPost> findAllByCategory_Code(String categoryCode, Pageable pageable);
}
