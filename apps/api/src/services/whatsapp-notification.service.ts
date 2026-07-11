import { env } from '../config/env';
import { logger } from '../config/logger';
import type { IOrder } from '../models';
import { sendWhatsAppDocument, sendWhatsAppLocation, sendWhatsAppText } from './whatsapp-provider.service';

function googleMapsPinUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function parsePhoneList(raw?: string): string[] {
  return (raw ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function sendInvoiceWhatsAppToCustomer(params: {
  order: IOrder;
  customerPhone?: string;
  customerName?: string;
  invoiceNumber: string;
  invoiceUrl?: string;
}): Promise<void> {
  const { order, customerPhone, customerName, invoiceNumber, invoiceUrl } = params;
  if (!customerPhone) return;

  const fallbackOrderUrl = `${env.SITE_URL.replace(/\/$/, '')}/orders/${order.id}`;
  const billLink = invoiceUrl ?? fallbackOrderUrl;
  const filename = `${invoiceNumber.replace(/[^\w.-]+/g, '_')}.pdf`;

  try {
    if (invoiceUrl && env.WHATSAPP_PROVIDER === 'openwa') {
      await sendWhatsAppDocument({
        phone: customerPhone,
        url: invoiceUrl,
        filename,
        caption: `Invoice ${invoiceNumber} for order ${order.orderNumber}`,
      });
    } else {
      await sendWhatsAppText({
        phone: customerPhone,
        templateName: env.MSG91_WHATSAPP_INVOICE_TEMPLATE_ID,
        text: `Hi ${customerName ?? order.addressSnapshot.contactName}, invoice ${invoiceNumber} for order ${order.orderNumber}: ${billLink}`,
        bodyParams: [
          customerName ?? order.addressSnapshot.contactName,
          order.orderNumber,
          invoiceNumber,
          billLink,
        ],
      });
    }
  } catch (err) {
    logger.error({ err, orderId: order.id }, 'Customer invoice WhatsApp failed');
  }
}

export async function sendDriverAssignmentWhatsApp(params: {
  order: IOrder;
  driverPhone?: string;
  driverName?: string;
}): Promise<void> {
  const { order, driverPhone, driverName } = params;
  if (!driverPhone) return;

  const address = order.addressSnapshot;
  const addressLine = [
    address.line1,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean).join(', ');
  const mapsLink = googleMapsPinUrl(address.lat, address.lng);
  const collectionNote =
    order.paymentMethod === 'cod' ? `Collect Rs. ${Math.round(order.totalAmount)} on delivery.` : 'Payment already completed online.';

  try {
    await sendWhatsAppText({
      phone: driverPhone,
      templateName: env.MSG91_WHATSAPP_DRIVER_ASSIGN_TEMPLATE_ID,
      text: [
        `New delivery assigned: ${order.orderNumber}`,
        `Customer: ${address.contactName} (${address.contactPhone})`,
        `Address: ${addressLine}`,
        `Map: ${mapsLink}`,
        collectionNote,
      ].join('\n'),
      bodyParams: [
        driverName ?? 'Driver',
        order.orderNumber,
        address.contactName,
        address.contactPhone,
        addressLine,
        mapsLink,
        collectionNote,
      ],
    });

    if (env.WHATSAPP_PROVIDER === 'openwa') {
      await sendWhatsAppLocation({
        phone: driverPhone,
        latitude: address.lat,
        longitude: address.lng,
        description: `Delivery ${order.orderNumber}`,
        address: addressLine,
      });
    }
  } catch (err) {
    logger.error({ err, orderId: order.id }, 'Driver assignment WhatsApp failed');
  }
}

export async function sendSalesTeamOrderAlertWhatsApp(params: {
  order: IOrder;
  customerName?: string;
}): Promise<void> {
  const recipients = parsePhoneList(env.SALES_TEAM_WHATSAPP_NUMBERS);
  if (recipients.length === 0) return;

  const { order, customerName } = params;
  const address = order.addressSnapshot;
  const shortAddress = [address.city, address.pincode].filter(Boolean).join(' - ');
  const orderLink = `${env.SITE_URL.replace(/\/$/, '')}/admin/orders`;

  await Promise.all(
    recipients.map(async (phone) => {
      try {
        await sendWhatsAppText({
          phone,
          templateName: env.MSG91_WHATSAPP_SALES_ALERT_TEMPLATE_ID,
          text: [
            `New order: ${order.orderNumber}`,
            `Customer: ${customerName ?? address.contactName}`,
            `Amount: Rs. ${Math.round(order.totalAmount)}`,
            `Payment: ${order.paymentMethod.toUpperCase()}`,
            `Location: ${shortAddress}`,
            `Open: ${orderLink}`,
          ].join('\n'),
          bodyParams: [
            order.orderNumber,
            customerName ?? address.contactName,
            `Rs. ${Math.round(order.totalAmount)}`,
            order.paymentMethod.toUpperCase(),
            shortAddress,
            orderLink,
          ],
        });
      } catch (err) {
        logger.error({ err, orderId: order.id, phone }, 'Sales team WhatsApp alert failed');
      }
    }),
  );
}
