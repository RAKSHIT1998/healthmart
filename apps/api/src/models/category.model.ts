import { Schema, model, Types, type Document } from 'mongoose';
import { ProductCategoryGroup } from '@buymedicines/shared';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  group: ProductCategoryGroup;
  parentId?: Types.ObjectId;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    group: { type: String, enum: Object.values(ProductCategoryGroup), required: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category' },
    image: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

toJSONPlugin(categorySchema);

export const CategoryModel = model<ICategory>('Category', categorySchema);
