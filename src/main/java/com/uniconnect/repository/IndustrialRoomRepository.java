package com.uniconnect.industrial.repository;

import com.uniconnect.industrial.entity.IndustrialRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IndustrialRoomRepository extends JpaRepository<IndustrialRoom, UUID> {
    Optional<IndustrialRoom> findByIndustryKey(String industryKey);
    List<IndustrialRoom> findAllByOrderByIndustryNameAsc();
}