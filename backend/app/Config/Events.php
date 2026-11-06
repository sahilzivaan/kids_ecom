<?php

namespace Config;

use CodeIgniter\Events\Events;
use CodeIgniter\Exceptions\FrameworkException;
use CodeIgniter\HotReloader\HotReloader;

/*
 * --------------------------------------------------------------------
 * Application Events
 * --------------------------------------------------------------------
 * Events allow you to tap into the execution of the program without
 * modifying or extending core files. This file provides a central
 * location to define your events, though they can always be added
 * at run-time, also, if needed.
 *
 * You create code that can execute by subscribing to events with
 * the 'on()' method. This accepts any form of callable, including
 * Closures, that will be executed when the event is triggered.
 *
 * Example:
 *      Events::on('create', [$myInstance, 'myMethod']);
 */

Events::on('pre_system', static function (): void {
    if (ENVIRONMENT !== 'testing') {
        $value = ini_get('zlib.output_compression');

        if (filter_var($value, FILTER_VALIDATE_BOOLEAN) || (int) $value > 0) {
            throw FrameworkException::forEnabledZlibOutputCompression();
        }

        while (ob_get_level() > 0) {
            ob_end_flush();
        }

        ob_start(static fn ($buffer) => $buffer);
    }

    /*
     * --------------------------------------------------------------------
     * Debug Toolbar Listeners.
     * --------------------------------------------------------------------
     * If you delete, they will no longer be collected.
     */
    if (CI_DEBUG && ! is_cli()) {
        Events::on('DBQuery', 'CodeIgniter\Debug\Toolbar\Collectors\Database::collect');
        service('toolbar')->respond();
        // Hot Reload route - for framework use on the hot reloader.
        if (ENVIRONMENT === 'development') {
            service('routes')->get('__hot-reload', static function (): void {
                (new HotReloader())->run();
            });
        }
    }
});

/*
 * --------------------------------------------------------------------
 * Email Event Listeners
 * --------------------------------------------------------------------
 * Controllers fire Events::trigger() with a payload array.
 * The EmailEventListener handles template lookup, placeholder
 * replacement, and insertion into the email_queue table.
 *
 * Available triggers:
 *   - email_order_placed          → fired when a customer places an order
 *   - email_order_status_changed  → fired when admin updates order status
 *   - email_order_cancelled       → fired when admin cancels an order
 *   - email_customer_registered   → fired when a new customer registers
 * --------------------------------------------------------------------
 */
Events::on('email_order_placed', [new \App\Listeners\EmailEventListener(), 'onOrderPlaced']);
Events::on('email_order_status_changed', [new \App\Listeners\EmailEventListener(), 'onOrderStatusChanged']);
Events::on('email_order_cancelled', [new \App\Listeners\EmailEventListener(), 'onOrderCancelled']);
Events::on('email_customer_registered', [new \App\Listeners\EmailEventListener(), 'onCustomerRegistered']);

