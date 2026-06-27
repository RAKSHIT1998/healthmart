import { env } from '../config/env';

type Method = 'get' | 'post' | 'patch' | 'delete' | 'put';

interface OperationOptions {
  summary: string;
  auth?: boolean;
  params?: string[];
  query?: string[];
  body?: boolean;
}

function operation(tag: string, opts: OperationOptions) {
  return {
    tags: [tag],
    summary: opts.summary,
    ...(opts.auth ? { security: [{ bearerAuth: [] }] } : {}),
    ...(opts.params
      ? {
          parameters: opts.params.map((name) => ({
            name,
            in: 'path',
            required: true,
            schema: { type: 'string' },
          })),
        }
      : {}),
    ...(opts.query
      ? {
          parameters: [
            ...(opts.params ?? []).map((name) => ({ name, in: 'path', required: true, schema: { type: 'string' } })),
            ...opts.query.map((name) => ({ name, in: 'query', required: false, schema: { type: 'string' } })),
          ],
        }
      : {}),
    ...(opts.body
      ? { requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } } }
      : {}),
    responses: {
      '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccessResponse' } } } },
      '400': { description: 'Validation or business rule error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorResponse' } } } },
      '401': { description: 'Unauthorized' },
      '403': { description: 'Forbidden' },
      '404': { description: 'Not found' },
    },
  };
}

function path(
  paths: Record<string, Record<string, unknown>>,
  route: string,
  method: Method,
  tag: string,
  opts: OperationOptions,
) {
  paths[route] ??= {};
  paths[route]![method] = operation(tag, opts);
}

function buildPaths() {
  const paths: Record<string, Record<string, unknown>> = {};

  // Auth
  path(paths, '/auth/otp/request', 'post', 'Auth', { summary: 'Request a login/signup OTP', body: true });
  path(paths, '/auth/otp/verify', 'post', 'Auth', { summary: 'Verify OTP and obtain tokens', body: true });
  path(paths, '/auth/staff/login', 'post', 'Auth', { summary: 'Staff email/password login', body: true });
  path(paths, '/auth/refresh', 'post', 'Auth', { summary: 'Rotate access/refresh tokens', body: true });
  path(paths, '/auth/logout', 'post', 'Auth', { summary: 'Revoke a single refresh token', body: true });
  path(paths, '/auth/logout-all', 'post', 'Auth', { summary: 'Revoke all sessions for the current user', auth: true });
  path(paths, '/auth/staff/register', 'post', 'Auth', { summary: 'Admin creates a staff account', auth: true, body: true });

  // Addresses
  path(paths, '/addresses', 'get', 'Addresses', { summary: 'List my addresses', auth: true });
  path(paths, '/addresses', 'post', 'Addresses', { summary: 'Add a new address', auth: true, body: true });
  path(paths, '/addresses/{id}', 'patch', 'Addresses', { summary: 'Update an address', auth: true, params: ['id'], body: true });
  path(paths, '/addresses/{id}', 'delete', 'Addresses', { summary: 'Delete an address', auth: true, params: ['id'] });

  // Catalog
  path(paths, '/catalog/categories', 'get', 'Catalog', { summary: 'List categories', query: ['group'] });
  path(paths, '/catalog/categories', 'post', 'Catalog', { summary: 'Create category', auth: true, body: true });
  path(paths, '/catalog/categories/{id}', 'patch', 'Catalog', { summary: 'Update category', auth: true, params: ['id'], body: true });
  path(paths, '/catalog/categories/{id}', 'delete', 'Catalog', { summary: 'Deactivate category', auth: true, params: ['id'] });
  path(paths, '/catalog/manufacturers', 'get', 'Catalog', { summary: 'List manufacturers' });
  path(paths, '/catalog/manufacturers', 'post', 'Catalog', { summary: 'Create manufacturer', auth: true, body: true });
  path(paths, '/catalog/suppliers', 'get', 'Catalog', { summary: 'List suppliers', auth: true });
  path(paths, '/catalog/suppliers', 'post', 'Catalog', { summary: 'Create supplier', auth: true, body: true });
  path(paths, '/catalog/branches', 'get', 'Catalog', { summary: 'List active branches' });
  path(paths, '/catalog/branches/admin', 'get', 'Catalog (Admin)', { summary: 'List all branches including inactive ones', auth: true });
  path(paths, '/catalog/branches', 'post', 'Catalog (Admin)', { summary: 'Create a branch', auth: true, body: true });
  path(paths, '/catalog/branches/{id}', 'patch', 'Catalog (Admin)', { summary: 'Update a branch', auth: true, params: ['id'], body: true });
  path(paths, '/catalog/branches/{id}', 'delete', 'Catalog (Admin)', { summary: 'Deactivate a branch (cannot deactivate the main branch)', auth: true, params: ['id'] });

  // Medicines
  path(paths, '/medicines', 'get', 'Medicines', {
    summary: 'Search/filter/sort medicines (Amazon-style)',
    query: ['q', 'categoryId', 'manufacturerId', 'categoryGroup', 'minPrice', 'maxPrice', 'prescriptionRequired', 'inStockOnly', 'sortBy', 'sortOrder', 'page', 'limit'],
  });
  path(paths, '/medicines', 'post', 'Medicines', { summary: 'Create medicine', auth: true, body: true });
  path(paths, '/medicines/slug/{slug}', 'get', 'Medicines', { summary: 'Get medicine detail by slug', params: ['slug'] });
  path(paths, '/medicines/{id}', 'get', 'Medicines', { summary: 'Get medicine by id', params: ['id'] });
  path(paths, '/medicines/{id}', 'patch', 'Medicines', { summary: 'Update medicine', auth: true, params: ['id'], body: true });
  path(paths, '/medicines/{id}', 'delete', 'Medicines', { summary: 'Deactivate medicine', auth: true, params: ['id'] });

  // Cart
  path(paths, '/cart', 'get', 'Cart', { summary: 'Get my cart with computed pricing', auth: true });
  path(paths, '/cart/items', 'post', 'Cart', { summary: 'Add item to cart', auth: true, body: true });
  path(paths, '/cart/items/{medicineId}', 'patch', 'Cart', { summary: 'Update item quantity', auth: true, params: ['medicineId'], body: true });
  path(paths, '/cart/items/{medicineId}', 'delete', 'Cart', { summary: 'Remove item', auth: true, params: ['medicineId'] });
  path(paths, '/cart/coupon', 'post', 'Cart', { summary: 'Apply coupon', auth: true, body: true });
  path(paths, '/cart/coupon', 'delete', 'Cart', { summary: 'Remove coupon', auth: true });
  path(paths, '/cart', 'delete', 'Cart', { summary: 'Clear cart', auth: true });

  // Orders
  path(paths, '/orders/checkout', 'post', 'Orders', { summary: 'Reserve stock and create an order (Cashfree/COD/wallet)', auth: true, body: true });
  path(paths, '/orders', 'get', 'Orders', { summary: 'List my orders', auth: true, query: ['page', 'limit'] });
  path(paths, '/orders/{id}', 'get', 'Orders', { summary: 'Get my order detail', auth: true, params: ['id'] });
  path(paths, '/orders/{id}/track', 'get', 'Orders', { summary: 'Track order status timeline', auth: true, params: ['id'] });
  path(paths, '/orders/{id}/invoice', 'get', 'Orders', { summary: 'Get GST invoice for order', auth: true, params: ['id'] });
  path(paths, '/orders/{id}/cancel', 'post', 'Orders', { summary: 'Cancel my order', auth: true, params: ['id'], body: true });
  path(paths, '/orders/admin/all', 'get', 'Orders (Admin)', { summary: 'List all orders', auth: true, query: ['status', 'branchId', 'page', 'limit'] });
  path(paths, '/orders/admin/{id}', 'get', 'Orders (Admin)', { summary: 'Get any order', auth: true, params: ['id'] });
  path(paths, '/orders/admin/{id}/status', 'patch', 'Orders (Admin)', { summary: 'Transition order status (also runs FIFO batch allocation on pack)', auth: true, params: ['id'], body: true });
  path(paths, '/orders/admin/{id}/assign-driver', 'patch', 'Orders (Admin)', { summary: 'Assign a delivery driver', auth: true, params: ['id'], body: true });
  path(paths, '/orders/{id}/delivery-otp/verify', 'post', 'Delivery', { summary: 'Verify delivery OTP to mark delivered', auth: true, params: ['id'], body: true });
  path(paths, '/orders/{id}/delivery-otp/resend', 'post', 'Delivery', { summary: 'Resend delivery OTP', auth: true, params: ['id'] });

  // Payments
  path(paths, '/payments/cashfree/webhook', 'post', 'Payments', { summary: 'Cashfree payment webhook (HMAC signed)' });
  path(paths, '/payments/status/{orderId}', 'get', 'Payments', { summary: 'Check payment/order status', auth: true, params: ['orderId'] });

  // Coupons
  path(paths, '/coupons', 'get', 'Coupons', { summary: 'List coupons' });
  path(paths, '/coupons', 'post', 'Coupons', { summary: 'Create coupon', auth: true, body: true });
  path(paths, '/coupons/{id}', 'patch', 'Coupons', { summary: 'Update coupon', auth: true, params: ['id'], body: true });
  path(paths, '/coupons/{id}', 'delete', 'Coupons', { summary: 'Deactivate coupon', auth: true, params: ['id'] });

  // Telehealth
  path(paths, '/telehealth/doctors', 'get', 'Telehealth', { summary: 'List active doctors', query: ['specialization'] });
  path(paths, '/telehealth/doctors/{id}', 'get', 'Telehealth', { summary: 'Get doctor profile', params: ['id'] });
  path(paths, '/telehealth/doctors/{id}/availability', 'get', 'Telehealth', { summary: 'Get available slots for a date', params: ['id'], query: ['date'] });
  path(paths, '/telehealth/doctors', 'post', 'Telehealth (Admin)', { summary: 'Onboard a doctor', auth: true, body: true });
  path(paths, '/telehealth/doctors/{id}', 'patch', 'Telehealth (Admin)', { summary: 'Update a doctor', auth: true, params: ['id'], body: true });
  path(paths, '/telehealth/doctor/me', 'get', 'Telehealth (Doctor)', { summary: "Get my own doctor profile", auth: true });
  path(paths, '/telehealth/doctor/appointments', 'get', 'Telehealth (Doctor)', { summary: 'List my appointments as a doctor', auth: true, query: ['page', 'limit'] });
  path(paths, '/telehealth/appointments/{id}/complete', 'post', 'Telehealth (Doctor)', { summary: 'Complete a consultation (diagnosis + prescription)', auth: true, params: ['id'], body: true });
  path(paths, '/telehealth/appointments', 'post', 'Telehealth', { summary: 'Book an appointment (returns a Cashfree payment session)', auth: true, body: true });
  path(paths, '/telehealth/appointments/mine', 'get', 'Telehealth', { summary: 'List my appointments as a patient', auth: true, query: ['page', 'limit'] });
  path(paths, '/telehealth/appointments/{id}/cancel', 'post', 'Telehealth', { summary: 'Cancel an appointment', auth: true, params: ['id'], body: true });
  path(paths, '/telehealth/appointments/{id}/video-token', 'get', 'Telehealth', { summary: 'Get an Agora token to join the consultation room', auth: true, params: ['id'] });

  // Blog
  path(paths, '/blog', 'get', 'Blog', { summary: 'List published blog posts', query: ['page', 'limit', 'category'] });
  path(paths, '/blog/slug/{slug}', 'get', 'Blog', { summary: 'Get a blog post with its comments', params: ['slug'] });
  path(paths, '/blog/admin/all', 'get', 'Blog (Admin)', { summary: 'List all blog posts including drafts', auth: true, query: ['page', 'limit'] });
  path(paths, '/blog', 'post', 'Blog (Admin)', { summary: 'Create a blog post', auth: true, body: true });
  path(paths, '/blog/{id}', 'patch', 'Blog (Admin)', { summary: 'Update a blog post', auth: true, params: ['id'], body: true });
  path(paths, '/blog/{id}', 'delete', 'Blog (Admin)', { summary: 'Delete a blog post', auth: true, params: ['id'] });
  path(paths, '/blog/{id}/comments', 'post', 'Blog', { summary: 'Comment on a blog post', auth: true, params: ['id'], body: true });
  path(paths, '/blog/comments/{commentId}/moderate', 'patch', 'Blog (Admin)', { summary: 'Approve/reject a comment', auth: true, params: ['commentId'], body: true });

  // Promotions
  path(paths, '/promotions/flash-sales/active', 'get', 'Promotions', { summary: 'List currently-active flash sales' });
  path(paths, '/promotions/referrals/my-code', 'get', 'Promotions', { summary: 'Get (or generate) my referral code', auth: true });
  path(paths, '/promotions/referrals/apply', 'post', 'Promotions', { summary: 'Apply a referral code to my account', auth: true, body: true });
  path(paths, '/promotions/gift-cards/redeem', 'post', 'Promotions', { summary: 'Redeem a gift card to my wallet', auth: true, body: true });
  path(paths, '/promotions/gift-cards/issue', 'post', 'Promotions (Admin)', { summary: 'Issue a gift card', auth: true, body: true });
  path(paths, '/promotions/gift-cards', 'get', 'Promotions (Admin)', { summary: 'List issued gift cards', auth: true, query: ['page', 'limit'] });
  path(paths, '/promotions/flash-sales', 'get', 'Promotions (Admin)', { summary: 'List all flash sales', auth: true });
  path(paths, '/promotions/flash-sales', 'post', 'Promotions (Admin)', { summary: 'Create a flash sale', auth: true, body: true });
  path(paths, '/promotions/flash-sales/{id}', 'patch', 'Promotions (Admin)', { summary: 'Update a flash sale', auth: true, params: ['id'], body: true });

  // Wallet
  path(paths, '/wallet', 'get', 'Wallet', { summary: 'Get my wallet balance', auth: true });
  path(paths, '/wallet/transactions', 'get', 'Wallet', { summary: 'List my wallet transactions', auth: true, query: ['page', 'limit'] });
  path(paths, '/wallet/adjust', 'post', 'Wallet', { summary: 'Admin credit/debit adjustment', auth: true, body: true });

  // Reviews
  path(paths, '/reviews/medicine/{medicineId}', 'get', 'Reviews', { summary: 'List reviews for a medicine', params: ['medicineId'], query: ['page', 'limit'] });
  path(paths, '/reviews', 'post', 'Reviews', { summary: 'Submit a review (delivered orders only)', auth: true, body: true });
  path(paths, '/reviews/{id}/moderate', 'patch', 'Reviews', { summary: 'Approve/reject a review', auth: true, params: ['id'], body: true });

  // Prescriptions
  path(paths, '/prescriptions', 'post', 'Prescriptions', { summary: 'Upload prescription images (runs OCR)', auth: true, body: true });
  path(paths, '/prescriptions/mine', 'get', 'Prescriptions', { summary: 'List my prescriptions', auth: true, query: ['page', 'limit'] });
  path(paths, '/prescriptions/pending', 'get', 'Prescriptions', { summary: 'Pharmacist review queue', auth: true, query: ['page', 'limit'] });
  path(paths, '/prescriptions/{id}/review', 'patch', 'Prescriptions', { summary: 'Approve/reject a prescription', auth: true, params: ['id'], body: true });

  // Wishlist
  path(paths, '/wishlist', 'get', 'Wishlist', { summary: 'Get my wishlist', auth: true });
  path(paths, '/wishlist/{medicineId}', 'post', 'Wishlist', { summary: 'Add medicine to wishlist', auth: true, params: ['medicineId'] });
  path(paths, '/wishlist/{medicineId}', 'delete', 'Wishlist', { summary: 'Remove medicine from wishlist', auth: true, params: ['medicineId'] });

  // Notifications
  path(paths, '/notifications', 'get', 'Notifications', { summary: 'List my notifications', auth: true, query: ['page', 'limit'] });
  path(paths, '/notifications/{id}/read', 'patch', 'Notifications', { summary: 'Mark one notification read', auth: true, params: ['id'] });
  path(paths, '/notifications/read-all', 'patch', 'Notifications', { summary: 'Mark all notifications read', auth: true });
  path(paths, '/notifications/fcm-token', 'post', 'Notifications', { summary: 'Register a Firebase push token', auth: true, body: true });

  // Drivers
  path(paths, '/drivers', 'post', 'Drivers', { summary: 'Register a delivery driver', auth: true, body: true });
  path(paths, '/drivers/available/{branchId}', 'get', 'Drivers', { summary: 'List available drivers for a branch', auth: true, params: ['branchId'] });
  path(paths, '/drivers/me/availability', 'patch', 'Drivers', { summary: 'Driver toggles availability', auth: true, body: true });
  path(paths, '/drivers/me/location', 'patch', 'Drivers', { summary: 'Driver updates current GPS location', auth: true, body: true });
  path(paths, '/drivers/me/orders', 'get', 'Drivers', { summary: 'Driver lists assigned orders', auth: true, query: ['page', 'limit'] });

  // Users
  path(paths, '/users/me', 'get', 'Users', { summary: 'Get my profile', auth: true });
  path(paths, '/users/me', 'patch', 'Users', { summary: 'Update my profile', auth: true, body: true });
  path(paths, '/users/staff', 'get', 'Users (Admin)', { summary: 'List staff accounts', auth: true, query: ['page', 'limit'] });
  path(paths, '/users/customers', 'get', 'Users (Admin)', { summary: 'List/search customers', auth: true, query: ['page', 'limit', 'search'] });
  path(paths, '/users/{id}/deactivate', 'patch', 'Users (Admin)', { summary: 'Deactivate a user', auth: true, params: ['id'] });
  path(paths, '/users/{id}/reactivate', 'patch', 'Users (Admin)', { summary: 'Reactivate a user', auth: true, params: ['id'] });

  // Analytics
  path(paths, '/analytics/dashboard', 'get', 'Analytics', { summary: 'Admin dashboard widgets (sales, orders, revenue, AOV, inventory value, alerts)', auth: true, query: ['branchId'] });
  path(paths, '/analytics/top-medicines', 'get', 'Analytics', { summary: 'Best-selling medicines', auth: true, query: ['limit'] });
  path(paths, '/analytics/sales-trend', 'get', 'Analytics', { summary: 'Daily sales trend', auth: true, query: ['days', 'branchId'] });
  path(paths, '/analytics/inventory-alerts', 'get', 'Analytics', { summary: 'Low stock + expiring batches', auth: true, query: ['branchId'] });

  // Inventory
  path(paths, '/inventory/purchases', 'post', 'Inventory', { summary: 'Receive purchase stock (creates batch, updates totals)', auth: true, body: true });
  path(paths, '/inventory/low-stock', 'get', 'Inventory', { summary: 'List low-stock medicines', auth: true, query: ['branchId'] });
  path(paths, '/inventory/expiring-soon', 'get', 'Inventory', { summary: 'List batches nearing expiry', auth: true, query: ['branchId', 'days'] });
  path(paths, '/inventory/value', 'get', 'Inventory', { summary: 'Total inventory value', auth: true, query: ['branchId'] });
  path(paths, '/inventory/{medicineId}/{branchId}/availability', 'get', 'Inventory', { summary: 'Live stock availability for a medicine at a branch', auth: true, params: ['medicineId', 'branchId'] });

  // MARG
  path(paths, '/marg/webhook', 'post', 'MARG Integration', { summary: 'Marg push receiver (HMAC-SHA256 signed via X-Marg-Signature)' });
  path(paths, '/marg/sync', 'post', 'MARG Integration', { summary: 'Manually trigger a sync (CSV/API mode) for one or all entities', auth: true, body: true });
  path(paths, '/marg/logs', 'get', 'MARG Integration', { summary: 'View recent sync run logs', auth: true, query: ['page', 'limit'] });

  // Audit logs
  path(paths, '/audit-logs', 'get', 'Audit', { summary: 'View admin audit trail', auth: true, query: ['entityType', 'actorId', 'page', 'limit'] });

  // Reports
  path(paths, '/reports/sales', 'get', 'Reports', { summary: 'Sales report (JSON or CSV via ?format=csv)', auth: true, query: ['from', 'to', 'branchId', 'format'] });
  path(paths, '/reports/gst', 'get', 'Reports', { summary: 'GST report (JSON or CSV)', auth: true, query: ['from', 'to', 'format'] });
  path(paths, '/reports/stock', 'get', 'Reports', { summary: 'Stock report (JSON or CSV)', auth: true, query: ['branchId', 'format'] });
  path(paths, '/reports/expiry', 'get', 'Reports', { summary: 'Expiry report (JSON or CSV)', auth: true, query: ['branchId', 'days', 'format'] });

  // Uploads
  path(paths, '/uploads/single', 'post', 'Uploads', { summary: 'Upload a single image to Cloudinary', auth: true });
  path(paths, '/uploads/multiple', 'post', 'Uploads', { summary: 'Upload up to 5 images to Cloudinary', auth: true });

  return paths;
}

export function buildOpenApiDocument() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Medicare Medical Store API',
      version: '1.0.0',
      description:
        'REST API for Medicare Medical Store — pharmacy e-commerce, inventory, orders, payments, and MARG ERP sync. ' +
        'Request bodies are validated against the zod schemas in @healthmart/shared (see source for exact field contracts).',
    },
    servers: [{ url: `${env.API_BASE_URL}/api/v1`, description: env.NODE_ENV }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        ApiSuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {},
            meta: { type: 'object' },
          },
        },
        ApiErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            code: { type: 'string' },
            errors: {
              type: 'array',
              items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } },
            },
          },
        },
      },
    },
    paths: buildPaths(),
  };
}
