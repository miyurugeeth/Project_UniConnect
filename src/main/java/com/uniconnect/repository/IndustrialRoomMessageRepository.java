package com.uniconnect.industrial.repository;

import com.uniconnect.industrial.entity.IndustrialRoomMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IndustrialRoomMessageRepository extends JpaRepository<IndustrialRoomMessage, UUID> {
    List<IndustrialRoomMessage> findByRoomIdOrderBySentAtAsc(UUID roomId);
}