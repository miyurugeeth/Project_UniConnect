package com.uniconnect.backend.dto;

public class UserSearchResponse {

    private Long id;
    private String name;
    private String email;
    private String university;
    private String faculty;
    private Integer batch;
    private String role;

    public UserSearchResponse(
            Long id,
            String name,
            String email,
            String university,
            String faculty,
            Integer batch,
            String role) {

        this.id = id;
        this.name = name;
        this.email = email;
        this.university = university;
        this.faculty = faculty;
        this.batch = batch;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getUniversity() {
        return university;
    }

    public String getFaculty() {
        return faculty;
    }

    public Integer getBatch() {
        return batch;
    }

    public String getRole() {
        return role;
    }
}