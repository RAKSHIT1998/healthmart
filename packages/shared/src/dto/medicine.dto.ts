import { z } from 'zod';
import { objectIdSchema } from './common.dto';
import { REGEX } from '../constants';

export const medicineVariantSchema = z.object({
  label: z.string().min(1).max(60),
  mrp: z.number().positive(),
  sellingPrice: z.number().positive(),
  packSize: z.string().min(1).max(40),
});

export const createMedicineSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(220).optional(),
  shortDescription: z.string().max(300).optional(),
  description: z.string().min(10),
  composition: z.array(z.string().min(1)).min(1),
  uses: z.array(z.string().min(1)).default([]),
  dosage: z.string().max(1000).optional(),
  sideEffects: z.array(z.string().min(1)).default([]),
  storageInstructions: z.string().max(500).optional(),
  manufacturerId: objectIdSchema,
  categoryId: objectIdSchema,
  categoryGroup: z.enum(['medicine', 'healthcare', 'baby_care', 'personal_care', 'devices']),
  medicineType: z.enum([
    'tablet',
    'capsule',
    'syrup',
    'injection',
    'ointment',
    'drops',
    'inhaler',
    'device',
    'other',
  ]),
  scheduleClass: z
    .enum(['none', 'schedule_h', 'schedule_h1', 'schedule_x', 'schedule_g'])
    .default('none'),
  prescriptionRequired: z.boolean().default(false),
  isGeneric: z.boolean().default(false),
  mrp: z.number().positive(),
  sellingPrice: z.number().positive(),
  gstPercentage: z.number().min(0).max(28),
  hsnCode: z.string().regex(REGEX.HSN, 'Invalid HSN code'),
  packSize: z.string().min(1).max(40),
  images: z.array(z.string().url()).default([]),
  alternativeMedicineIds: z.array(objectIdSchema).default([]),
  variants: z.array(medicineVariantSchema).default([]),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
}).refine((data) => data.sellingPrice <= data.mrp, {
  message: 'Selling price cannot exceed MRP',
  path: ['sellingPrice'],
});

export const updateMedicineSchema = z
  .object({
    name: z.string().min(2).max(200),
    shortDescription: z.string().max(300),
    description: z.string().min(10),
    composition: z.array(z.string().min(1)).min(1),
    uses: z.array(z.string().min(1)),
    dosage: z.string().max(1000),
    sideEffects: z.array(z.string().min(1)),
    storageInstructions: z.string().max(500),
    manufacturerId: objectIdSchema,
    categoryId: objectIdSchema,
    categoryGroup: z.enum(['medicine', 'healthcare', 'baby_care', 'personal_care', 'devices']),
    medicineType: z.enum([
      'tablet',
      'capsule',
      'syrup',
      'injection',
      'ointment',
      'drops',
      'inhaler',
      'device',
      'other',
    ]),
    scheduleClass: z.enum(['none', 'schedule_h', 'schedule_h1', 'schedule_x', 'schedule_g']),
    prescriptionRequired: z.boolean(),
    isGeneric: z.boolean(),
    mrp: z.number().positive(),
    sellingPrice: z.number().positive(),
    gstPercentage: z.number().min(0).max(28),
    hsnCode: z.string().regex(REGEX.HSN),
    packSize: z.string().min(1).max(40),
    images: z.array(z.string().url()),
    alternativeMedicineIds: z.array(objectIdSchema),
    variants: z.array(medicineVariantSchema),
    tags: z.array(z.string()),
    isActive: z.boolean(),
  })
  .partial();

export const medicineSearchQuerySchema = z.object({
  q: z.string().max(150).optional(),
  categoryId: objectIdSchema.optional(),
  manufacturerId: objectIdSchema.optional(),
  categoryGroup: z
    .enum(['medicine', 'healthcare', 'baby_care', 'personal_care', 'devices'])
    .optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  prescriptionRequired: z.coerce.boolean().optional(),
  isGeneric: z.coerce.boolean().optional(),
  inStockOnly: z.coerce.boolean().optional(),
  sortBy: z.enum(['price', 'popularity', 'newest', 'discount', 'relevance']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateMedicineInput = z.infer<typeof createMedicineSchema>;
export type UpdateMedicineInput = z.infer<typeof updateMedicineSchema>;
export type MedicineSearchQuery = z.infer<typeof medicineSearchQuerySchema>;
