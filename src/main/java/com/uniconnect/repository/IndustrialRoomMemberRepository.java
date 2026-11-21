package com.uniconnect.industrial.repository;

import com.uniconnect.industrial.entity.IndustrialRoomMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IndustrialRoomMemberRepository extends JpaRepository<IndustrialRoomMember, UUID> {
    Optional<IndustrialRoomMember> findByRoomIdAndUserId(UUID roomId, UUID userId);
    List<IndustrialRoomMember> findByRoomId(UUID roomId);
    List<IndustrialRoomMember> findByUserId(UUID userId);
}