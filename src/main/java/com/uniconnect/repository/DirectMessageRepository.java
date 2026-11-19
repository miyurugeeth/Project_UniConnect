package com.uniconnect.repository;

import com.uniconnect.entity.DirectMessage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, UUID> {

    @Query(
            """
            select distinct message.recipient.id
            from DirectMessage message
            where message.sender.id = :userId
            """)
    List<UUID> findDistinctRecipientIds(@Param("userId") UUID userId);

    @Query(
            """
            select distinct message.sender.id
            from DirectMessage message
            where message.recipient.id = :userId
            """)
    List<UUID> findDistinctSenderIds(@Param("userId") UUID userId);

    @Query(
            """
            select message
            from DirectMessage message
            where (message.sender.id = :userId and message.recipient.id = :contactId)
                or (message.sender.id = :contactId and message.recipient.id = :userId)
            """)
    Page<DirectMessage> findConversation(
            @Param("userId") UUID userId,
            @Param("contactId") UUID contactId,
            Pageable pageable);
}
