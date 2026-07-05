package com.project.faqagent.model.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SessionDto {
    private String sessionId;
    private String firstMessage;
    private LocalDateTime updatedAt;
    private int messageCount;
}
