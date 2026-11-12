package com.uniconnect.backend.service;

import com.uniconnect.backend.dto.PublicProfileResponse;
import com.uniconnect.backend.dto.UserSearchResponse;
import com.uniconnect.backend.entity.User;
import com.uniconnect.backend.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserSearchService {

    private final UserRepository userRepository;

    public UserSearchService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // SEARCH USERS
    public List<UserSearchResponse> searchUsers(String query) {

        return userRepository
                .findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                        query,
                        query
                )
                .stream()
                .map(this::convertToSearchResponse)
                .toList();
    }

    // GET PUBLIC PROFILE
    public PublicProfileResponse getPublicProfile(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return new PublicProfileResponse(
                user.getId(),
                user.getName(),
                user.getUniversity(),
                user.getFaculty(),
                user.getBatch(),
                user.getRole()
        );
    }

    // Entity → UserSearchResponse
    private UserSearchResponse convertToSearchResponse(User user) {

        return new UserSearchResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getUniversity(),
                user.getFaculty(),
                user.getBatch(),
                user.getRole()
        );
    }
}