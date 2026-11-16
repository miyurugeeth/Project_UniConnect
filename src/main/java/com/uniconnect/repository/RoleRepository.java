package com.uniconnect.repository;

import com.uniconnect.entity.Role;
import com.uniconnect.entity.RoleCode;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, RoleCode> {
}
