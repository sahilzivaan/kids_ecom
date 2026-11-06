<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ProductModel;

class AdminProductController extends BaseController
{
    public function index()
    {
        $model = new ProductModel();
        $products = $model->orderBy('id', 'DESC')->findAll();
        $imageModel = new \App\Models\ProductImageModel();
        $variantModel = new \App\Models\ProductVariantModel();
        foreach ($products as &$p) {
            $p['images'] = $imageModel->where('product_id', $p['id'])->orderBy('display_order', 'ASC')->findAll();
            $p['variants'] = $variantModel->where('product_id', $p['id'])->findAll();
        }
        return $this->response->setJSON(['products' => $products]);
    }

    public function create()
    {
        $rules = [
            'name'     => 'required|min_length[3]',
            'category' => 'required',
            'mrp'      => 'required|numeric'
        ];

        if (!$this->validate($rules)) {
            return $this->response->setStatusCode(400)->setJSON([
                'error' => $this->validator->getErrors()
            ]);
        }

        $model = new ProductModel();
        $input = $this->request->getJSON(true) ?: $this->request->getRawInput();
        
        $data = [
            'name'        => $input['name'] ?? null,
            'category'    => $input['category'] ?? null,
            'status'      => $input['status'] ?? 'Active',
            'mrp'         => $input['mrp'] ?? 0,
            'sale'        => $input['sale'] ?? null,
            'stock'       => $input['stock'] ?? 0,
            'sizes'       => $input['sizes'] ?? null,
            'description' => $input['description'] ?? null
        ];

        $model->insert($data);
        $productId = $model->getInsertID();
        $data['id'] = $productId;

        if (isset($input['images']) && is_array($input['images'])) {
            $imageModel = new \App\Models\ProductImageModel();
            foreach ($input['images'] as $idx => $img) {
                $imageModel->insert([
                    'product_id' => $productId,
                    'image_url' => $img['url'] ?? $img['image_url'],
                    'display_order' => $img['display_order'] ?? $idx,
                    'is_primary' => $img['is_primary'] ?? ($idx === 0 ? 1 : 0)
                ]);
            }
        }

        if (isset($input['variants']) && is_array($input['variants'])) {
            $variantModel = new \App\Models\ProductVariantModel();
            foreach ($input['variants'] as $v) {
                $variantModel->insert([
                    'product_id' => $productId,
                    'sku' => $v['sku'] ?? null,
                    'color' => $v['color'] ?? null,
                    'size' => $v['size'] ?? null,
                    'stock' => $v['stock'] ?? 0,
                    'price' => $v['price'] ?? null,
                    'sale_price' => $v['sale_price'] ?? null,
                    'image_url' => $v['image_url'] ?? null
                ]);
            }
        }

        return $this->response->setStatusCode(201)->setJSON([
            'message' => 'Product created successfully',
            'product' => $data
        ]);
    }

    public function update($id = null)
    {
        $model = new ProductModel();
        $product = $model->find($id);

        if (!$product) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Product not found']);
        }

        $input = $this->request->getJSON(true) ?: $this->request->getRawInput();

        $data = [];
        $allowed = ['name', 'category', 'status', 'mrp', 'sale', 'stock', 'sizes', 'description'];
        
        foreach ($allowed as $field) {
            if (isset($input[$field])) {
                $data[$field] = $input[$field];
            }
        }

        if (!empty($data)) {
            $model->update($id, $data);
        }

        if (isset($input['images']) && is_array($input['images'])) {
            $imageModel = new \App\Models\ProductImageModel();
            $imageModel->where('product_id', $id)->delete();
            foreach ($input['images'] as $idx => $img) {
                $imageModel->insert([
                    'product_id' => $id,
                    'image_url' => $img['url'] ?? $img['image_url'],
                    'display_order' => $img['display_order'] ?? $idx,
                    'is_primary' => $img['is_primary'] ?? ($idx === 0 ? 1 : 0)
                ]);
            }
        }

        if (isset($input['variants']) && is_array($input['variants'])) {
            $variantModel = new \App\Models\ProductVariantModel();
            $variantModel->where('product_id', $id)->delete();
            foreach ($input['variants'] as $v) {
                $variantModel->insert([
                    'product_id' => $id,
                    'sku' => $v['sku'] ?? null,
                    'color' => $v['color'] ?? null,
                    'size' => $v['size'] ?? null,
                    'stock' => $v['stock'] ?? 0,
                    'price' => $v['price'] ?? null,
                    'sale_price' => $v['sale_price'] ?? null,
                    'image_url' => $v['image_url'] ?? null
                ]);
            }
        }

        return $this->response->setJSON([
            'message' => 'Product updated successfully'
        ]);
    }

    public function delete($id = null)
    {
        $model = new ProductModel();
        $product = $model->find($id);

        if (!$product) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Product not found']);
        }

        $model->delete($id);

        return $this->response->setJSON(['message' => 'Product deleted successfully']);
    }
}
