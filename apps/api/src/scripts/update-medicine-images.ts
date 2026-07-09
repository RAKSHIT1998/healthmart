import axios from 'axios';
import cheerio from 'cheerio';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { MedicineModel } from '../models';
import { uploadToCloudinary } from '../integrations/cloudinary';

const DELAY_BETWEEN_REQUESTS_MS = 2000;
const DEFAULT_LIMIT = 50;
const PLACEHOLDER_HOST_PATTERNS = ['images.unsplash.com', 'example.com'];

interface SearchResult {
  name: string;
  imageUrl: string;
  source: 'pharmeasy' | 'netmeds';
}

interface CliOptions {
  dryRun: boolean;
  limit: number;
  replacePlaceholders: boolean;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseOptions(argv: string[]): CliOptions {
  const limitArg = argv.find((arg) => arg.startsWith('--limit='));
  const parsedLimit = limitArg ? Number(limitArg.split('=')[1]) : DEFAULT_LIMIT;

  return {
    dryRun: argv.includes('--dry-run'),
    limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : DEFAULT_LIMIT,
    replacePlaceholders: argv.includes('--replace-placeholders'),
  };
}

function isPlaceholderImage(url?: string): boolean {
  if (!url) return true;

  try {
    const hostname = new URL(url).hostname;
    return PLACEHOLDER_HOST_PATTERNS.some((pattern) => hostname.includes(pattern));
  } catch {
    return true;
  }
}

function needsImageRefresh(images: string[], replacePlaceholders: boolean): boolean {
  if (images.length === 0) return true;
  if (!replacePlaceholders) return false;
  return images.every((image) => isPlaceholderImage(image));
}

function normaliseImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith('//')) return `https:${imageUrl}`;
  return imageUrl;
}

async function fetchHtml(url: string): Promise<string> {
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    },
    timeout: 20000,
  });

  return data as string;
}

async function searchPharmeasy(medicineName: string): Promise<SearchResult | null> {
  try {
    const $ = cheerio.load(await fetchHtml(`https://pharmeasy.in/search/all?name=${encodeURIComponent(medicineName)}`));
    const selectors = ['.product-card', '.medicine-card', '[data-test-id="product-card"]', '.product-list-item', '.card', 'div[class*="product"]'];

    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length === 0) continue;

      for (let i = 0; i < Math.min(3, elements.length); i++) {
        const element = $(elements[i]);
        const img = element.find('img').first();
        const imageUrl = normaliseImageUrl(img.attr('src') || img.attr('data-src') || img.attr('data-original') || '');
        const name = element.find('.product-name, .medicine-name, h3, h4, .title, [class*="name"]').first().text().trim();

        if (name && imageUrl) return { name, imageUrl, source: 'pharmeasy' };
      }
    }
  } catch (error) {
    logger.warn({ err: error, medicineName }, 'Error searching PharmEasy');
  }

  return null;
}

async function searchNetmeds(medicineName: string): Promise<SearchResult | null> {
  try {
    const $ = cheerio.load(await fetchHtml(`https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(medicineName)}/all`));
    const selectors = ['.product-card', '.product-list-item', '.catgItem', '.product-item', 'div[class*="product"]'];

    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length === 0) continue;

      for (let i = 0; i < Math.min(3, elements.length); i++) {
        const element = $(elements[i]);
        const img = element.find('img').first();
        const imageUrl = normaliseImageUrl(
          img.attr('src') || img.attr('data-src') || img.attr('data-original') || img.attr('data-lazy') || '',
        );
        const name = element.find('.product-title, .product-name, h3, h4, .title, [class*="name"]').first().text().trim();

        if (name && imageUrl) return { name, imageUrl, source: 'netmeds' };
      }
    }
  } catch (error) {
    logger.warn({ err: error, medicineName }, 'Error searching Netmeds');
  }

  return null;
}

async function persistImage(imageUrl: string, medicineName: string, dryRun: boolean): Promise<string> {
  if (dryRun) return imageUrl;
  if (!env.CLOUDINARY_CLOUD_NAME) return imageUrl;

  const response = await axios.get<ArrayBuffer>(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 20000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    },
  });

  const mimeType = response.headers['content-type'] || 'image/jpeg';
  const uploaded = await uploadToCloudinary(Buffer.from(response.data), 'medicines', mimeType);

  logger.info({ medicineName, sourceUrl: imageUrl, uploadedUrl: uploaded.url }, 'Uploaded scraped image to Cloudinary');
  return uploaded.url;
}

async function updateMedicineImages(options: CliOptions) {
  await connectDatabase();
  logger.info({ options }, 'Connected to database for medicine image update');

  try {
    const medicines = await MedicineModel.find({
      $or: [
        { images: { $size: 0 } },
        { images: { $exists: false } },
        ...(options.replacePlaceholders
          ? [{ images: { $elemMatch: { $regex: PLACEHOLDER_HOST_PATTERNS.map((p) => p.replace('.', '\\.')).join('|'), $options: 'i' } } }]
          : []),
      ],
    }).limit(options.limit);

    logger.info({ count: medicines.length }, 'Found medicines eligible for image refresh');

    let updatedCount = 0;
    let skippedCount = 0;

    for (const medicine of medicines) {
      if (!needsImageRefresh(medicine.images ?? [], options.replacePlaceholders)) {
        skippedCount++;
        continue;
      }

      try {
        logger.info({ medicine: medicine.name }, 'Looking up medicine image');

        let result = await searchPharmeasy(medicine.name);
        if (!result) {
          await delay(DELAY_BETWEEN_REQUESTS_MS);
          result = await searchNetmeds(medicine.name);
        }

        if (!result?.imageUrl) {
          skippedCount++;
          logger.warn({ medicine: medicine.name }, 'No image found');
          await delay(DELAY_BETWEEN_REQUESTS_MS);
          continue;
        }

        const finalImageUrl = await persistImage(result.imageUrl, medicine.name, options.dryRun);
        if (!options.dryRun) {
          medicine.images = [finalImageUrl];
          await medicine.save();
        }

        updatedCount++;
        logger.info(
          { medicine: medicine.name, source: result.source, imageUrl: finalImageUrl, dryRun: options.dryRun },
          'Medicine image refreshed',
        );
      } catch (error) {
        skippedCount++;
        logger.error({ err: error, medicine: medicine.name }, 'Failed to refresh medicine image');
      }

      await delay(DELAY_BETWEEN_REQUESTS_MS);
    }

    logger.info({ updatedCount, skippedCount, dryRun: options.dryRun }, 'Medicine image update complete');
  } finally {
    await disconnectDatabase();
    logger.info('Disconnected from database');
  }
}

const options = parseOptions(process.argv.slice(2));

updateMedicineImages(options).catch((err) => {
  logger.error({ err }, 'Fatal error in updateMedicineImages');
  process.exit(1);
});
