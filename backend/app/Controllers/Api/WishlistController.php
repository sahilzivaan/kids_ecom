<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\WishlistModel;
use App\Models\ProductModel;

class WishlistController extends BaseController
{
    public function index()
    {
        $user = $this->request->user ?? null;
        if (!$user) {
            return $this->response->setJSON(['error' => 'Unauthorized'])->setStatusCode(401);
        }
        $userId = $user->uid;

        $wishlistModel = new WishlistModel();
        $productModel = new ProductModel();

        $items = $wishlistModel->where('user_id', $userId)->findAll();
        
        $products = [];
        $imageModel = new \App\Models\ProductImageModel();

        foreach ($items as $item) {
            $prod = $productModel->find($item['product_id']);
            if ($prod) {
                // Return formatted product, similar to ProductController
                $prod['id'] = (int)$prod['id'];
                $prod['mrp'] = (float)$prod['mrp'];
                $prod['sale'] = (float)$prod['sale'];
                $prod['images'] = $imageModel->where('product_id', $prod['id'])->orderBy('display_order', 'ASC')->findAll();
                $products[] = $prod;
            }
        }

        return $this->response->setJSON(['products' => $products]);
    }

    public function toggle()
    {
        $user = $this->request->user ?? null;
        if (!$user) {
            return $this->response->setJSON(['error' => 'Unauthorized'])->setStatusCode(401);
        }
        $userId = $user->uid;

        $json = $this->request->getJSON();
        $productId = $json->product_id ?? null;

        if (!$productId) {
            return $this->response->setJSON(['error' => 'Product ID is required'])->setStatusCode(400);
        }

        $wishlistModel = new WishlistModel();
        $existing = $wishlistModel->where('user_id', $userId)->where('product_id', $productId)->first();

        if ($existing) {
            // Remove from wishlist
            $wishlistModel->delete($existing['id']);
            return $this->response->setJSON(['status' => 'removed']);
        } else {
            // Add to wishlist
            $wishlistModel->insert([
                'user_id' => $userId,
                'product_id' => $productId,
                'created_at' => date('Y-m-d H:i:s')
            ]);
            return $this->response->setJSON(['status' => 'added']);
        }
    }
}
