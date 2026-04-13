package com.example.storemanagement.service;

import com.example.storemanagement.entity.Category;
import com.example.storemanagement.entity.Product;
import com.example.storemanagement.repository.CategoryRepository;
import com.example.storemanagement.repository.ProductRepository;
import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.List;

@Service
@Transactional
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BarcodeService barcodeService;

    @Autowired
    private ActivityLogService activityLogService;

    private final java.nio.file.Path root = java.nio.file.Paths.get("uploads");

    private String getCurrentUsername() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return "system";
    }

    private String saveImage(MultipartFile file) {
        try {
            if (!java.nio.file.Files.exists(root)) {
                java.nio.file.Files.createDirectories(root);
            }
            String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            java.nio.file.Files.copy(file.getInputStream(), this.root.resolve(filename));
            return "/uploads/" + filename;
        } catch (Exception e) {
            throw new RuntimeException("Could not store the file. Error: " + e.getMessage());
        }
    }

    public Product saveProduct(Product product, MultipartFile image) {
        // Validate name to prevent NPE
        if (product.getName() == null || product.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Product name cannot be empty");
        }

        if (image != null && !image.isEmpty()) {
            product.setImagePath(saveImage(image));
        }

        // Resolve Category by name if id is missing
        if (product.getCategory() != null && product.getCategory().getName() != null && !product.getCategory().getName().trim().isEmpty()) {
            final String catName = product.getCategory().getName().trim();
            Category category = categoryRepository.findByName(catName)
                    .orElseGet(() -> categoryRepository.save(new Category(catName)));
            product.setCategory(category);
        }

        // Generate barcode/QR if not present
        if (product.getBarcode() == null || product.getBarcode().isEmpty()) {
            product.setBarcode("BC" + System.currentTimeMillis());
        }
        
        try {
            String qrPath = barcodeService.generateQRCode(product.getBarcode(), product.getName().replaceAll("\\s+", "_"));
            product.setQrCodePath(qrPath);
        } catch (Exception e) {
            e.printStackTrace();
        }

        Product saved = productRepository.saveAndFlush(product);
        activityLogService.log(getCurrentUsername(), "PRODUCT_SAVE", "Saved product: " + saved.getName(), "local");
        return saved;
    }

    public Product adjustStock(Long id, int delta) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
        product.setStock(product.getStock() + delta);
        if (product.getStock() < 0) product.setStock(0);
        Product saved = productRepository.saveAndFlush(product);
        activityLogService.log(getCurrentUsername(), "STOCK_ADJUST", "Adjusted stock for product: " + saved.getName() + " by " + delta, "local");
        return saved;
    }

    public Product updateProduct(Long id, Product details, MultipartFile image) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
        
        product.setName(details.getName());
        product.setDescription(details.getDescription());
        product.setPrice(details.getPrice());
        product.setStock(details.getStock());
        
        if (image != null && !image.isEmpty()) {
            product.setImagePath(saveImage(image));
        }

        // Resolve Category safely
        if (details.getCategory() != null && details.getCategory().getName() != null && !details.getCategory().getName().trim().isEmpty()) {
            String catName = details.getCategory().getName().trim();
            Category category = categoryRepository.findByName(catName)
                    .orElseGet(() -> categoryRepository.save(new Category(catName)));
            product.setCategory(category);
        }

        Product saved = productRepository.saveAndFlush(product);
        activityLogService.log(getCurrentUsername(), "PRODUCT_UPDATE", "Updated product: " + saved.getName(), "local");
        return saved;
    }

    public Product saveProduct(Product product) {
        return saveProduct(product, null);
    }

    public void importProductsFromCSV(MultipartFile file) throws Exception {
        try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            CsvToBean<CSVProduct> csvToBean = new CsvToBeanBuilder<CSVProduct>(reader)
                    .withType(CSVProduct.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();

            List<CSVProduct> csvProducts = csvToBean.parse();
            for (CSVProduct cp : csvProducts) {
                Product p = new Product();
                p.setName(cp.getName());
                p.setDescription(cp.getDescription());
                p.setPrice(cp.getPrice());
                p.setStock(cp.getStock());
                
                Category category = categoryRepository.findByName(cp.getCategory())
                        .orElseGet(() -> categoryRepository.save(new Category(cp.getCategory())));
                p.setCategory(category);
                
                saveProduct(p);
            }
            activityLogService.log(getCurrentUsername(), "PRODUCT_IMPORT", "Imported " + csvProducts.size() + " products from CSV", "local");
        }
    }

    // Helper class for CSV Parsing
    public static class CSVProduct {
        private String name;
        private String description;
        private double price;
        private int stock;
        private String category;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public double getPrice() { return price; }
        public void setPrice(double price) { this.price = price; }
        public int getStock() { return stock; }
        public void setStock(int stock) { this.stock = stock; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
    }

    public byte[] generateInventoryExcel() throws IOException {
        List<Product> products = productRepository.findAll();
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Inventory");

            // Header
            Row headerRow = sheet.createRow(0);
            String[] columns = {"ID", "Name", "Category", "Price", "Stock", "Barcode"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
            }

            // Data
            int rowIdx = 1;
            for (Product product : products) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(product.getId());
                row.createCell(1).setCellValue(product.getName());
                row.createCell(2).setCellValue(product.getCategory() != null ? product.getCategory().getName() : "");
                row.createCell(3).setCellValue(product.getPrice());
                row.createCell(4).setCellValue(product.getStock());
                row.createCell(5).setCellValue(product.getBarcode());
            }

            workbook.write(out);
            activityLogService.log(getCurrentUsername(), "INVENTORY_EXPORT", "Exported product inventory to Excel", "local");
            return out.toByteArray();
        }
    }
}
