package com.uniconnect.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.uniconnect.entity.DirectMessage;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@DataJpaTest(
        properties = {
            "spring.datasource.url=jdbc:h2:mem:direct-messages;MODE=MSSQLServer;DB_CLOSE_DELAY=-1;INIT=CREATE SCHEMA IF NOT EXISTS dbo",
            "spring.datasource.driver-class-name=org.h2.Driver",
            "spring.datasource.username=sa",
            "spring.datasource.password=",
            "spring.flyway.enabled=false",
            "spring.jpa.hibernate.ddl-auto=create-drop",
            "spring.jpa.properties.hibernate.hbm2ddl.create_namespaces=true"
        })
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class DirectMessageRepositoryTest {

    @PersistenceContext private EntityManager entityManager;

    @Autowired private DirectMessageRepository messageRepository;

    @Test
    void returnsOnlyMessagesBetweenTheTwoConversationParticipants() {
        User firstUser = persistUser("First User");
        User secondUser = persistUser("Second User");
        User unrelatedUser = persistUser("Unrelated User");
        entityManager.persist(new DirectMessage(firstUser, secondUser, "First to second"));
        entityManager.persist(new DirectMessage(secondUser, firstUser, "Second to first"));
        entityManager.persist(new DirectMessage(firstUser, unrelatedUser, "Different chat"));
        entityManager.flush();
        entityManager.clear();

        Page<DirectMessage> conversation =
                messageRepository.findConversation(
                        firstUser.getId(),
                        secondUser.getId(),
                        PageRequest.of(
                                0,
                                10,
                                Sort.by(Sort.Direction.DESC, "sentAt")
                                        .and(Sort.by(Sort.Direction.DESC, "id"))));

        assertThat(conversation.getContent()).hasSize(2);
        assertThat(conversation.getContent())
                .extracting(DirectMessage::getContent)
                .containsExactlyInAnyOrder("First to second", "Second to first");
    }

    @Test
    void returnsDistinctConversationPartnersFromBothMessageDirections() {
        User firstUser = persistUser("First User");
        User secondUser = persistUser("Second User");
        User thirdUser = persistUser("Third User");
        entityManager.persist(new DirectMessage(firstUser, secondUser, "One"));
        entityManager.persist(new DirectMessage(firstUser, secondUser, "Two"));
        entityManager.persist(new DirectMessage(thirdUser, firstUser, "Three"));
        entityManager.flush();
        entityManager.clear();

        List<UUID> sentTo = messageRepository.findDistinctRecipientIds(firstUser.getId());
        List<UUID> receivedFrom = messageRepository.findDistinctSenderIds(firstUser.getId());

        assertThat(sentTo).containsExactly(secondUser.getId());
        assertThat(receivedFrom).containsExactly(thirdUser.getId());
    }

    private User persistUser(String fullName) {
        Role role =
                entityManager
                        .createQuery("select role from Role role where role.code = :code", Role.class)
                        .setParameter("code", RoleCode.STUDENT)
                        .getResultStream()
                        .findFirst()
                        .orElseGet(
                                () -> {
                                    Role created = new Role(RoleCode.STUDENT);
                                    entityManager.persist(created);
                                    return created;
                                });
        User user =
                new User(
                        fullName,
                        fullName.toLowerCase().replace(' ', '.') + "@example.test",
                        "password-hash",
                        role);
        entityManager.persist(user);
        entityManager.flush();
        return user;
    }
}
