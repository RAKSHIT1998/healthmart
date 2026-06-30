import { z } from 'zod';

export const contactMessageSchema = z.object({
  name: z.string().min(1).max(100),
  contact: z.string().min(3).max(150),
  message: z.string().min(1).max(2000),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
