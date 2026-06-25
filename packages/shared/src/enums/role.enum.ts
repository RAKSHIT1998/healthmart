export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  PHARMACIST = 'pharmacist',
  INVENTORY_MANAGER = 'inventory_manager',
  DELIVERY_BOY = 'delivery_boy',
  CUSTOMER = 'customer',
}

export const STAFF_ROLES: Role[] = [
  Role.ADMIN,
  Role.MANAGER,
  Role.PHARMACIST,
  Role.INVENTORY_MANAGER,
  Role.DELIVERY_BOY,
];

export const ALL_ROLES: Role[] = [...STAFF_ROLES, Role.CUSTOMER];
