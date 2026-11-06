<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$uploadDir = __DIR__ . '/../images/uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
$allowedExts  = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
$maxSize      = 5 * 1024 * 1024; // 5MB

$responseFiles = [];
$errors = [];

// Standardize file array format
$filesInput = [];
if (isset($_FILES['files'])) {
    $raw = $_FILES['files'];
    if (is_array($raw['name'])) {
        for ($i = 0; $i < count($raw['name']); $i++) {
            if ($raw['error'][$i] === UPLOAD_ERR_OK) {
                $filesInput[] = [
                    'name'     => $raw['name'][$i],
                    'type'     => $raw['type'][$i],
                    'tmp_name' => $raw['tmp_name'][$i],
                    'size'     => $raw['size'][$i]
                ];
            }
        }
    } else if ($raw['error'] === UPLOAD_ERR_OK) {
        $filesInput[] = $raw;
    }
} else if (isset($_FILES['file'])) {
    if ($_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $filesInput[] = $_FILES['file'];
    }
}

if (empty($filesInput)) {
    echo json_encode(['success' => false, 'message' => 'No files uploaded or error during upload']);
    exit;
}

foreach ($filesInput as $file) {
    $origName = $file['name'];
    $size     = $file['size'];
    $tmpName  = $file['tmp_name'];
    $ext      = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

    if ($size > $maxSize) {
        $errors[] = "{$origName}: File exceeds 5MB limit";
        continue;
    }

    $mime = mime_content_type($tmpName);
    if (!in_array($mime, $allowedTypes) && !in_array($ext, $allowedExts)) {
        $errors[] = "{$origName}: File type not allowed ({$mime})";
        continue;
    }

    $newFilename = 'media_' . date('Ymd_His') . '_' . substr(md5(uniqid(mt_rand(), true)), 0, 8) . '.' . $ext;
    $targetPath  = $uploadDir . $newFilename;
    $relativePath = 'images/uploads/' . $newFilename;
    $fileUrl      = '../images/uploads/' . $newFilename;

    if (move_uploaded_file($tmpName, $targetPath)) {
        $dimensions = @getimagesize($targetPath);
        $width  = $dimensions ? $dimensions[0] : null;
        $height = $dimensions ? $dimensions[1] : null;

        if ($pdo) {
            $stmt = $pdo->prepare("INSERT INTO media_library 
                (filename, original_name, file_path, file_url, file_size, mime_type, width, height, uploaded_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $newFilename,
                $origName,
                $relativePath,
                $fileUrl,
                $size,
                $mime,
                $width,
                $height,
                $_SESSION['admin_name'] ?? 'Super Admin'
            ]);
            $mediaId = $pdo->lastInsertId();
        } else {
            $mediaId = rand(100, 9999);
        }

        $responseFiles[] = [
            'id'            => (int)$mediaId,
            'filename'      => $newFilename,
            'original_name' => $origName,
            'url'           => $fileUrl,
            'file_path'     => $relativePath,
            'file_size'     => $size,
            'mime_type'     => $mime,
            'width'         => $width,
            'height'        => $height,
            'created_at'    => date('Y-m-d H:i:s')
        ];
    } else {
        $errors[] = "{$origName}: Failed to save file";
    }
}

echo json_encode([
    'success' => count($responseFiles) > 0,
    'files'   => $responseFiles,
    'errors'  => $errors
]);
