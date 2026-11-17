package com.uniconnect.repository;

import com.uniconnect.dto.social.PostCommentAggregate;
import com.uniconnect.entity.StudentPostComment;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudentPostCommentRepository
        extends JpaRepository<StudentPostComment, UUID> {

    @EntityGraph(attributePaths = {"author", "author.user"})
    Page<StudentPostComment> findAllByPost_IdOrderByCreatedAtAscIdAsc(
            UUID postId, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "author.user"})
    Optional<StudentPostComment> findWithAuthorByIdAndPost_Id(UUID commentId, UUID postId);

    long countByPost_Id(UUID postId);

    @Query(
            "select new com.uniconnect.dto.social.PostCommentAggregate(c.post.id, count(c.id)) "
                    + "from StudentPostComment c where c.post.id in :postIds group by c.post.id")
    List<PostCommentAggregate> countForPosts(@Param("postIds") Collection<UUID> postIds);
}
