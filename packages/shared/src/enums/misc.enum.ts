export enum NotificationChannel {
  SMS = 'sms',
  EMAIL = 'email',
  PUSH = 'push',
  WHATSAPP = 'whatsapp',
  IN_APP = 'in_app',
}

export enum NotificationType {
  ORDER_UPDATE = 'order_update',
  PRESCRIPTION_UPDATE = 'prescription_update',
  PROMOTION = 'promotion',
  WALLET = 'wallet',
  SYSTEM = 'system',
}

export enum WalletTransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum WalletTransactionReason {
  REFUND = 'refund',
  CASHBACK = 'cashback',
  ORDER_PAYMENT = 'order_payment',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  REFERRAL = 'referral',
  GIFT_CARD = 'gift_card',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  STATUS_CHANGE = 'status_change',
  LOGIN = 'login',
  LOGOUT = 'logout',
  SYNC = 'sync',
}

export enum MargIntegrationMode {
  CSV = 'csv',
  WEBHOOK = 'webhook',
  API = 'api',
  DISABLED = 'disabled',
}

export enum MargSyncEntity {
  MEDICINE = 'medicine',
  STOCK = 'stock',
  PRICE = 'price',
  BATCH = 'batch',
  SUPPLIER = 'supplier',
  CUSTOMER = 'customer',
  SALE_INVOICE = 'sale_invoice',
  RETURN = 'return',
  CREDIT_NOTE = 'credit_note',
  DEBIT_NOTE = 'debit_note',
}

export enum MargSyncStatus {
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed',
  RUNNING = 'running',
}

export enum MedicineRequestStatus {
  PENDING = 'pending',
  SOURCING = 'sourcing',
  ADDED = 'added',
  DECLINED = 'declined',
}

export enum InventoryMovementType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  RESERVATION = 'reservation',
  RESERVATION_RELEASE = 'reservation_release',
  ADJUSTMENT = 'adjustment',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  RETURN = 'return',
  EXPIRED = 'expired',
  MARG_SYNC = 'marg_sync',
}
