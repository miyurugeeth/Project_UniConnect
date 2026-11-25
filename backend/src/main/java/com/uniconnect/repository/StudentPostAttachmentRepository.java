package com.uniconnect.repository;

import com.uniconnect.entity.StudentPostAttachment;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentPostAttachmentRepository
        extends JpaRepository<StudentPostAttachment, UUID> {

    List<StudentPostAttachment> findAllByPost_IdInOrderByCreatedAtAscIdAsc(
            Collection<UUID> postIds);

    List<StudentPostAttachment> findAllByPost_IdOrderByCreatedAtAscIdAsc(UUID postId);
}
