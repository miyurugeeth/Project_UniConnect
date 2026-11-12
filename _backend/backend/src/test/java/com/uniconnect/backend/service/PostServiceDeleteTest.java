package com.uniconnect.backend.service;

import com.uniconnect.backend.entity.Post;
import com.uniconnect.backend.entity.User;
import com.uniconnect.backend.repository.CommentRepository;
import com.uniconnect.backend.repository.LikeRepository;
import com.uniconnect.backend.repository.NotificationRepository;
import com.uniconnect.backend.repository.PostRepository;
import com.uniconnect.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceDeleteTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LikeRepository likeRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private PostService postService;

    @Test
    void deletePostAsAdmin_shouldDeleteNotificationsCommentsAndLikesBeforePostRemoval() {
        Post post = new Post();
        post.setId(7L);
        post.setTitle("Test");
        post.setContent("Hello");
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());

        when(postRepository.existsById(7L)).thenReturn(true);

        postService.deletePostAsAdmin(7L);

        verify(notificationRepository).deleteByPost_Id(7L);
        verify(commentRepository).deleteByPost_Id(7L);
        verify(likeRepository).deleteByPost_Id(7L);
        verify(postRepository).deleteById(7L);
    }

    @Test
    void deletePost_shouldRemoveRelatedDataBeforeDeletingOwnedPost() {
        Post post = new Post();
        User user = new User();
        user.setEmail("student@mail.com");
        post.setId(9L);
        post.setUser(user);

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername("student@mail.com")
                .password("pw")
                .authorities("ROLE_STUDENT")
                .build();

        when(postRepository.findById(9L)).thenReturn(Optional.of(post));

        boolean deleted = postService.deletePost(9L, userDetails);

        assertTrue(deleted);
        verify(notificationRepository).deleteByPost_Id(9L);
        verify(commentRepository).deleteByPost_Id(9L);
        verify(likeRepository).deleteByPost_Id(9L);
        verify(postRepository).delete(post);
    }
}
