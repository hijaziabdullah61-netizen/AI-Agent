package com.project.faqagent.repository;

import com.project.faqagent.model.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findBySessionId(String sessionId);
    List<Conversation> findByIsEscalatedTrue();

    @Transactional
    void deleteBySessionId(String sessionId);
}
