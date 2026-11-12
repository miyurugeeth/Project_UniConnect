package com.uniconnect.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ProfileRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "University is required")
    private String university;

    @NotBlank(message = "Faculty is required")
    private String faculty;

    @NotNull(message = "Batch is required")
    private Integer batch;

    public ProfileRequest() {
    }

    public String getName() {
        return name;
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

    public void setName(String name) {
        this.name = name;
    }

    public void setUniversity(String university) {
        this.university = university;
    }

    public void setFaculty(String faculty) {
        this.faculty = faculty;
    }

    public void setBatch(Integer batch) {
        this.batch = batch;
    }
}