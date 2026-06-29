import { Schema, model, Types, type Document } from 'mongoose';
import {
  MedicineType,
  ProductCategoryGroup,
  ScheduleDrugClass,
} from '@healthmart/shared';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IMedicineVariant {
  label: string;
  mrp: number;
  sellingPrice: number;
  packSize: string;
}

export interface IMedicine extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  shortDescription?: string;
  description: string;
  composition: string[];
  uses: string[];
  dosage?: string;
  sideEffects: string[];
  storageInstructions?: string;
  manufacturerId: Types.ObjectId;
  categoryId: Types.ObjectId;
  categoryGroup: ProductCategoryGroup;
  medicineType: MedicineType;
  scheduleClass: ScheduleDrugClass;
  prescriptionRequired: boolean;
  isGeneric: boolean;
  mrp: number;
  sellingPrice: number;
  gstPercentage: number;
  hsnCode: string;
  packSize: string;
  images: string[];
  alternativeMedicineIds: Types.ObjectId[];
  variants: IMedicineVariant[];
  tags: string[];
  isActive: boolean;
  margItemCode?: string;
  ratingsAverage: number;
  ratingsCount: number;
  salesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IMedicineVariant>(
  {
    label: { type: String, required: true },
    mrp: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    packSize: { type: String, required: true },
  },
  { _id: false },
);

const medicineSchema = new Schema<IMedicine>(
  {
    name: { type: String, required: true, maxlength: 200, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    shortDescription: { type: String, maxlength: 300 },
    description: { type: String, required: true },
    composition: { type: [String], default: [] },
    uses: { type: [String], default: [] },
    dosage: { type: String },
    sideEffects: { type: [String], default: [] },
    storageInstructions: { type: String },
    manufacturerId: { type: Schema.Types.ObjectId, ref: 'Manufacturer', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    categoryGroup: { type: String, enum: Object.values(ProductCategoryGroup), required: true, index: true },
    medicineType: { type: String, enum: Object.values(MedicineType), required: true },
    scheduleClass: {
      type: String,
      enum: Object.values(ScheduleDrugClass),
      default: ScheduleDrugClass.NONE,
    },
    prescriptionRequired: { type: Boolean, default: false, index: true },
    isGeneric: { type: Boolean, default: false, index: true },
    mrp: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0, index: true },
    gstPercentage: { type: Number, required: true, min: 0, max: 28 },
    hsnCode: { type: String, required: true },
    packSize: { type: String, required: true },
    images: { type: [String], default: [] },
    alternativeMedicineIds: [{ type: Schema.Types.ObjectId, ref: 'Medicine' }],
    variants: { type: [variantSchema], default: [] },
    tags: { type: [String], default: [], index: true },
    isActive: { type: Boolean, default: true, index: true },
    margItemCode: { type: String, index: true, sparse: true },
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0, min: 0 },
    salesCount: { type: Number, default: 0, min: 0, index: true },
  },
  { timestamps: true },
);

medicineSchema.index(
  { name: 'text', composition: 'text', tags: 'text', shortDescription: 'text' },
  { weights: { name: 10, composition: 5, tags: 3, shortDescription: 1 } },
);
medicineSchema.index({ categoryId: 1, isActive: 1 });
medicineSchema.index({ sellingPrice: 1, isActive: 1 });
medicineSchema.virtual('discountPercentage').get(function (this: IMedicine) {
  if (!this.mrp) return 0;
  return Math.round(((this.mrp - this.sellingPrice) / this.mrp) * 100);
});

toJSONPlugin(medicineSchema);

export const MedicineModel = model<IMedicine>('Medicine', medicineSchema);
