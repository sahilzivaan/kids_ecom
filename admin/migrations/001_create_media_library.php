<?php
require_once __DIR__ . '/../includes/db.php';

if (!$pdo) {
    die("Database connection failed.\n");
}

try {
    echo "Running migration: 001_create_media_library...\n";

    // Create media_library table
    $sqlTable = "CREATE TABLE IF NOT EXISTS media_library (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_size INT UNSIGNED NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        width SMALLINT UNSIGNED DEFAULT NULL,
        height SMALLINT UNSIGNED DEFAULT NULL,
        uploaded_by VARCHAR(100) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    $pdo->exec($sqlTable);
    echo "Table 'media_library' created/verified.\n";

    // Check if media_id column exists in product_images
    $checkCol = $pdo->query("SHOW COLUMNS FROM product_images LIKE 'media_id'");
    if ($checkCol->rowCount() === 0) {
        $sqlAlter = "ALTER TABLE product_images ADD COLUMN media_id INT UNSIGNED DEFAULT NULL";
        $pdo->exec($sqlAlter);
        echo "Column 'media_id' added to 'product_images'.\n";
    } else {
        echo "Column 'media_id' already exists in 'product_images'.\n";
    }

    echo "Migration completed successfully!\n";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
