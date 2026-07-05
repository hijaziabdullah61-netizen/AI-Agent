package com.project.faqagent.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
public class FollowUp {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "faq_id")
    @JsonIgnore
    private Faq faq;
    
    private String questionAr;
    private String questionEn;
}
