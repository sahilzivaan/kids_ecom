<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

class CartController extends ResourceController
{
    use ResponseTrait;

    protected $db;

    public function __construct()
    {
        $this->db = \Config\Database::connect();
    }

    public function index()
    {
        $user = $this->request->user;
        if (!$user) return $this->failUnauthorized();

        $cart = $this->db->table('cart_items')
                         ->where('user_id', $user->uid)
                         ->get()->getResult();

        return $this->respond(['cart' => $cart]);
    }

    public function create()
    {
        $user = $this->request->user;
        if (!$user) return $this->failUnauthorized();

        $data = $this->request->getJSON(true);
        if (!$data) {
            return $this->failValidationError('Invalid cart payload');
        }

        $productId = $data['product_id'] ?? null;
        $variantId = $data['variant_id'] ?? null;
        $meta = $data['meta'] ?? null;
        $quantity = isset($data['quantity']) ? max(1, (int)$data['quantity']) : 1;

        // Check if an existing cart item matches this user and product variant/meta
        $builder = $this->db->table('cart_items')
                            ->where('user_id', $user->uid);

        if (!empty($variantId)) {
            $builder->where('variant_id', $variantId);
        } elseif (!empty($productId)) {
            $builder->where('product_id', $productId);
            if (!empty($meta)) {
                $builder->where('meta', $meta);
            }
        }

        $existing = $builder->get()->getRow();

        if ($existing) {
            $newQuantity = (int)$existing->quantity + $quantity;
            $this->db->table('cart_items')
                     ->where('id', $existing->id)
                     ->where('user_id', $user->uid)
                     ->update([
                         'quantity'   => $newQuantity,
                         'updated_at' => date('Y-m-d H:i:s')
                     ]);

            return $this->respond([
                'message' => 'Cart updated',
                'cart_item_id' => $existing->id,
                'quantity' => $newQuantity
            ]);
        }

        $cartData = [
            'user_id'    => $user->uid,
            'product_id' => $productId,
            'variant_id' => $variantId,
            'name'       => $data['name'] ?? 'Product',
            'meta'       => $meta,
            'price'      => (string)($data['price'] ?? '0'),
            'img'        => $data['img'] ?? '',
            'quantity'   => $quantity,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        $this->db->table('cart_items')->insert($cartData);
        $insertId = $this->db->insertID();

        return $this->respondCreated([
            'message' => 'Added to cart',
            'cart_item_id' => $insertId,
            'quantity' => $quantity
        ]);
    }

    public function update($id = null)
    {
        $user = $this->request->user;
        if (!$user) return $this->failUnauthorized();

        if (!$id) {
            return $this->failValidationError('Cart item ID is required');
        }

        $data = $this->request->getJSON(true);
        $quantity = isset($data['quantity']) ? max(1, (int)$data['quantity']) : 1;

        $updated = $this->db->table('cart_items')
                            ->where('id', $id)
                            ->where('user_id', $user->uid)
                            ->update([
                                'quantity'   => $quantity,
                                'updated_at' => date('Y-m-d H:i:s')
                            ]);

        return $this->respond([
            'message'  => 'Cart updated successfully',
            'id'       => $id,
            'quantity' => $quantity
        ]);
    }

    public function delete($id = null)
    {
        $user = $this->request->user;
        if (!$user) return $this->failUnauthorized();

        $this->db->table('cart_items')
                 ->where('id', $id)
                 ->where('user_id', $user->uid)
                 ->delete();

        return $this->respondDeleted(['message' => 'Removed from cart']);
    }
}
