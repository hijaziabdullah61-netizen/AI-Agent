package com.project.faqagent.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String sessionId;
    private String language;
    
    @Column(columnDefinition = "TEXT")
    private String userQuestion;
    
    @Column(columnDefinition = "TEXT")
    private String aiResponse;
    
    @ManyToOne
    @JoinColumn(name = "matched_faq_id")
    private Faq matchedFaq;
    
    private Double confidenceScore;
    
    private boolean isEscalated;
    
    private Boolean answeredFromFaq;
    
    private LocalDateTime createdAt = LocalDateTime.now();
}
