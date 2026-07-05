package com.project.faqagent.model.dto;
import lombok.Data;
@Data
public class AskQuestionRequest {
    private String sessionId;
    private String question;
    private String language; // "ar" or "en"
    private String role; // "user" or "admin"
}
