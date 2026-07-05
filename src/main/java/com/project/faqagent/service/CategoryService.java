package com.project.faqagent.service;

import com.project.faqagent.exception.ResourceNotFoundException;
import com.project.faqagent.model.dto.CategoryDto;
import com.project.faqagent.model.entity.Category;
import com.project.faqagent.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public CategoryDto createCategory(CategoryDto dto) {
        Category category = new Category();
        category.setNameAr(dto.getNameAr());
        category.setNameEn(dto.getNameEn());
        Category saved = categoryRepository.save(category);
        return mapToDto(saved);
    }
    
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }

    public Category getCategoryEntity(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + id));
    }

    private CategoryDto mapToDto(Category category) {
        CategoryDto dto = new CategoryDto();
        dto.setId(category.getId());
        dto.setNameAr(category.getNameAr());
        dto.setNameEn(category.getNameEn());
        return dto;
    }
}
