package com.project.faqagent.model.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
public class FaqDto {
    private Long id;
    
    @NotBlank(message = "Arabic question is required")
    private String questionAr;
    
    @NotBlank(message = "English question is required")
    private String questionEn;
    
    @NotBlank(message = "Arabic answer is required")
    private String answerAr;
    
    @NotBlank(message = "English answer is required")
    private String answerEn;
    
    @NotNull(message = "Category is required")
    private Long categoryId;
    
    private String categoryNameAr;
    private String categoryNameEn;
    
    private String status = "ACTIVE";
    
    private List<FollowUpDto> followUps;
}
