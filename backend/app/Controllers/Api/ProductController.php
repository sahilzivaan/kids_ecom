<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ProductModel;

class ProductController extends BaseController
{
    public function index()
    {
        $model = new ProductModel();
        
        // Only return Active products
        $model->where('status', 'Active');
        
        // Filter by category
        $category = $this->request->getVar('category');
        if (!empty($category)) {
            $model->where('category', $category);
        }

        // Search by name
        $search = $this->request->getVar('search');
        if (!empty($search)) {
            $model->like('name', $search);
        }

        // Filter by max price
        $maxPrice = $this->request->getVar('max_price');
        if (!empty($maxPrice)) {
            $model->groupStart()
                  ->where('sale <=', $maxPrice)
                  ->orWhere('mrp <=', $maxPrice)
                  ->groupEnd();
        }

        // Sorting
        $sortBy = $this->request->getVar('sort_by');
        if ($sortBy === 'price_asc') {
            $model->orderBy('sale', 'ASC');
        } else if ($sortBy === 'price_desc') {
            $model->orderBy('sale', 'DESC');
        } else {
            // Newest Arrivals
            $model->orderBy('id', 'DESC');
        }

        // Pagination
        $page = (int) $this->request->getVar('page') ?: 1;
        $limit = (int) $this->request->getVar('limit') ?: 12;
        $offset = ($page - 1) * $limit;

        // Clone builder to get total count
        $builder = $model->builder();
        $totalProducts = $model->countAllResults(false);
        $totalPages = ceil($totalProducts / $limit);

        $products = $model->findAll($limit, $offset);

        $imageModel = new \App\Models\ProductImageModel();
        $variantModel = new \App\Models\ProductVariantModel();
        foreach ($products as &$p) {
            $p['images'] = $imageModel->where('product_id', $p['id'])->orderBy('display_order', 'ASC')->findAll();
            $p['variants'] = $variantModel->where('product_id', $p['id'])->findAll();
        }

        return $this->response->setJSON([
            'products' => $products,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $totalPages,
                'has_more' => $page < $totalPages
            ]
        ]);
    }

    public function show($id = null)
    {
        $model = new ProductModel();
        
        $product = $model->where('status', 'Active')->find($id);

        if (!$product) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Product not found']);
        }

        $imageModel = new \App\Models\ProductImageModel();
        $product['images'] = $imageModel->where('product_id', $product['id'])->orderBy('display_order', 'ASC')->findAll();

        $variantModel = new \App\Models\ProductVariantModel();
        $product['variants'] = $variantModel->where('product_id', $product['id'])->findAll();

        return $this->response->setJSON($product);
    }
}
