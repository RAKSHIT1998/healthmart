import request from 'supertest';
import { PrescriptionStatus, Role } from '@buymedicines/shared';
import { setupTestDB, teardownTestDB, clearDatabase } from './utils/db';
import { createApp } from '../src/app';
import { PrescriptionModel } from '../src/models';
import { createCustomer, createMedicine } from './utils/fixtures';
import { signAccessToken } from '../src/utils/jwt';

const mockUploadToCloudinary = jest.fn();
const mockExtractText = jest.fn();

jest.mock('../src/integrations/cloudinary', () => ({
  uploadToCloudinary: (...args: unknown[]) => mockUploadToCloudinary(...args),
}));

jest.mock('../src/integrations/ocr', () => ({
  getOcrProvider: () => ({
    extractText: (...args: unknown[]) => mockExtractText(...args),
  }),
}));

beforeAll(setupTestDB);
afterAll(teardownTestDB);
afterEach(async () => {
  jest.clearAllMocks();
  await clearDatabase();
});

describe('Prescription upload flow', () => {
  it('uploads images and creates a prescription record for the authenticated customer', async () => {
    const app = createApp();
    const customer = await createCustomer();
    await createMedicine({ name: 'Paracetamol 500mg', composition: ['Paracetamol'] });

    const accessToken = signAccessToken({
      sub: String(customer._id),
      role: Role.CUSTOMER,
      tokenVersion: customer.tokenVersion,
    });

    mockUploadToCloudinary.mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/image/upload/v1/prescriptions/test-rx.jpg',
      publicId: 'prescriptions/test-rx',
    });
    mockExtractText.mockResolvedValue({
      rawText: 'Paracetamol 500mg',
      matchedTerms: ['Paracetamol'],
    });

    const uploadResponse = await request(app)
      .post('/api/v1/uploads/multiple?folder=prescriptions')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('files', Buffer.from('fake-image'), { filename: 'rx.png', contentType: 'image/png' });

    expect(uploadResponse.status).toBe(201);
    expect(uploadResponse.body.success).toBe(true);
    expect(uploadResponse.body.data[0].url).toContain('res.cloudinary.com');

    const createResponse = await request(app)
      .post('/api/v1/prescriptions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        imageUrls: uploadResponse.body.data.map((item: { url: string }) => item.url),
        notes: 'Please review for monthly refill',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data.status).toBe(PrescriptionStatus.OCR_PROCESSED);
    expect(mockExtractText).toHaveBeenCalledTimes(1);

    const saved = await PrescriptionModel.findById(createResponse.body.data.id);
    expect(saved).not.toBeNull();
    expect(saved!.imageUrls).toHaveLength(1);
    expect(saved!.notes).toBe('Please review for monthly refill');
    expect(saved!.ocrMatchedTerms).toContain('Paracetamol');
  });
});
