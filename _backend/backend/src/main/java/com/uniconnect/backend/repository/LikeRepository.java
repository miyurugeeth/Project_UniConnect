package com.uniconnect.backend.repository;

import com.uniconnect.backend.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {

    // Check whether a user already liked a post
    boolean existsByUser_EmailAndPost_Id(String email, Long postId);

    // Find a specific user's like on a specific post
    Optional<Like> findByUser_EmailAndPost_Id(String email, Long postId);

    // Get all likes of a post
    List<Like> findByPost_Id(Long postId);

    // Get number of likes of a post
    long countByPost_Id(Long postId);

    // Get all likes made by a user
    List<Like> findByUser_Email(String email);

    // Delete all likes of a specific post
    void deleteByPost_Id(Long postId);
}