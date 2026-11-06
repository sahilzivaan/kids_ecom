<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

class MediaLibraryController extends ResourceController
{
    use ResponseTrait;

    public function index()
    {
        $db = \Config\Database::connect();
        if ($db->tableExists('media_library')) {
            $builder = $db->table('media_library');
            $items = $builder->orderBy('id', 'DESC')->get()->getResultArray();
        } else {
            $items = [];
        }

        return $this->respond([
            'status' => 200,
            'success' => true,
            'data' => $items
        ]);
    }

    public function upload()
    {
        $files = $this->request->getFiles();
        $uploaded = [];
        $db = \Config\Database::connect();

        $fileInput = [];
        if (isset($files['image'])) {
            $fileInput[] = $files['image'];
        } else if (isset($files['files'])) {
            $fileInput = is_array($files['files']) ? $files['files'] : [$files['files']];
        }

        if (empty($fileInput)) {
            return $this->fail('No file provided');
        }

        foreach ($fileInput as $file) {
            if (!$file->isValid()) continue;

            $newName = $file->getRandomName();
            $originalPath = FCPATH . 'uploads/originals';
            $optimizedPath = FCPATH . 'uploads/optimized';
            $thumbsPath = FCPATH . 'uploads/thumbs';

            if (!is_dir($originalPath)) mkdir($originalPath, 0777, true);
            if (!is_dir($optimizedPath)) mkdir($optimizedPath, 0777, true);
            if (!is_dir($thumbsPath)) mkdir($thumbsPath, 0777, true);

            $file->move($originalPath, $newName);
            $optimizedName = pathinfo($newName, PATHINFO_FILENAME) . '.webp';

            try {
                $image = \Config\Services::image();
                $image->withFile($originalPath . '/' . $newName)->convert(IMAGETYPE_WEBP)->save($optimizedPath . '/' . $optimizedName, 80);
                $image->withFile($originalPath . '/' . $newName)->fit(250, 250, 'center')->convert(IMAGETYPE_WEBP)->save($thumbsPath . '/' . $optimizedName, 80);
            } catch (\Exception $e) {
                copy($originalPath . '/' . $newName, $optimizedPath . '/' . $newName);
                copy($originalPath . '/' . $newName, $thumbsPath . '/' . $newName);
                $optimizedName = $newName;
            }

            $origName = $file->getClientName();
            $size = $file->getSize();
            $mime = $file->getClientMimeType();
            $fileUrl = 'uploads/originals/' . $newName;

            $mediaId = null;
            if ($db->tableExists('media_library')) {
                $db->table('media_library')->insert([
                    'filename' => $newName,
                    'original_name' => $origName,
                    'file_path' => $fileUrl,
                    'file_url' => $fileUrl,
                    'file_size' => $size,
                    'mime_type' => $mime,
                    'uploaded_by' => 'admin',
                    'created_at' => date('Y-m-d H:i:s')
                ]);
                $mediaId = $db->insertID();
            }

            $uploaded[] = [
                'id' => $mediaId,
                'url' => $fileUrl,
                'filename' => $newName,
                'original_name' => $origName,
                'file_size' => $size,
                'mime_type' => $mime
            ];
        }

        return $this->respond([
            'status' => 200,
            'success' => true,
            'url' => count($uploaded) > 0 ? $uploaded[0]['url'] : '',
            'files' => $uploaded,
            'message' => 'Uploaded successfully'
        ]);
    }

    public function delete($id = null)
    {
        if (!$id) return $this->fail('Invalid ID');

        $db = \Config\Database::connect();
        if ($db->tableExists('media_library')) {
            $item = $db->table('media_library')->where('id', $id)->get()->getRowArray();
            if ($item) {
                @unlink(FCPATH . $item['file_path']);
                $db->table('media_library')->where('id', $id)->delete();
            }
        }

        return $this->respond(['success' => true, 'message' => 'Deleted successfully']);
    }
}
