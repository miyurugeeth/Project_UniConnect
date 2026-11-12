package com.uniconnect.backend.service;

import com.uniconnect.backend.dto.PasswordChangeRequest;
import com.uniconnect.backend.dto.ProfileRequest;
import com.uniconnect.backend.dto.ProfileResponse;
import com.uniconnect.backend.entity.User;
import com.uniconnect.backend.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // GET MY PROFILE
    public ProfileResponse getMyProfile(
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return convertToResponse(user);
    }

    // UPDATE MY PROFILE
    public ProfileResponse updateMyProfile(
            ProfileRequest request,
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // Update profile details
        user.setName(request.getName());
        user.setUniversity(request.getUniversity());
        user.setFaculty(request.getFaculty());
        user.setBatch(request.getBatch());

        User updatedUser = userRepository.save(user);

        return convertToResponse(updatedUser);
    }

    // CHANGE PASSWORD
    public void changePassword(
            PasswordChangeRequest request,
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // Check current password
        if (!passwordEncoder.matches(
                request.getCurrentPassword(),
                user.getPassword())) {

            throw new RuntimeException(
                    "Current password is incorrect");
        }

        // Encode new password
        String encodedPassword =
                passwordEncoder.encode(
                        request.getNewPassword());

        // Save new password
        user.setPassword(encodedPassword);

        userRepository.save(user);
    }

    // Entity → Response DTO
    private ProfileResponse convertToResponse(User user) {

        return new ProfileResponse(
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