package com.example.storemanagement.controller;

import com.example.storemanagement.entity.Sale;
import com.example.storemanagement.repository.SaleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private com.example.storemanagement.service.SaleService saleService;

    @GetMapping
    public List<Sale> getAllSales() {
        return saleRepository.findAll();
    }

    @PostMapping
    public Sale createSale(@RequestBody Sale sale) {
        return saleService.processSale(sale);
    }

    @GetMapping("/{id}")
    public Sale getSaleById(@PathVariable Long id) {
        return saleRepository.findById(id).orElse(null);
    }

    @PutMapping("/{id}")
    public Sale updateSale(@PathVariable Long id, @RequestBody Sale saleDetails) {
        Sale sale = saleRepository.findById(id).orElse(null);
        if (sale != null) {
            sale.setCustomer(saleDetails.getCustomer());
            sale.setSaleDate(saleDetails.getSaleDate());
            sale.setTotalAmount(saleDetails.getTotalAmount());
            sale.setPaymentMethod(saleDetails.getPaymentMethod());
            return saleRepository.save(sale);
        }
        return null;
    }

    @DeleteMapping("/{id}")
    public void deleteSale(@PathVariable Long id) {
        saleRepository.deleteById(id);
    }
}