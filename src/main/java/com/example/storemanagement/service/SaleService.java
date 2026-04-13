package com.example.storemanagement.service;

import com.example.storemanagement.entity.Sale;
import com.example.storemanagement.entity.SaleItem;
import com.example.storemanagement.entity.Product;
import com.example.storemanagement.repository.SaleRepository;
import com.example.storemanagement.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class SaleService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private ProductRepository productRepository;

    @Transactional
    public Sale processSale(Sale sale) {
        if (sale.getSaleDate() == null) {
            sale.setSaleDate(LocalDateTime.now());
        }

        double total = 0;
        for (SaleItem item : sale.getItems()) {
            Product product = productRepository.findById(item.getProduct().getId())
                .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProduct().getId()));

            if (product.getStock() < item.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName());
            }

            // Reduce stock
            product.setStock(product.getStock() - item.getQuantity());
            productRepository.save(product);

            // Link item to sale
            item.setSale(sale);
            item.setUnitPrice(product.getPrice());
            total += item.getUnitPrice() * item.getQuantity();
        }

        sale.setTotalAmount(total);
        return saleRepository.save(sale);
    }
}
