<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run()
    {
        $products = [];

        $girls_names = [
            'Girls Pink & Gold Festive Lehenga Choli',
            'Girls Floral A-Line Party Dress',
            'Girls Velvet Embroidered Gown',
            'Girls Cotton Printed Frock',
            'Girls Western Top & Jeans Set',
            'Girls Ethnic Sharara Suit',
            'Girls Sequined Tutu Dress',
            'Girls Winter Woolen Coat',
        ];

        $boys_names = [
            'Boys Navy Kurta Pajama - Golden Embroidery',
            'Boys Casual T-Shirt & Denim Shorts',
            'Boys Formal Shirt and Trouser Set',
            'Boys Printed Summer Shirt',
            'Boys Classic Indo-Western Suit',
            'Boys Winter Pullover Sweater',
            'Boys Sherwani with Dhoti',
            'Boys Graphic Tee Collection',
        ];

        $baby_names = [
            'Baby Unisex Soft Cotton Romper',
            'Baby Sleepsuit with Mitten Cuffs',
            'Baby Boy Knitted Onesie',
            'Baby Girl Floral Jumpsuit',
            'Baby Fleece Winter Bear Suit',
            'Baby Organic Cotton Wrap Top',
            'Baby Christening White Gown',
            'Baby First Birthday Outfit',
        ];

        $ethnic_names = [
            'Kids Silk Bandhani Lehenga',
            'Kids Zari Work Sherwani Set',
            'Kids Traditional Dhoti Kurta',
            'Kids Mirror Work Chaniya Choli',
            'Kids Velvet Pathani Suit',
            'Kids Festive Brocade Gown',
        ];

        $categories = [
            'Girls' => ['names' => $girls_names, 'img' => '/images/seed_girls.jpg'],
            'Boys' => ['names' => $boys_names, 'img' => '/images/seed_boys.jpg'],
            'Baby 0-2' => ['names' => $baby_names, 'img' => '/images/seed_baby.jpg'],
            'Ethnic' => ['names' => $ethnic_names, 'img' => '/images/seed_ethnic.jpg'],
        ];

        foreach ($categories as $catName => $data) {
            foreach ($data['names'] as $name) {
                $mrp = mt_rand(999, 3999);
                $sale = floor($mrp * (mt_rand(50, 90) / 100)); // 10% to 50% discount
                
                $products[] = [
                    'name' => $name,
                    'category' => $catName,
                    'status' => 'Active',
                    'mrp' => $mrp,
                    'sale' => $sale,
                    'stock' => mt_rand(10, 100),
                    'sizes' => 'S, M, L, XL',
                    'description' => 'Premium quality fabric, tailored for comfort and style. Perfect for everyday wear or special occasions.',
                    'img' => $data['img'],
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ];
            }
        }

        $this->db->table('products')->insertBatch($products);
    }
}
