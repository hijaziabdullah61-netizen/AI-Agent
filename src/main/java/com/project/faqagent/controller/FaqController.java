package com.project.faqagent.controller;

import com.project.faqagent.model.dto.FaqDto;
import com.project.faqagent.service.FaqService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faqs")
@RequiredArgsConstructor
@CrossOrigin("*")
public class FaqController {

    private final FaqService faqService;

    @GetMapping
    public List<FaqDto> getAllFaqs(@RequestParam(required = false) Long categoryId) {
        if (categoryId != null) {
            return faqService.getFaqsByCategory(categoryId);
        }
        return faqService.getAllFaqs();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FaqDto createFaq(@Valid @RequestBody FaqDto dto) {
        return faqService.createFaq(dto);
    }

    @PutMapping("/{id}")
    public FaqDto updateFaq(@PathVariable Long id, @Valid @RequestBody FaqDto dto) {
        return faqService.updateFaq(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFaq(@PathVariable Long id) {
        faqService.deleteFaq(id);
    }
}
