package com.perdomazo.firstproject.Models;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.math.BigDecimal;

// gente no me lo puedo creer es mi primer objeto relacionado a un proyecto 100% personal

// entity which is going to save
// ser la tabla para la base de datos
@Entity
@Table(name = "Gadgets")
public class GadgetModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, unique = true)
    private Long id;

    @NotBlank(message = "Gadget name must not be blank")
    @Column(nullable = false)
    private String name;

    private String model = "";

    @Column(name = "category")
    private String category = "";

    @NotNull(message = "Price is mandatory")
    @DecimalMin(value = "0.0", inclusive = true, message = "Price must be non-negative")
    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @DecimalMin(value = "0.0", inclusive = true, message = "Repair cost must be non-negative")
    @Column(name = "repair_cost", precision = 10, scale = 2)
    private BigDecimal repairCost = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", inclusive = true, message = "Listed price must be non-negative")
    @Column(name = "listed_price", precision = 10, scale = 2, nullable = true)
    private BigDecimal listedPrice;

    @Column(length = 1000)
    private String comments;

    private Boolean repair = false;

    @Column(precision = 10, scale = 2, nullable = true)
    private BigDecimal soldPrice;

    private Boolean isSold = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime registerDate;

    private LocalDateTime soldDate;

    // =========================================================================
    // Constructors
    // =========================================================================

    public GadgetModel() {
        this.category = "";
        this.repairCost = BigDecimal.ZERO;
        this.repair = false;
        this.isSold = false;
    }

    // Legacy 9-arg constructor for backwards compatibility
    public GadgetModel(String name, String model, BigDecimal price, String comments,
                       Boolean repair, BigDecimal soldPrice, Boolean isSold,
                       LocalDateTime registerDate, LocalDateTime soldDate) {
        this();
        this.name = name;
        this.model = model;
        this.price = price;
        this.comments = comments;
        this.repair = repair != null ? repair : false;
        this.soldPrice = soldPrice;
        this.isSold = isSold != null ? isSold : false;
        this.registerDate = registerDate;
        this.soldDate = soldDate;
    }

    // Full business constructor without ID (for Seeder / Testing)
    public GadgetModel(String name, String model, String category, BigDecimal price,
                       BigDecimal repairCost, BigDecimal listedPrice, String comments,
                       Boolean repair, BigDecimal soldPrice, Boolean isSold,
                       LocalDateTime registerDate, LocalDateTime soldDate) {
        this();
        this.name = name;
        this.model = model;
        this.category = category != null ? category : "";
        this.price = price;
        this.repairCost = repairCost != null ? repairCost : BigDecimal.ZERO;
        this.listedPrice = listedPrice;
        this.comments = comments;
        this.repair = repair != null ? repair : false;
        this.soldPrice = soldPrice;
        this.isSold = isSold != null ? isSold : false;
        this.registerDate = registerDate;
        this.soldDate = soldDate;
    }

    // All-args constructor including ID
    public GadgetModel(Long id, String name, String model, String category, BigDecimal price,
                       BigDecimal repairCost, BigDecimal listedPrice, String comments,
                       Boolean repair, BigDecimal soldPrice, Boolean isSold,
                       LocalDateTime registerDate, LocalDateTime soldDate) {
        this(name, model, category, price, repairCost, listedPrice, comments, repair, soldPrice, isSold, registerDate, soldDate);
        this.id = id;
    }

    // =========================================================================
    // Lifecycle Callbacks (Defaults Guarantee)
    // =========================================================================

    @PrePersist
    @PreUpdate
    public void ensureDefaults() {
        if (this.category == null) {
            this.category = "";
        }
        if (this.repairCost == null) {
            this.repairCost = BigDecimal.ZERO;
        }
        if (this.repair == null) {
            this.repair = false;
        }
        if (this.isSold == null) {
            this.isSold = false;
        }
    }

    @PostLoad
    public void onPostLoad() {
        if (this.category == null) {
            this.category = "";
        }
        if (this.repairCost == null) {
            this.repairCost = BigDecimal.ZERO;
        }
        if (this.repair == null) {
            this.repair = false;
        }
        if (this.isSold == null) {
            this.isSold = false;
        }
    }

    // =========================================================================
    // Getters and Setters
    // =========================================================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getCategory() {
        return category != null ? category : "";
    }

    public void setCategory(String category) {
        this.category = category != null ? category : "";
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getRepairCost() {
        return repairCost != null ? repairCost : BigDecimal.ZERO;
    }

    public void setRepairCost(BigDecimal repairCost) {
        this.repairCost = repairCost != null ? repairCost : BigDecimal.ZERO;
    }

    public BigDecimal getListedPrice() {
        return listedPrice;
    }

    public void setListedPrice(BigDecimal listedPrice) {
        this.listedPrice = listedPrice;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public Boolean getRepair() {
        return repair != null ? repair : false;
    }

    public void setRepair(Boolean repair) {
        this.repair = repair != null ? repair : false;
    }

    public BigDecimal getSoldPrice() {
        return soldPrice;
    }

    public void setSoldPrice(BigDecimal soldPrice) {
        this.soldPrice = soldPrice;
    }

    public Boolean getIsSold() {
        return isSold != null ? isSold : false;
    }

    public void setIsSold(Boolean isSold) {
        this.isSold = isSold != null ? isSold : false;
    }

    public LocalDateTime getRegisterDate() {
        return registerDate;
    }

    public void setRegisterDate(LocalDateTime registerDate) {
        this.registerDate = registerDate;
    }

    public LocalDateTime getSoldDate() {
        return soldDate;
    }

    public void setSoldDate(LocalDateTime soldDate) {
        this.soldDate = soldDate;
    }
}
