import { connectDatabase, disconnectDatabase } from '../config/db';
import { logger } from '../config/logger';
import { MedicineModel } from '../models';
import axios from 'axios';
import cheerio from 'cheerio';

const BATCH_SIZE = 10;
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds between requests to be respectful

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract price from text like "₹ 450" or "Rs. 450" or "450"
 */
function extractPrice(text: string): number {
  const match = text.match(/[\d,]+(?:\.\d+)?/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, ''));
}

/**
 * Search for medicine on PharmEasy and return the first result with image
 */
async function searchPharmeasy(medicineName: string) {
  try {
    const searchUrl = `https://pharmeasy.in/search/all?name=${encodeURIComponent(medicineName)}`;
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);

    // Try multiple selectors for product cards
    const selectors = [
      '.product-card',
      '.medicine-card',
      '[data-test-id="product-card"]',
      '.product-list-item',
      '.card',
      'div[class*="product"]'
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        // Check first few elements for a valid product
        for (let i = 0; i < Math.min(3, elements.length); i++) {
          const element = $(elements[i]);

          // Extract image
          const img = element.find('img').first();
          let imageUrl = '';
          if (img.length) {
            imageUrl = img.attr('src') ||
                      img.attr('data-src') ||
                      img.attr('data-original') ||
                      '';
          }

          // Extract name
          let name = '';
          const nameSelectors = ['.product-name', '.medicine-name', 'h3', 'h4', '.title', '[class*="name"]'];
          for (const sel of nameSelectors) {
            const nameElem = element.find(sel).first();
            if (nameElem.length) {
              name = nameElem.text().trim();
              if (name) break;
            }
          }

          // If we couldn't find a specific name element, use the first significant text
          if (!name) {
            const text = element.text().trim();
            // Take first line that looks like a medicine name
            const lines = text.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.length > 5 && trimmed.length < 100 &&
                  !/^\d+$/.test(trimmed) &&
                  !/^\s*[₹$€£]\s*\d/.test(trimmed) &&
                  !/^\s*\(?\d+[mgmcg]?\)?\s*$/i.test(trimmed)) {
                name = trimmed;
                break;
              }
            }
          }

          // Validate that we got something reasonable
          if (name && imageUrl) {
            return {
              name,
              imageUrl,
              source: 'pharmeasy'
            };
          }
        }
      }
    }

    return null;
  } catch (error) {
    logger.warn(`Error searching PharmEasy for ${medicineName}:`, error.message);
    return null;
  }
}

/**
 * Search for medicine on Netmeds and return the first result with image
 */
async function searchNetmeds(medicineName: string) {
  try {
    const searchUrl = `https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(medicineName)}/all`;
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);

    // Try multiple selectors for product cards
    const selectors = [
      '.product-card',
      '.product-list-item',
      '.catgItem',
      '.product-item',
      'div[class*="product"]'
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        // Check first few elements for a valid product
        for (let i = 0; i < Math.min(3, elements.length); i++) {
          const element = $(elements[i]);

          // Extract image
          const img = element.find('img').first();
          let imageUrl = '';
          if (img.length) {
            imageUrl = img.attr('src') ||
                      img.attr('data-src') ||
                      img.attr('data-original') ||
                      img.attr('data-lazy') ||
                      '';
          }

          // Extract name
          let name = '';
          const nameSelectors = ['.product-title', '.product-name', 'h3', 'h4', '.title', '[class*="name"]'];
          for (const sel of nameSelectors) {
            const nameElem = element.find(sel).first();
            if (nameElem.length) {
              name = nameElem.text().trim();
              if (name) break;
            }
          }

          // If we couldn't find a specific name element, use the first significant text
          if (!name) {
            const text = element.text().trim();
            // Take first line that looks like a medicine name
            const lines = text.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.length > 5 && trimmed.length < 100 &&
                  !/^\d+$/.test(trimmed) &&
                  !/^\s*[₹$€£]\s*\d/.test(trimmed) &&
                  !/^\s*\(?\d+[mgmcg]?\)?\s*$/i.test(trimmed)) {
                name = trimmed;
                break;
              }
            }
          }

          // Validate that we got something reasonable
          if (name && imageUrl) {
            return {
              name,
              imageUrl,
              source: 'netmeds'
            };
          }
        }
      }
    }

    return null;
  } catch (error) {
    logger.warn(`Error searching Netmeds for ${medicineName}:`, error.message);
    return null;
  }
}

/**
 * Update medicine with better image from pharmacy sites
 */
async function updateMedicineImages() {
  await connectDatabase();
  logger.info('Connected to database');

  try {
    // Get medicines that have no images or empty image arrays
    const medicines = await MedicineModel.find({
      $or: [
        { images: { $size: 0 } },
        { images: { $exists: false } }
      ]
    }).limit(50); // Limit to 50 for testing

    logger.info(`Found ${medicines.length} medicines without images`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const medicine of medicines) {
      try {
        logger.info(`Processing: ${medicine.name}`);

        // Try to get image from PharmEasy first
        let result = await searchPharmeasy(medicine.name);

        // If PharmEasy fails or returns nothing, try Netmeds
        if (!result) {
          await delay(DELAY_BETWEEN_REQUESTS); // Delay between requests
          result = await searchNetmeds(medicine.name);
        }

        if (result && result.imageUrl) {
          // Update the medicine with the new image
          medicine.images = [result.imageUrl];
          await medicine.save();
          updatedCount++;
          logger.info(`✅ Updated ${medicine.name} with image from ${result.source}`);
        } else {
          skippedCount++;
          logger.warn(`⚠️  No image found for ${medicine.name}`);
        }

        // Delay between processing medicines to be respectful to the servers
        await delay(DELAY_Between_REQUESTS);

      } catch (error) {
        logger.error(`❌ Error processing ${medicine.name}:`, error.message);
        skippedCount++;
        continue;
      }
    }

    logger.info(`✅ Update complete. Updated: ${updatedCount}, Skipped: ${skippedCount}`);

  } catch (error) {
    logger.error('Error in updateMedicineImages:', error);
  } finally {
    await disconnectDatabase();
    logger.info('Disconnected from database');
  }
}

// Run the update
updateMedicineImages().catch(err => {
  logger.error('Fatal error in updateMedicineImages:', err);
  process.exit(1);
});