<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

class AdminDashboardController extends ResourceController
{
    use ResponseTrait;

    protected $db;

    public function __construct()
    {
        $this->db = \Config\Database::connect();
    }

    private function parseAmount($value): float
    {
        if (empty($value)) {
            return 0.0;
        }
        $clean = str_replace(',', '', (string)$value);
        $clean = preg_replace('/[^\d.]/', '', $clean);
        return (float)$clean;
    }

    public function dashboard()
    {
        $orders = $this->db->table('orders')->get()->getResultArray();
        $totalRevenue = 0.0;
        $ordersToday = 0;
        $pendingShipments = 0;
        $todayStr = date('Y-m-d');
        
        // Status counts: Delivered, Shipped, Processing, Pending, Cancelled
        $statusCounts = ['Delivered' => 0, 'Shipped' => 0, 'Processing' => 0, 'Pending' => 0, 'Cancelled' => 0];

        // Financial Year 12 months map: Jul=0 to Jun=11
        $monthIndexMap = [
            7 => 0, 8 => 1, 9 => 2, 10 => 3, 11 => 4, 12 => 5,
            1 => 6, 2 => 7, 3 => 8, 4 => 9, 5 => 10, 6 => 11
        ];
        $revenueData = array_fill(0, 12, 0.0);

        foreach ($orders as $o) {
            $amt = $this->parseAmount($o['total_amount'] ?? '');
            $totalRevenue += $amt;

            // Monthly distribution
            if (!empty($o['created_at'])) {
                $month = (int)date('n', strtotime($o['created_at']));
                if (isset($monthIndexMap[$month])) {
                    $revenueData[$monthIndexMap[$month]] += $amt;
                }
            }

            // Today's orders
            if (!empty($o['created_at']) && strpos($o['created_at'], $todayStr) === 0) {
                $ordersToday++;
            }

            // Status
            $st = $o['status'] ?? 'Pending';
            if (isset($statusCounts[$st])) {
                $statusCounts[$st]++;
            }
            if (in_array($st, ['Pending', 'Processing'])) {
                $pendingShipments++;
            }
        }

        // Active Customers
        $activeCustomers = $this->db->table('users')->where('active', 1)->countAllResults();

        // Prepare KPIs
        $kpis = [
            [
                'label'  => 'Total Revenue',
                'value'  => '₹' . number_format($totalRevenue, 0),
                'change' => '12%',
                'dir'    => 'up',
                'icon'   => '💰',
                'spark'  => 'M0,32 L20,20 L40,25 L60,10 L80,15 L100,5'
            ],
            [
                'label'  => 'Orders Today',
                'value'  => (string)$ordersToday,
                'change' => '5%',
                'dir'    => 'up',
                'icon'   => '📦',
                'spark'  => 'M0,30 L20,15 L40,20 L60,10 L80,12 L100,2'
            ],
            [
                'label'  => 'Active Customers',
                'value'  => (string)$activeCustomers,
                'change' => '2%',
                'dir'    => 'up',
                'icon'   => '👥',
                'spark'  => 'M0,28 L20,25 L40,26 L60,18 L80,15 L100,10'
            ],
            [
                'label'  => 'Pending Shipments',
                'value'  => (string)$pendingShipments,
                'change' => '8%',
                'dir'    => 'down',
                'icon'   => '🚚',
                'spark'  => 'M0,10 L20,15 L40,12 L60,25 L80,20 L100,30'
            ]
        ];

        // Recent Orders
        $recentOrdersRaw = $this->db->table('orders')
                                    ->select('orders.*, users.first_name, users.last_name, users.username')
                                    ->join('users', 'users.id = orders.user_id', 'left')
                                    ->orderBy('orders.id', 'DESC')
                                    ->limit(5)
                                    ->get()->getResultArray();
                                    
        $recentOrders = [];
        foreach ($recentOrdersRaw as $ro) {
            $name = trim(($ro['first_name'] ?? '') . ' ' . ($ro['last_name'] ?? ''));
            if (!$name) $name = $ro['username'] ?? 'Guest';
            $amt = $this->parseAmount($ro['total_amount'] ?? '');
            $recentOrders[] = [
                'id'         => $ro['order_number'] ?? ('#' . $ro['id']),
                'customer'   => $name,
                'items'      => (int)($ro['items_count'] ?? 1),
                'amount'     => '₹' . number_format($amt, 0),
                'amount_num' => round($amt, 2),
                'status'     => $ro['status'] ?? 'Pending',
                'date'       => !empty($ro['created_at']) ? date('d M Y', strtotime($ro['created_at'])) : '-'
            ];
        }

        // Top Products
        $productSales = [];
        foreach ($orders as $o) {
            if (!empty($o['items'])) {
                $items = json_decode($o['items'], true);
                if (is_array($items)) {
                    foreach ($items as $item) {
                        $id = $item['id'] ?? 0;
                        if (!$id) continue;
                        
                        if (!isset($productSales[$id])) {
                            $productSales[$id] = [
                                'id' => $id,
                                'sold' => 0,
                                'revenue' => 0,
                                'name' => $item['name'] ?? 'Unknown'
                            ];
                        }
                        
                        $qty = (int)($item['quantity'] ?? 1);
                        $price = $this->parseAmount($item['price'] ?? 0);
                        
                        $productSales[$id]['sold'] += $qty;
                        $productSales[$id]['revenue'] += ($qty * $price);
                    }
                }
            }
        }

        usort($productSales, function($a, $b) {
            return $b['sold'] <=> $a['sold'];
        });

        $top5 = array_slice($productSales, 0, 5);
        $topProducts = [];
        $rank = 1;
        
        foreach ($top5 as $ts) {
            $prod = $this->db->table('products')->select('category')->where('id', $ts['id'])->get()->getRowArray();
            $cat = $prod ? ($prod['category'] ?? 'Category') : 'Category';
            
            $topProducts[] = [
                'rank'     => $rank++,
                'name'     => $ts['name'],
                'category' => $cat,
                'sold'     => $ts['sold'],
                'revenue'  => $ts['revenue']
            ];
        }
        
        // Status Data ['Delivered','Shipped','Processing','Pending','Cancelled']
        $statusData = [
            $statusCounts['Delivered'],
            $statusCounts['Shipped'],
            $statusCounts['Processing'],
            $statusCounts['Pending'],
            $statusCounts['Cancelled']
        ];

        return $this->respond([
            'kpis'         => $kpis,
            'recentOrders' => $recentOrders,
            'topProducts'  => $topProducts,
            'revenueData'  => $revenueData,
            'statusData'   => $statusData
        ]);
    }

    public function analytics()
    {
        $orders = $this->db->table('orders')->get()->getResultArray();
        $totalRevenue = 0.0;

        $monthIndexMap = [
            7 => 0, 8 => 1, 9 => 2, 10 => 3, 11 => 4, 12 => 5,
            1 => 6, 2 => 7, 3 => 8, 4 => 9, 5 => 10, 6 => 11
        ];
        $revenueData = array_fill(0, 12, 0.0);
        $ordersData  = array_fill(0, 12, 0);

        foreach ($orders as $o) {
            $amt = $this->parseAmount($o['total_amount'] ?? '');
            $totalRevenue += $amt;

            if (!empty($o['created_at'])) {
                $month = (int)date('n', strtotime($o['created_at']));
                if (isset($monthIndexMap[$month])) {
                    $idx = $monthIndexMap[$month];
                    $revenueData[$idx] += $amt;
                    $ordersData[$idx]++;
                }
            }
        }

        $orderCount = count($orders);
        $avgOrder = $orderCount > 0 ? (int)round($totalRevenue / $orderCount) : 0;

        $metrics = [
            'totalRevenue' => round($totalRevenue, 2),
            'revChange'    => 12.0,
            'avgOrder'     => $avgOrder,
            'aovChange'    => 4.2,
            'conversion'   => 3.8,
            'convChange'   => 0.4
        ];

        return $this->respond([
            'revenueData' => $revenueData,
            'ordersData'  => $ordersData,
            'metrics'     => $metrics
        ]);
    }
}
