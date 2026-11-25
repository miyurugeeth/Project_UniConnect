package com.uniconnect.repository;

import com.uniconnect.entity.PostCategory;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostCategoryRepository extends JpaRepository<PostCategory, String> {

    List<PostCategory> findAllByActiveTrueOrderByDisplayOrderAsc();

    Optional<PostCategory> findByCodeAndActiveTrue(String code);
}
