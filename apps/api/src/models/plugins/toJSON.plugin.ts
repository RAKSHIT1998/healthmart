import type { Schema } from 'mongoose';

/** Normalizes Mongoose output: _id -> id, strips __v and sensitive fields. */
export function toJSONPlugin(schema: Schema, hiddenFields: string[] = []): void {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = String(ret._id);
      delete ret._id;
      for (const field of hiddenFields) {
        delete ret[field];
      }
      return ret;
    },
  });
}
