package com.example.storemanagement.controller;

import com.example.storemanagement.entity.Product;
import com.example.storemanagement.service.ProductService;
import com.example.storemanagement.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductService productService;

    @GetMapping
    public List<Product> getAllProducts() {
        List<Product> products = productRepository.findAll();
        System.out.println("DEBUG: Found " + products.size() + " products in database");
        return products;
    }

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public Product createProduct(@RequestPart("product") Product product, 
                                @RequestPart(value = "image", required = false) MultipartFile image) {
        return productService.saveProduct(product, image);
    }

    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productRepository.findById(id).orElse(null);
    }

    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public Product updateProduct(@PathVariable Long id, 
                                @RequestPart("product") Product productDetails,
                                @RequestPart(value = "image", required = false) MultipartFile image) {
        return productService.updateProduct(id, productDetails, image);
    }

    @PatchMapping("/{id}/adjust-stock")
    public Product adjustStock(@PathVariable Long id, @RequestParam("delta") int delta) {
        return productService.adjustStock(id, delta);
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Long id) {
        productRepository.deleteById(id);
    }

    @PostMapping("/import")
    public ResponseEntity<String> importProducts(@RequestParam("file") MultipartFile file) {
        try {
            productService.importProductsFromCSV(file);
            return ResponseEntity.ok("Products imported successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error importing products: " + e.getMessage());
        }
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportProducts() {
        try {
            byte[] data = productService.generateInventoryExcel();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=inventory.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
