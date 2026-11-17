package com.uniconnect.repository;

import com.uniconnect.dto.social.PostLikeAggregate;
import com.uniconnect.entity.StudentPostLike;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudentPostLikeRepository extends JpaRepository<StudentPostLike, UUID> {

    boolean existsByPost_IdAndStudent_Id(UUID postId, UUID studentId);

    Optional<StudentPostLike> findByPost_IdAndStudent_Id(UUID postId, UUID studentId);

    long countByPost_Id(UUID postId);

    @Query(
            "select new com.uniconnect.dto.social.PostLikeAggregate(l.post.id, count(l.id)) "
                    + "from StudentPostLike l where l.post.id in :postIds group by l.post.id")
    List<PostLikeAggregate> countForPosts(@Param("postIds") Collection<UUID> postIds);

    @Query(
            "select l.post.id from StudentPostLike l "
                    + "where l.post.id in :postIds and l.student.id = :studentId")
    Set<UUID> findLikedPostIds(
            @Param("postIds") Collection<UUID> postIds, @Param("studentId") UUID studentId);
}
