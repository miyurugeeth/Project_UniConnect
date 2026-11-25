package com.uniconnect.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Nationalized;

@Entity
@Table(name = "post_categories", schema = "dbo")
public class PostCategory {

    @Id
    @Column(name = "category_code", nullable = false, updatable = false, length = 64)
    private String code;

    @Nationalized
    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    protected PostCategory() {
    }

    public PostCategory(String code, String displayName, int displayOrder, boolean active) {
        this.code = code;
        this.displayName = displayName;
        this.displayOrder = displayOrder;
        this.active = active;
    }

    public String getCode() {
        return code;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public boolean isActive() {
        return active;
    }
}
