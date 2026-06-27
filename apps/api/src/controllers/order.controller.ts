import type { Response } from 'express';
import { AuditAction, OrderStatus, type PaginationQuery } from '@healthmart/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import * as orderService from '../services/order.service';
import { getInvoiceForOrder } from '../services/invoice.service';
import { orderRepository } from '../repositories';
import { recordAudit } from '../middlewares/audit.middleware';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const checkout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const returnUrl = `${req.body.returnUrlBase || req.headers.origin || ''}/orders`;
  const result = await orderService.initiateCheckout(req.user!.id, req.body, returnUrl);
  sendSuccess(res, result, 'Checkout initiated', 201);
});

export const myOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const pagination = req.query as unknown as PaginationQuery;
  const { items, pagination: meta } = await orderRepository.listForUser(req.user!.id, pagination);
  sendPaginated(res, items, meta);
});

export const getOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const order = await orderRepository.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!order) throw ApiError.notFound('Order not found');
  sendSuccess(res, order);
});

export const trackOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const order = await orderRepository.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!order) throw ApiError.notFound('Order not found');
  sendSuccess(res, { status: order.status, statusHistory: order.statusHistory, driverId: order.driverId });
});

export const cancelOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const order = await orderService.cancelOrder(req.params.id as string, req.user!.id, req.body.reason);
  sendSuccess(res, order, 'Order cancelled');
});

// ---- Admin / staff ----

export const listAllOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filters = req.query as unknown as PaginationQuery & { status?: OrderStatus; branchId?: string };
  const { items, pagination } = await orderRepository.listForAdmin(filters);
  sendPaginated(res, items, pagination);
});

export const getOrderAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const order = await orderRepository.findById(req.params.id as string);
  if (!order) throw ApiError.notFound('Order not found');
  sendSuccess(res, order);
});

export const updateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const order = await orderService.updateOrderStatus(req.params.id as string, req.body.status, req.user!.id, req.body.reason);
  recordAudit({ req, action: AuditAction.STATUS_CHANGE, entityType: 'Order', entityId: req.params.id, after: { status: req.body.status } });
  sendSuccess(res, order, 'Order status updated');
});

export const assignDriver = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const order = await orderService.assignDriver(req.params.id as string, req.body.driverId);
  recordAudit({ req, action: AuditAction.UPDATE, entityType: 'Order', entityId: req.params.id, after: { driverId: req.body.driverId } });
  sendSuccess(res, order, 'Driver assigned');
});

// ---- Delivery boy ----

export const verifyDeliveryOtp = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { otp, proofOfDeliveryUrl, customerSignatureUrl } = req.body;
  const order = await orderService.verifyDeliveryOtp(req.params.id as string, otp, { proofOfDeliveryUrl, customerSignatureUrl });
  sendSuccess(res, order, 'Delivery confirmed');
});

export const resendDeliveryOtp = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await orderService.resendDeliveryOtp(req.params.id as string);
  sendSuccess(res, null, 'Delivery OTP resent');
});

export const getInvoice = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const invoice = await getInvoiceForOrder(req.params.id as string);
  sendSuccess(res, invoice);
});
