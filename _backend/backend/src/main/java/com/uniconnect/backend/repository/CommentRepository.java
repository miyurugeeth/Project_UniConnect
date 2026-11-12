package com.uniconnect.backend.repository;

import com.uniconnect.backend.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    // Get all comments of a specific post
    List<Comment> findByPost_Id(Long postId);

    // Get comments created by a specific user
    List<Comment> findByUser_Email(String email);

    // Delete all comments of a specific post
    void deleteByPost_Id(Long postId);
}