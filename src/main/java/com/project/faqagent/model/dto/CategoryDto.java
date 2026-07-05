package com.project.faqagent.model.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class CategoryDto {
    private Long id;
    @NotBlank(message = "Arabic name is required")
    private String nameAr;
    @NotBlank(message = "English name is required")
    private String nameEn;
}
