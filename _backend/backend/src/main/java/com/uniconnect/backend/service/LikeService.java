package com.uniconnect.backend.service;

import com.uniconnect.backend.dto.LikeResponse;
import com.uniconnect.backend.entity.Like;
import com.uniconnect.backend.entity.Post;
import com.uniconnect.backend.entity.User;
import com.uniconnect.backend.repository.LikeRepository;
import com.uniconnect.backend.repository.PostRepository;
import com.uniconnect.backend.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

import com.uniconnect.backend.entity.Notification;
import com.uniconnect.backend.repository.NotificationRepository;

@Service
public class LikeService {

    private final LikeRepository likeRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public LikeService(
            LikeRepository likeRepository,
            PostRepository postRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository) {

        this.likeRepository = likeRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    // LIKE POST
    public LikeResponse likePost(
            Long postId,
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        // Find user from JWT email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        if ("SUSPENDED".equals(user.getAccountStatus())) {
            throw new AccessDeniedException("Suspended users cannot like posts");
        }

        // Find post
        Post post = postRepository.findById(postId)
                .orElseThrow(() ->
                        new RuntimeException("Post not found"));

        // Check whether already liked
        if (likeRepository.existsByUser_EmailAndPost_Id(
                email, postId)) {

            throw new RuntimeException(
                    "You have already liked this post");
        }

        Like like = new Like();

        like.setUser(user);
        like.setPost(post);
        like.setCreatedAt(LocalDateTime.now());

        Like savedLike = likeRepository.save(like);
        

        // Create notification for post owner
if (!post.getUser().getEmail().equals(email)) {

    Notification notification = new Notification();

    notification.setMessage(
            user.getName() + " liked your post"
    );

    notification.setType("LIKE");
    notification.setRead(false);
    notification.setCreatedAt(LocalDateTime.now());
    notification.setUser(post.getUser());
    notification.setPost(post);

    notificationRepository.save(notification);
}

        return convertToResponse(savedLike);
    }

    // UNLIKE POST
    public boolean unlikePost(
            Long postId,
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        Like like = likeRepository
                .findByUser_EmailAndPost_Id(email, postId)
                .orElse(null);

        if (like == null) {
            return false;
        }

        likeRepository.delete(like);

        return true;
    }

    // GET ALL LIKES OF A POST
    public List<LikeResponse> getPostLikes(Long postId) {

        if (!postRepository.existsById(postId)) {
            throw new RuntimeException("Post not found");
        }

        return likeRepository.findByPost_Id(postId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // GET LIKE COUNT
    public long getLikeCount(Long postId) {

        if (!postRepository.existsById(postId)) {
            throw new RuntimeException("Post not found");
        }

        return likeRepository.countByPost_Id(postId);
    }

    // CHECK WHETHER CURRENT USER LIKED
    public boolean hasLiked(
            Long postId,
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        return likeRepository.existsByUser_EmailAndPost_Id(
                email,
                postId
        );
    }

    // Entity → Response DTO
    private LikeResponse convertToResponse(Like like) {

        return new LikeResponse(
                like.getId(),
                like.getUser().getId(),
                like.getUser().getName(),
                like.getPost().getId(),
                like.getCreatedAt()
        );
    }
}