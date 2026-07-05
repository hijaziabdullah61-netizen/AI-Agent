package com.project.faqagent.model.dto;
import lombok.Data;
import java.util.List;
@Data
public class AskQuestionResponse {
    private String answer;
    private Double confidenceScore;
    private List<String> suggestedFollowUps;
    private boolean isEscalated;
}
