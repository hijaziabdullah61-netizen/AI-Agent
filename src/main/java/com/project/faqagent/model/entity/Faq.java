package com.project.faqagent.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
public class Faq {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String questionAr;
    private String questionEn;
    
    @Column(columnDefinition = "TEXT")
    private String answerAr;
    
    @Column(columnDefinition = "TEXT")
    private String answerEn;
    
    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;
    
    private String status; // e.g. ACTIVE, INACTIVE
    
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @OneToMany(mappedBy = "faq", cascade = CascadeType.ALL)
    private List<FollowUp> followUps;
}
