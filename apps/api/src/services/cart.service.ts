import { CHECKOUT_CONFIG, type AddCartItemInput, type UpdateCartItemInput } from '@buymedicines/shared';
import { cartRepository, flashSaleRepository, medicineRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { validateAndPriceCoupon } from './coupon.service';
import type { ICart, ICartItem, IMedicine } from '../models';

export interface PricedCartItem {
  medicineId: string;
  name: string;
  image?: string;
  slug: string;
  variantLabel?: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  gstPercentage: number;
  hsnCode: string;
  prescriptionRequired: boolean;
  lineTotal: number;
  maxAvailable?: number;
}

export interface CartTotals {
  items: PricedCartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  gstAmount: number;
  totalAmount: number;
  couponCode?: string;
  freeDelivery: boolean;
}

function resolveItemPrice(medicine: IMedicine, variantLabel?: string) {
  if (variantLabel) {
    const variant = medicine.variants.find((v) => v.label === variantLabel);
    if (variant) return { mrp: variant.mrp, sellingPrice: variant.sellingPrice, packSize: variant.packSize };
  }
  return { mrp: medicine.mrp, sellingPrice: medicine.sellingPrice, packSize: medicine.packSize };
}

/** Single source of truth for cart pricing — used both for the cart view and re-validated again at checkout. */
export async function computeCartTotals(cart: ICart, userId: string): Promise<CartTotals> {
  const medicineIds = cart.items.map((item) => item.medicineId);
  const [medicines, activeFlashSales] = await Promise.all([
    medicineRepository.find({ _id: { $in: medicineIds } }),
    flashSaleRepository.findActiveNow(),
  ]);
  const medicineMap = new Map(medicines.map((m) => [String(m._id), m]));

  // Flash-sale price overrides the catalog price for the base variant only —
  // this is the one place that actually decides what a customer is charged,
  // so it must be the same lookup the storefront's promo badges read from.
  const flashPriceMap = new Map<string, number>();
  for (const sale of activeFlashSales) {
    for (const saleItem of sale.items) {
      flashPriceMap.set(String(saleItem.medicineId), saleItem.flashPrice);
    }
  }

  const pricedItems: PricedCartItem[] = [];
  let subtotal = 0;
  let gstAmount = 0;

  for (const item of cart.items) {
    const medicine = medicineMap.get(String(item.medicineId));
    if (!medicine || !medicine.isActive) continue;

    const { mrp, sellingPrice: basePrice } = resolveItemPrice(medicine, item.variantLabel);
    const flashPrice = item.variantLabel ? undefined : flashPriceMap.get(String(medicine._id));
    const sellingPrice = flashPrice ?? basePrice;
    const lineTotal = sellingPrice * item.quantity;
    subtotal += lineTotal;
    gstAmount += (lineTotal * medicine.gstPercentage) / (100 + medicine.gstPercentage);

    pricedItems.push({
      medicineId: String(medicine._id),
      name: medicine.name,
      image: medicine.images[0],
      slug: medicine.slug,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      mrp,
      sellingPrice,
      gstPercentage: medicine.gstPercentage,
      hsnCode: medicine.hsnCode,
      prescriptionRequired: medicine.prescriptionRequired,
      lineTotal: Math.round(lineTotal * 100) / 100,
    });
  }

  subtotal = Math.round(subtotal * 100) / 100;
  gstAmount = Math.round(gstAmount * 100) / 100;

  let discount = 0;
  let freeDelivery = false;

  if (cart.couponCode) {
    try {
      const result = await validateAndPriceCoupon(cart.couponCode, userId, subtotal);
      discount = result.discountAmount;
      freeDelivery = result.freeDelivery;
    } catch {
      discount = 0;
      freeDelivery = false;
    }
  }

  const deliveryFee =
    freeDelivery || subtotal >= CHECKOUT_CONFIG.FREE_DELIVERY_THRESHOLD
      ? 0
      : CHECKOUT_CONFIG.STANDARD_DELIVERY_FEE;

  const totalAmount = Math.max(0, Math.round((subtotal - discount + deliveryFee) * 100) / 100);

  return {
    items: pricedItems,
    subtotal,
    discount,
    deliveryFee,
    gstAmount,
    totalAmount,
    couponCode: cart.couponCode,
    freeDelivery,
  };
}

export async function getCart(userId: string) {
  const cart = await cartRepository.findByUser(userId);
  return computeCartTotals(cart, userId);
}

export async function addItemToCart(userId: string, input: AddCartItemInput) {
  const medicine = await medicineRepository.findById(input.medicineId);
  if (!medicine || !medicine.isActive) throw ApiError.notFound('Medicine not found');

  if (input.variantLabel) {
    const variantExists = medicine.variants.some((v) => v.label === input.variantLabel);
    if (!variantExists) throw ApiError.badRequest('Invalid product variant selected');
  }

  const cart = await cartRepository.findByUser(userId);
  const existingItem = cart.items.find(
    (item) => String(item.medicineId) === input.medicineId && item.variantLabel === input.variantLabel,
  );

  if (existingItem) {
    existingItem.quantity = Math.min(50, existingItem.quantity + input.quantity);
  } else {
    cart.items.push({
      medicineId: medicine._id,
      variantLabel: input.variantLabel,
      quantity: input.quantity,
    } as ICartItem);
  }

  await cart.save();
  return computeCartTotals(cart, userId);
}

export async function updateCartItem(
  userId: string,
  medicineId: string,
  variantLabel: string | undefined,
  input: UpdateCartItemInput,
) {
  const cart = await cartRepository.findByUser(userId);
  const itemIndex = cart.items.findIndex(
    (item) => String(item.medicineId) === medicineId && item.variantLabel === variantLabel,
  );
  if (itemIndex === -1) throw ApiError.notFound('Item not found in cart');

  if (input.quantity === 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex]!.quantity = input.quantity;
  }

  await cart.save();
  return computeCartTotals(cart, userId);
}

export async function removeCartItem(userId: string, medicineId: string, variantLabel?: string) {
  const cart = await cartRepository.findByUser(userId);
  cart.items = cart.items.filter(
    (item) => !(String(item.medicineId) === medicineId && item.variantLabel === variantLabel),
  );
  await cart.save();
  return computeCartTotals(cart, userId);
}

export async function applyCouponToCart(userId: string, code: string) {
  const cart = await cartRepository.findByUser(userId);
  const totals = await computeCartTotals(cart, userId);
  await validateAndPriceCoupon(code, userId, totals.subtotal);

  cart.couponCode = code.toUpperCase();
  await cart.save();
  return computeCartTotals(cart, userId);
}

export async function removeCouponFromCart(userId: string) {
  const cart = await cartRepository.findByUser(userId);
  cart.couponCode = undefined;
  await cart.save();
  return computeCartTotals(cart, userId);
}

export async function clearCart(userId: string) {
  await cartRepository.clear(userId);
}
