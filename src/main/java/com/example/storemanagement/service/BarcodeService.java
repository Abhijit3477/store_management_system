package com.example.storemanagement.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.oned.Code128Writer;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class BarcodeService {

    private final String STORAGE_PATH = "uploads/codes/";

    public String generateQRCode(String text, String fileName) throws Exception {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, 200, 200);

        Path path = Paths.get(STORAGE_PATH + fileName + "_qr.png");
        java.io.File directory = new java.io.File(STORAGE_PATH);
        if (!directory.exists()) directory.mkdirs();

        MatrixToImageWriter.writeToPath(bitMatrix, "PNG", path);
        return path.toString();
    }

    public String generateBarcode(String text, String fileName) throws Exception {
        Code128Writer barcodeWriter = new Code128Writer();
        BitMatrix bitMatrix = barcodeWriter.encode(text, BarcodeFormat.CODE_128, 300, 100);

        Path path = Paths.get(STORAGE_PATH + fileName + "_barcode.png");
        java.io.File directory = new java.io.File(STORAGE_PATH);
        if (!directory.exists()) directory.mkdirs();

        MatrixToImageWriter.writeToPath(bitMatrix, "PNG", path);
        return path.toString();
    }
}
