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
    @EntityGraph(attributePaths = {"author", "author.role", "category"})
    Page<StudentPost> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"author", "author.role", "category"})
    Optional<StudentPost> findWithAuthorById(UUID id);

    @EntityGraph(attributePaths = {"author", "author.role", "category"})
    Page<StudentPost> findAllByCategory_Code(String categoryCode, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "author.role", "category"})
    Page<StudentPost> findAllByAuthor_Id(UUID authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "author.role", "category"})
    Page<StudentPost> findAllByAuthor_IdAndCategory_Code(
            UUID authorId, String categoryCode, Pageable pageable);
}
