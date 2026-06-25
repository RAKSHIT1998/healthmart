import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

/**
 * Schema-only in Phase 1 — the full CMS authoring UI and public blog pages
 * ship in Phase 2. Modeled now so the collection and indexes exist upfront.
 */
export interface IBlog extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  authorId: Types.ObjectId;
  isPublished: boolean;
  publishedAt?: Date;
  metaTitle?: string;
  metaDescription?: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    excerpt: { type: String, maxlength: 300 },
    content: { type: String, required: true },
    coverImage: { type: String },
    category: { type: String, required: true, index: true },
    tags: { type: [String], default: [], index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
    metaTitle: { type: String },
    metaDescription: { type: String },
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
);

blogSchema.index({ title: 'text', content: 'text', tags: 'text' });
toJSONPlugin(blogSchema);

export const BlogModel = model<IBlog>('Blog', blogSchema);
