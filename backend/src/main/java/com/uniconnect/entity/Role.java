package com.uniconnect.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "roles", schema = "dbo")
public class Role {

    @Id
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "role_code", nullable = false, length = 20)
    private RoleCode code;

    protected Role() {
    }

    public Role(RoleCode code) {
        this.code = code;
    }

    public RoleCode getCode() {
        return code;
    }
}
