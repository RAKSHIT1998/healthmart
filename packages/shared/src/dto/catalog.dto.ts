import { z } from 'zod';
import { objectIdSchema } from './common.dto';

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(120).optional(),
  group: z.enum(['medicine', 'healthcare', 'baby_care', 'personal_care', 'devices']),
  parentId: objectIdSchema.optional(),
  image: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createManufacturerSchema = z.object({
  name: z.string().min(2).max(150),
  logo: z.string().url().optional(),
  country: z.string().max(60).optional(),
  isActive: z.boolean().default(true),
});

export const updateManufacturerSchema = createManufacturerSchema.partial();

export const createSupplierSchema = z.object({
  name: z.string().min(2).max(150),
  gstin: z.string().max(20).optional(),
  contactPerson: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().max(300).optional(),
  margSupplierCode: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateManufacturerInput = z.infer<typeof createManufacturerSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
