<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

class ImageUploadController extends ResourceController
{
    use ResponseTrait;

    public function upload()
    {
        $file = $this->request->getFile('image');
        if (!$file) {
            return $this->fail('No image file found in the request.');
        }
        
        if (!$file->isValid()) {
            return $this->fail($file->getErrorString());
        }

        if (!$file->hasMoved()) {
            $newName = $file->getRandomName();
            $baseName = pathinfo($newName, PATHINFO_FILENAME);
            $originalPath = FCPATH . 'uploads/originals';
            $optimizedPath = FCPATH . 'uploads/optimized';
            $thumbsPath = FCPATH . 'uploads/thumbs';
            
            // Create directories if they don't exist
            if (!is_dir($originalPath)) mkdir($originalPath, 0777, true);
            if (!is_dir($optimizedPath)) mkdir($optimizedPath, 0777, true);
            if (!is_dir($thumbsPath)) mkdir($thumbsPath, 0777, true);

            $file->move($originalPath, $newName);
            
            $optimizedName = $baseName . '.webp';
            
            try {
                $image = \Config\Services::image();
                
                // 1. Create Optimized WebP (same dimensions, compressed)
                $image->withFile($originalPath . '/' . $newName)
                      ->convert(IMAGETYPE_WEBP)
                      ->save($optimizedPath . '/' . $optimizedName, 80);
                      
                // 2. Create Thumbnail WebP
                $image->withFile($originalPath . '/' . $newName)
                      ->fit(250, 250, 'center')
                      ->convert(IMAGETYPE_WEBP)
                      ->save($thumbsPath . '/' . $optimizedName, 80);
            } catch (\Exception $e) {
                // Fallback: If image generation fails, copy original
                copy($originalPath . '/' . $newName, $optimizedPath . '/' . $newName);
                copy($originalPath . '/' . $newName, $thumbsPath . '/' . $newName);
                $optimizedName = $newName; // Fallback to original extension
            }
            
            // Return the path relative to the root url. We store the original path in DB, and infer others on frontend.
            // But actually returning just the original name is enough if frontend prefixes it.
            // Let's return the full url for compatibility, but the 'url' field should probably be the relative path so DB stores it clean.
            // The frontend currently expects a full URL or a relative path from root. 
            // We will return the relative path to original, so DB stores `uploads/originals/file.jpg`.
            
            return $this->respond([
                'url' => 'uploads/originals/' . $newName,
                'optimized_url' => 'uploads/optimized/' . $optimizedName,
                'thumb_url' => 'uploads/thumbs/' . $optimizedName,
                'message' => 'Image uploaded successfully'
            ]);
        }

        return $this->fail('Could not move the uploaded file.');
    }
}
