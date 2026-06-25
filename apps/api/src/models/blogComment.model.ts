import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IBlogComment extends Document {
  _id: Types.ObjectId;
  blogId: Types.ObjectId;
  userId: Types.ObjectId;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
}

const blogCommentSchema = new Schema<IBlogComment>(
  {
    blogId: { type: Schema.Types.ObjectId, ref: 'Blog', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true, maxlength: 1000 },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

toJSONPlugin(blogCommentSchema);

export const BlogCommentModel = model<IBlogComment>('BlogComment', blogCommentSchema);
