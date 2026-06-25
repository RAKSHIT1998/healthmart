import { BaseRepository } from './BaseRepository';
import { InvoiceModel, type IInvoice } from '../models';

class InvoiceRepository extends BaseRepository<IInvoice> {
  constructor() {
    super(InvoiceModel);
  }

  async findByOrderId(orderId: string) {
    return this.model.findOne({ orderId });
  }

  async countForFinancialYear(fyLabel: string) {
    return this.model.countDocuments({ invoiceNumber: { $regex: `^INV/${fyLabel}/` } });
  }
}

export const invoiceRepository = new InvoiceRepository();
