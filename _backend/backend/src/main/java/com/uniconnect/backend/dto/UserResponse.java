package com.uniconnect.backend.dto;

public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private String university;
    private String faculty;
    private Integer batch;
    private String role;
    private String accountStatus;

    public UserResponse() {
    }

    public UserResponse(Long id, String name, String email, String university, String faculty, Integer batch) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.university = university;
        this.faculty = faculty;
        this.batch = batch;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUniversity() {
        return university;
    }

    public void setUniversity(String university) {
        this.university = university;
    }

    public String getFaculty() {
        return faculty;
    }

    public void setFaculty(String faculty) {
        this.faculty = faculty;
    }

    public Integer getBatch() {
        return batch;
    }

    public void setBatch(Integer batch) {
        this.batch = batch;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }
}