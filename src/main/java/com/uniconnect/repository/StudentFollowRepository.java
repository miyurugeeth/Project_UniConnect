package com.uniconnect.repository;

import com.uniconnect.entity.StudentFollow;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentFollowRepository extends JpaRepository<StudentFollow, UUID> {

    boolean existsByFollower_IdAndFollowing_Id(UUID followerId, UUID followingId);

    Optional<StudentFollow> findByFollower_IdAndFollowing_Id(
            UUID followerId, UUID followingId);

    long countByFollowing_Id(UUID followingId);

    long countByFollower_Id(UUID followerId);

    @EntityGraph(attributePaths = {"follower", "follower.user"})
    Page<StudentFollow> findAllByFollowing_IdOrderByCreatedAtDescIdDesc(
            UUID followingId, Pageable pageable);

    @EntityGraph(attributePaths = {"following", "following.user"})
    Page<StudentFollow> findAllByFollower_IdOrderByCreatedAtDescIdDesc(
            UUID followerId, Pageable pageable);
}
