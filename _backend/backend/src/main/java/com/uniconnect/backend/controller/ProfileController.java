package com.uniconnect.backend.controller;

import com.uniconnect.backend.dto.PasswordChangeRequest;
import com.uniconnect.backend.dto.ProfileRequest;
import com.uniconnect.backend.dto.ProfileResponse;
import com.uniconnect.backend.service.ProfileService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    // GET MY PROFILE
    @GetMapping
    public ResponseEntity<ProfileResponse> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                profileService.getMyProfile(userDetails)
        );
    }

    // UPDATE MY PROFILE
    @PutMapping
    public ResponseEntity<ProfileResponse> updateMyProfile(
            @Valid @RequestBody ProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                profileService.updateMyProfile(
                        request,
                        userDetails
                )
        );
    }

    // CHANGE PASSWORD
    @PutMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @Valid @RequestBody PasswordChangeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        profileService.changePassword(
                request,
                userDetails
        );

        return ResponseEntity.ok(
                "Password changed successfully"
        );
    }
}

