<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');

service('auth')->routes($routes);

$routes->group('api/auth', ['namespace' => 'App\Controllers\Api'], static function ($routes) {
    $routes->options('(:any)', static function() { return service('response')->setStatusCode(204); });
    $routes->post('admin-login', 'Auth::adminLogin');
    $routes->post('login', 'Auth::customerLogin');
    $routes->post('register', 'Auth::customerRegister');
});

// Public API Routes (No JWT required)
$routes->group('api', ['namespace' => 'App\Controllers\Api'], static function ($routes) {
    $routes->options('products', static function() { return service('response')->setStatusCode(204); });
    $routes->get('products', 'ProductController::index');
    $routes->get('products/(:num)', 'ProductController::show/$1');
    $routes->options('categories', static function() { return service('response')->setStatusCode(204); });
    $routes->get('categories', 'CategoryController::index');
    
    $routes->options('reviews', static function() { return service('response')->setStatusCode(204); });
    $routes->get('reviews', 'ReviewController::index');
});


$routes->group('api', ['filter' => 'custom_jwt', 'namespace' => 'App\Controllers\Api'], static function ($routes) {
    $routes->options('(:any)', static function() { return service('response')->setStatusCode(204); });
    $routes->get('auth/me', 'Auth::me');
    $routes->put('auth/profile', 'Auth::updateProfile');
    $routes->put('auth/settings', 'Auth::updateSettings');
    $routes->put('auth/password', 'Auth::updatePassword');
    $routes->delete('auth/account', 'Auth::deleteAccount');
    
    // Cart Routes
    $routes->get('cart', 'CartController::index');
    $routes->post('cart', 'CartController::create');
    $routes->delete('cart/(:num)', 'CartController::delete/$1');

    // Wishlist Routes
    $routes->get('wishlist', 'WishlistController::index');
    $routes->post('wishlist/toggle', 'WishlistController::toggle');

    // Review Routes
    $routes->post('reviews', 'ReviewController::create');

    // Order Routes
    $routes->get('orders', 'OrderController::index');
    $routes->post('orders', 'OrderController::create');
    $routes->get('track/(:segment)', 'OrderController::track/$1');
    
    // Coupon Routes
    $routes->post('coupons/validate', 'CouponController::validateCoupon');


    // Admin Notifications
    $routes->get('admin/notifications', 'AdminNotificationController::index');

    // Admin Orders Routes
    $routes->get('admin/orders', 'AdminOrderController::index');
    $routes->put('admin/orders/(:num)/status', 'AdminOrderController::updateStatus/$1');

    // Admin Products Routes
    $routes->get('admin/products', 'AdminProductController::index');
    $routes->post('admin/products', 'AdminProductController::create');
    $routes->put('admin/products/(:num)', 'AdminProductController::update/$1');
    $routes->delete('admin/products/(:num)', 'AdminProductController::delete/$1');
    $routes->post('admin/upload', 'ImageUploadController::upload');

    // Admin Media Library Routes
    $routes->get('admin/media', 'MediaLibraryController::index');
    $routes->post('admin/media/upload', 'MediaLibraryController::upload');
    $routes->delete('admin/media/(:num)', 'MediaLibraryController::delete/$1');

    // Admin Customers Routes
    $routes->get('admin/customers', 'AdminCustomerController::index');
    $routes->put('admin/customers/(:num)/status', 'AdminCustomerController::updateStatus/$1');

    // Admin Categories Routes
    $routes->get('admin/categories', 'AdminCategoryController::index');
    $routes->post('admin/categories', 'AdminCategoryController::create');
    $routes->put('admin/categories/(:num)', 'AdminCategoryController::update/$1');
    $routes->delete('admin/categories/(:num)', 'AdminCategoryController::delete/$1');

    // Admin Coupons Routes
    $routes->get('admin/coupons', 'AdminCouponController::index');
    $routes->post('admin/coupons', 'AdminCouponController::create');
    $routes->put('admin/coupons/(:num)', 'AdminCouponController::update/$1');
    $routes->delete('admin/coupons/(:num)', 'AdminCouponController::delete/$1');


    // Admin Dashboard & Analytics Routes
    $routes->get('admin/dashboard', 'AdminDashboardController::dashboard');
    $routes->get('admin/analytics', 'AdminDashboardController::analytics');

    // Admin Email Routes
    $routes->get('admin/email/settings', 'AdminEmailController::getSettings');
    $routes->put('admin/email/settings', 'AdminEmailController::updateSettings');
    $routes->get('admin/email/templates', 'AdminEmailController::getTemplates');
    $routes->put('admin/email/templates/(:num)', 'AdminEmailController::updateTemplate/$1');
    $routes->get('admin/email/logs', 'AdminEmailController::getLogs');

    // Admin Store Settings Routes
    $routes->get('admin/settings', 'AdminSettingController::getSettings');
    $routes->put('admin/settings', 'AdminSettingController::updateSettings');
});
