package com.uniconnect.backend.service;

import com.uniconnect.backend.dto.AdminStatsResponse;
import com.uniconnect.backend.dto.CommentResponse;
import com.uniconnect.backend.dto.PostResponse;
import com.uniconnect.backend.repository.CommentRepository;
import com.uniconnect.backend.repository.LikeRepository;
import com.uniconnect.backend.repository.PostRepository;
import com.uniconnect.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;

    public AdminService(
            UserRepository userRepository,
            PostRepository postRepository,
            CommentRepository commentRepository,
            LikeRepository likeRepository) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.likeRepository = likeRepository;
    }

    public AdminStatsResponse getStats() {
        long totalStudents = userRepository.countByRole("STUDENT");
        return new AdminStatsResponse(
                totalStudents,
                userRepository.countByRoleAndAccountStatus("STUDENT", "ACTIVE")
                        + userRepository.countByRoleAndAccountStatusIsNull("STUDENT"),
                userRepository.countByRoleAndAccountStatus("STUDENT", "SUSPENDED"),
                postRepository.count(),
                commentRepository.count(),
                likeRepository.count(),
                userRepository.countByRole("ADMIN")
        );
    }

    public List<PostResponse> getPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(post -> new PostResponse(
                        post.getId(),
                        post.getTitle(),
                        post.getContent(),
                        post.getCreatedAt(),
                        post.getUpdatedAt(),
                        post.getUser().getId(),
                        post.getUser().getName(),
                        likeRepository.countByPost_Id(post.getId()),
                        commentRepository.findByPost_Id(post.getId()).size(),
                        false
                ))
                .toList();
    }

    public List<CommentResponse> getComments() {
        return commentRepository.findAll().stream()
                .map(comment -> new CommentResponse(
                        comment.getId(),
                        comment.getContent(),
                        comment.getCreatedAt(),
                        comment.getUpdatedAt(),
                        comment.getUser().getId(),
                        comment.getUser().getName(),
                        comment.getPost().getId()
                ))
                .toList();
    }
}
