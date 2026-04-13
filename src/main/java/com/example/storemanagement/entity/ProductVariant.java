package com.example.storemanagement.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "product_variants")
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String size;
    private String color;
    private String weight;
    private double priceAdjustment;
    private int stock;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getWeight() { return weight; }
    public void setWeight(String weight) { this.weight = weight; }

    public double getPriceAdjustment() { return priceAdjustment; }
    public void setPriceAdjustment(double priceAdjustment) { this.priceAdjustment = priceAdjustment; }

    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
}
