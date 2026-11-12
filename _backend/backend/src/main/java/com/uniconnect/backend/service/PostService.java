package com.uniconnect.backend.service;

import com.uniconnect.backend.dto.PostRequest;
import com.uniconnect.backend.dto.PostResponse;
import com.uniconnect.backend.entity.Post;
import com.uniconnect.backend.entity.User;
import com.uniconnect.backend.repository.CommentRepository;
import com.uniconnect.backend.repository.LikeRepository;
import com.uniconnect.backend.repository.NotificationRepository;
import com.uniconnect.backend.repository.PostRepository;
import com.uniconnect.backend.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;
    private final FileStorageService fileStorageService;

    public PostService(
            PostRepository postRepository,
            UserRepository userRepository,
            LikeRepository likeRepository,
            CommentRepository commentRepository,
            NotificationRepository notificationRepository,
            FileStorageService fileStorageService) {

        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.notificationRepository = notificationRepository;
        this.fileStorageService = fileStorageService;
    }

    // CREATE POST
    public PostResponse createPost(
            PostRequest request,
            UserDetails userDetails) {

        return createPost(request, userDetails, null);
        }

        public PostResponse createPost(
            PostRequest request,
            UserDetails userDetails,
            MultipartFile file) {

        String email = userDetails.getUsername();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        if ("SUSPENDED".equals(user.getAccountStatus())) {
            throw new AccessDeniedException("Suspended users cannot create posts");
        }

        Post post = new Post();

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setUser(user);

        LocalDateTime now = LocalDateTime.now();

        post.setCreatedAt(now);
        post.setUpdatedAt(now);

        FileStorageService.StoredFile attachment = fileStorageService.store(file);
        if (attachment != null) {
            post.setAttachmentUrl(attachment.url());
            post.setAttachmentName(attachment.name());
            post.setAttachmentType(attachment.type());
        }

        Post savedPost = postRepository.save(post);

        return convertToResponse(savedPost, userDetails);
    }

    // GET ALL POSTS
    public List<PostResponse> getAllPosts(
            UserDetails userDetails) {

        return postRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(post -> convertToResponse(post, userDetails))
                .toList();
    }

    // GET MY POSTS
    public List<PostResponse> getMyPosts(
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        return postRepository.findByUser_EmailOrderByCreatedAtDesc(email)
                .stream()
                .map(post -> convertToResponse(post, userDetails))
                .toList();
    }

    // GET POST BY ID
    public PostResponse getPostById(
            Long id,
            UserDetails userDetails) {

        Post post = postRepository.findById(id)
                .orElse(null);

        if (post == null) {
            return null;
        }

        return convertToResponse(post, userDetails);
    }

    // UPDATE POST
    public PostResponse updatePost(
            Long id,
            PostRequest request,
            UserDetails userDetails) {

        return updatePost(id, request, userDetails, null);
        }

        public PostResponse updatePost(
            Long id,
            PostRequest request,
            UserDetails userDetails,
            MultipartFile file) {

        Post post = postRepository.findById(id)
                .orElse(null);

        if (post == null) {
            return null;
        }

        String email = userDetails.getUsername();

        // Owner check
        if (!post.getUser().getEmail().equals(email)) {
            return null;
        }

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setUpdatedAt(LocalDateTime.now());

        FileStorageService.StoredFile attachment = fileStorageService.store(file);
        if (attachment != null) {
            post.setAttachmentUrl(attachment.url());
            post.setAttachmentName(attachment.name());
            post.setAttachmentType(attachment.type());
        }

        Post updatedPost = postRepository.save(post);

        return convertToResponse(updatedPost, userDetails);
    }

    // DELETE POST
    public boolean deletePost(
            Long id,
            UserDetails userDetails) {

        Post post = postRepository.findById(id)
                .orElse(null);

        if (post == null) {
            return false;
        }

        String email = userDetails.getUsername();

        // Check post ownership
        if (!post.getUser().getEmail().equals(email)) {
            return false;
        }

        // Delete related notifications first so FK constraints are not violated
        notificationRepository.deleteByPost_Id(id);

        // Delete all comments belonging to this post
        commentRepository.deleteByPost_Id(id);

        // Delete all likes belonging to this post
        likeRepository.deleteByPost_Id(id);

        // Finally delete the post
        postRepository.delete(post);

        return true;
    }

    public void deletePostAsAdmin(Long id) {
        if (!postRepository.existsById(id)) {
            throw new IllegalArgumentException("Post not found");
        }

        notificationRepository.deleteByPost_Id(id);
        commentRepository.deleteByPost_Id(id);
        likeRepository.deleteByPost_Id(id);
        postRepository.deleteById(id);
    }

    // Convert Entity → Response DTO
    private PostResponse convertToResponse(
            Post post,
            UserDetails userDetails) {

        Long postId = post.getId();

        // Get like count
        long likeCount =
                likeRepository.countByPost_Id(postId);

        // Get comment count
        long commentCount =
                commentRepository.findByPost_Id(postId).size();

        // Check whether current user liked the post
        boolean likedByCurrentUser = false;

        if (userDetails != null) {

            String email = userDetails.getUsername();

            likedByCurrentUser =
                    likeRepository.existsByUser_EmailAndPost_Id(
                            email,
                            postId
                    );
        }

        return new PostResponse(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getCreatedAt(),
                post.getUpdatedAt(),
                post.getUser().getId(),
                post.getUser().getName(),
                likeCount,
                commentCount,
                likedByCurrentUser,
                post.getAttachmentUrl(),
                post.getAttachmentName(),
                post.getAttachmentType()
        );
    }
}