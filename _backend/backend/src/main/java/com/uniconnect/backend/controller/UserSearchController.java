package com.uniconnect.backend.controller;

import com.uniconnect.backend.dto.PublicProfileResponse;
import com.uniconnect.backend.dto.UserSearchResponse;
import com.uniconnect.backend.service.UserSearchService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserSearchController {

    private final UserSearchService userSearchService;

    public UserSearchController(
            UserSearchService userSearchService) {

        this.userSearchService = userSearchService;
    }

    // SEARCH USERS
    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResponse>> searchUsers(
            @RequestParam String q) {

        return ResponseEntity.ok(
                userSearchService.searchUsers(q)
        );
    }

    // GET PUBLIC PROFILE
    @GetMapping("/public/{userId}")
    public ResponseEntity<PublicProfileResponse> getPublicProfile(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                userSearchService.getPublicProfile(userId)
        );
    }
}