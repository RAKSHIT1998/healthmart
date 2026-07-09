import { connectDatabase, disconnectDatabase } from '../config/db';
import { logger } from '../config/logger';
import * as medicineService from '../services/medicine.service';
import { categoryRepository, manufacturerRepository, medicineRepository } from '../repositories';
import axios from 'axios';
import cheerio from 'cheerio';

const BASE_DELAY_MS = 2000; // delay between requests to be respectful

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
 * Scrape PharmEasy for medicine information
 */
async function scrapePharmeasy(query: string) {
  logger.info(`Scraping PharmEasy for query: ${query}`);
  const searchUrl = `https://pharmeasy.in/search/all?name=${encodeURIComponent(query)}`;

  try {
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    const products: any[] = [];

    // PharmEasy product card selectors (based on common patterns)
    $('.product-card, .medicine-card, [data-test-id="product-card"]').each((index, element) => {
      if (index >= 5) return false; // Limit to first 5 results

      const element = $(element);
      const nameElem = element.find('.product-name, .medicine-name, h3, h4');
      const priceElem = element.find('.price, .sale-price, .actual-price');
      const imageElem = element.find('img');
      const linkElem = element.find('a');

      const name = nameElem.text().trim() ||
                  element.find('h3').text().trim() ||
                  element.find('.title').text().trim();

      const priceText = priceElem.text().trim() ||
                       element.find('[class*="price"]').text().trim();
      const price = priceText ? extractPrice(priceText) : 0;

      const imageUrl = imageElem.attr('src') ||
                      imageElem.attr('data-src') ||
                      element.find('img').attr('src') ||
                      '';

      const productUrl = linkElem.attr('href') || '';
      const fullUrl = productUrl.startsWith('http') ? productUrl :
                     (productUrl.startsWith('/') ? `https://pharmeasy.in${productUrl}` : '');

      if (name && name.length > 3) { // Basic validation
        products.push({
          name,
          price,
          imageUrl,
          productUrl: fullUrl,
          source: 'pharmeasy'
        });
      }
    });

    // Fallback: try alternative selectors if none found
    if (products.length === 0) {
      $('div[class*="product"], div[class*="card"]').each((index, element) => {
        if (index >= 5) return false;

        const element = $(element);
        const text = element.text().trim();
        if (text.length > 10 && text.length < 100) { // Likely a product name
          const priceMatch = text.match(/₹\s*[\d,]+/);
          const price = priceMatch ? extractPrice(priceMatch[0]) : 0;

          const img = element.find('img');
          const imageUrl = img.attr('src') || img.attr('data-src') || '';

          const link = element.find('a');
          const productUrl = link.attr('href') || '';
          const fullUrl = productUrl.startsWith('http') ? productUrl :
                         (productUrl.startsWith('/') ? `https://pharmeasy.in${productUrl}` : '');

          if (imageUrl || price > 0) {
            products.push({
              name: text.split('\n')[0].trim(),
              price,
              imageUrl,
              productUrl: fullUrl,
              source: 'pharmeasy'
            });
          }
        }
      });
    }

    logger.info(`Found ${products.length} products on PharmEasy for query: ${query}`);
    return products;
  } catch (error) {
    logger.error(`Error scraping PharmEasy for ${query}:`, error.message);
    return [];
  }
}

/**
 * Scrape Netmeds for medicine information
 */
async function scrapeNetmeds(query: string) {
  logger.info(`Scraping NetMeds for query: ${query}`);
  const searchUrl = `https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(query)}/all`;

  try {
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    const products: any[] = [];

    // Netmeds product card selectors
    $('.product-card, .product-list-item, .catgItem').each((index, element) => {
      if (index >= 5) return false; // Limit to first 5 results

      const element = $(element);
      const nameElem = element.find('.product-title, .product-name, h3, h4');
      const priceElem = element.find('.price, .final-price, .offer-price');
      const imageElem = element.find('img');
      const linkElem = element.find('a');

      const name = nameElem.text().trim() ||
                  element.find('[class*="title"]').text().trim() ||
                  element.find('h3').text().trim();

      const priceText = priceElem.text().trim() ||
                       element.find('[class*="price"]').text().trim();
      const price = priceText ? extractPrice(priceText) : 0;

      const imageUrl = imageElem.attr('src') ||
                      imageElem.attr('data-src') ||
                      imageElem.attr('data-original') ||
                      '';

      const productUrl = linkElem.attr('href') || '';
      const fullUrl = productUrl.startsWith('http') ? productUrl :
                     (productUrl.startsWith('/') ? `https://www.netmeds.com${productUrl}` : '');

      if (name && name.length > 3) {
        products.push({
          name,
          price,
          imageUrl,
          productUrl: fullUrl,
          source: 'netmeds'
        });
      }
    });

    // Fallback for Netmeds
    if (products.length === 0) {
      $('div[class*="product"], div[class*="item"]').each((index, element) => {
        if (index >= 5) return false;

        const element = $(element);
        const text = element.text().trim();
        if (text.length > 10 && text.length < 150) {
          const priceMatch = text.match(/₹\s*[\d,]+/);
          const price = priceMatch ? extractPrice(priceMatch[0]) : 0;

          const img = element.find('img');
          const imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-original') || '';

          const link = element.find('a');
          const productUrl = link.attr('href') || '';
          const fullUrl = productUrl.startsWith('http') ? productUrl :
                         (productUrl.startsWith('/') ? `https://www.netmeds.com${productUrl}` : '');

          if (imageUrl || price > 0) {
            products.push({
              name: text.split('\n')[0].trim(),
              price,
              imageUrl,
              productUrl: fullUrl,
              source: 'netmeds'
            });
          }
        }
      });
    }

    logger.info(`Found ${products.length} products on NetMeds for query: ${query}`);
    return products;
  } catch (error) {
    logger.error(`Error scraping NetMeds for ${query}:`, error.message);
    return [];
  }
}

/**
 * Scrape detailed medicine information from product page
 */
async function scrapeMedicineDetails(url: string, source: string) {
  logger.info(`Scraping medicine details from ${url}`);

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);

    // Extract common information
    const name = $('.product-title, h1, .product-name').first().text().trim() ||
                 $('h1').first().text().trim();

    const priceText = $('.price, .sale-price, .final-price, .offer-price').first().text().trim() ||
                     $('.price-box .price]').first().text().trim();
    const price = priceText ? extractPrice(priceText) : 0;

    // Extract image
    let imageUrl = '';
    const imgSelectors = [
      '.product-image img',
      '.main-image img',
      '.image-container img',
      'img[class*="product"]',
      '.product-detail-image img'
    ];

    for (const selector of imgSelectors) {
      const img = $(selector).first();
      if (img.length) {
        imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-original') || '';
        if (imageUrl) break;
      }
    }

    // If still no image, try any img with reasonable dimensions
    if (!imageUrl) {
      $('img').each((_, img) => {
        const src = $(img).attr('src') || '';
        if (src && (src.includes('product') || src.includes('medicine') || src.length > 50)) {
          imageUrl = src;
          return false; // break
        }
      });
    }

    // Extract description
    let description = '';
    const descSelectors = [
      '.product-description',
      '.description',
      '[role="tabpanel"]',
      '.product-details',
      '#description'
    ];

    for (const selector of descSelectors) {
      const desc = $(selector).first().text().trim();
      if (desc && desc.length > 50) {
        description = desc.substring(0, 500); // Limit length
        break;
      }
    }

    // Extract composition/ingredients
    let composition = '';
    const compSelectors = [
      '.composition',
      '.ingredients',
      '.salt-composition',
      '[contains(text(),"Composition")]',
      '[contains(text(),"Ingredients")]'
    ];

    for (const selector of compSelectors) {
      const elem = $(selector);
      if (elem.length) {
        // Get next sibling or parent text
        composition = elem.next().text().trim() ||
                     elem.parent().next().text().trim() ||
                     elem.text().replace(/^(Composition|Ingredients):/i, '').trim();
        if (composition && composition.length > 5) break;
      }
    }

    // Extract uses/benefits
    let uses = '';
    const usesSelectors = [
      '.uses',
      '.benefits',
      '[contains(text(),"Uses")]',
      '[contains(text(),"Benefits")]',
      '.product-benefits'
    ];

    for (const selector of usesSelectors) {
      const elem = $(selector);
      if (elem.length) {
        uses = elem.next().text().trim() ||
               elem.parent().next().text().trim() ||
               elem.text().replace(/^(Uses|Benefits):/i, '').trim();
        if (uses && uses.length > 5) break;
      }
    }

    // Extract dosage
    let dosage = '';
    const dosageSelectors = [
      '.dosage',
      '.direction-for-use',
      '[contains(text(),"Dosage")]',
      '[contains(text(),"Direction")]'
    ];

    for (const selector of dosageSelectors) {
      const elem = $(selector);
      if (elem.length) {
        dosage = elem.next().text().trim() ||
                 elem.parent().next().text().trim() ||
                 elem.text().replace(/^(Dosage|Direction):/i, '').trim();
        if (dosage && dosage.length > 5) break;
      }
    }

    // Extract side effects
    let sideEffects = '';
    const sideEffectSelectors = [
      '.side-effects',
      '.adverse-reactions',
      '[contains(text(),"Side effects")]',
      '[contains(text(),"Adverse")]'
    ];

    for (const selector of sideEffectSelectors) {
      const elem = $(selector);
      if (elem.length) {
        sideEffects = elem.next().text().trim() ||
                     elem.parent().next().text().trim() ||
                     elem.text().replace(/^(Side effects|Adverse):/i, '').trim();
        if (sideEffects && sideEffects.length > 5) break;
      }
    }

    return {
      name: name || '',
      price: price || 0,
      imageUrl: imageUrl || '',
      description: description || 'Medicine description not available',
      composition: composition ? [composition] : [],
      uses: uses ? [uses] : [],
      dosage: dosage || undefined,
      sideEffects: sideEffects ? [sideEffects] : [],
      sourceUrl: url,
      source
    };
  } catch (error) {
    logger.error(`Error scraping medicine details from ${url}:`, error.message);
    return {
      name: '',
      price: 0,
      imageUrl: '',
      description: 'Failed to fetch description',
      composition: [],
      uses: [],
      dosage: undefined,
      sideEffects: [],
      sourceUrl: url,
      source
    };
  }
}

/**
 * Convert scraped product to medicine input format
 */
function createMedicineInput(product: any, detailedInfo: any): any {
  // Determine category based on name or description
  const categoryGroup = 'medicine'; // Default
  let medicineType = 'tablet'; // Default

  const nameLower = (product.name || '').toLowerCase();
  const descLower = (detailedInfo.description || '').toLowerCase();

  // Determine medicine type based on name
  if (nameLower.includes('tablet') || nameLower.includes('tab')) {
    medicineType = 'tablet';
  } else if (nameLower.includes('capsule') || nameLower.includes('cap')) {
    medicineType = 'capsule';
  } else if (nameLower.includes('syrup') || nameLower.includes('syp')) {
    medicineType = 'syrup';
  } else if (nameLower.includes('injection') || nameLower.includes('inj')) {
    medicineType = 'injection';
  } else if (nameLower.includes('ointment') || nameLower.includes('cream') || nameLower.includes('oint')) {
    medicineType = 'ointment';
  } else if (nameLower.includes('drops') || nameLower.includes('drop')) {
    medicineType = 'drops';
  } else if (nameLower.includes('inhaler') || nameLower.includes('inh')) {
    medicineType = 'inhaler';
  }

  // Determine if prescription required (basic heuristic)
  const prescriptionKeywords = ['antibiotic', 'steroid', 'insulin', 'warfarin', 'digoxin'];
  const prescriptionRequired = prescriptionKeywords.some(keyword =>
    nameLower.includes(keyword) || descLower.includes(keyword));

  // Default manufacturer (would need to be looked up or created)
  // For now, we'll use a placeholder

  return {
    name: product.name || 'Unknown Medicine',
    slug: (product.name || 'unknown-medicine').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    description: detailedInfo.description || 'Medicine description available from pharmacy sites',
    composition: detailedInfo.composition.length > 0 ? detailedInfo.composition : [product.name || 'Unknown'],
    uses: detailedInfo.uses.length > 0 ? detailedInfo.uses : ['As directed by physician'],
    dosage: detailedInfo.dosage,
    sideEffects: detailedInfo.sideEffects.length > 0 ? detailedInfo.sideEffects : ['Consult doctor for side effects'],
    manufacturerId: null, // Would need to lookup or create
    categoryId: null, // Would need to lookup or create
    categoryGroup,
    medicineType,
    scheduleClass: 'none', // Default, would need more sophisticated logic
    prescriptionRequired,
    isGeneric: name.toLowerCase().includes('generic') || !name.toLowerCase().includes('brand'),
    mrp: Math.max(product.price * 1.2, product.price + 10), // Estimate MRP as 20% higher than price
    sellingPrice: product.price,
    gstPercentage: 12, // Default GST for medicines
    hsnCode: '3004', // Default HSN code for medicines
    packSize: '1 unit', // Would need to extract from description
    images: detailedInfo.imageUrl ? [detailedInfo.imageUrl] : [],
    tags: [], // Would extract from metadata
    isActive: true,
    margItemCode: null
  };
}

async function main() {
  await connectDatabase();
  logger.info('Connected to database');

  try {
    // Ensure we have a default category and manufacturer
    let defaultCategory = await categoryRepository.findOne({ slug: 'general' });
    if (!defaultCategory) {
      defaultCategory = await categoryRepository.create({
        name: 'General',
        slug: 'general',
        group: 'medicine',
        isActive: true
      });
      logger.info('Created default category');
    }

    let defaultManufacturer = await manufacturerRepository.findOne({ slug: 'unknown' });
    if (!defaultManufacturer) {
      defaultManufacturer = await manufacturerRepository.create({
        name: 'Unknown',
        slug: 'unknown'
      });
      logger.info('Created default manufacturer');
    Created default manufacturer');
    }

    // Define list of medicines to scrape (common medicines)
    const queries = [
      'paracetamol',
      'amoxicillin',
      'cetirizine',
      'atorvastatin',
      'omeprazole',
      'vitamin c',
      'iron folic acid',
      'metformin',
      'amlodipine',
      'salbutamol'
    ];

    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;

    for (const query of queries) {
      logger.info(`Processing query: ${query}`);

      // Scrape from both sources
      const pharmeasyProducts = await scrapePharmeasy(query);
      await delay(BASE_DELAY_MS);
      const netmedsProducts = await scrapeNetmeds(query);
      await delay(BASE_DELAY_MS);

      // Combine and deduplicate by name (simple approach)
      const allProducts = [...pharmeasyProducts, ...netmedsProducts];
      const seenNames = new Set();
      const uniqueProducts = [];

      for (const product of allProducts) {
        const nameKey = product.name.toLowerCase().trim();
        if (!seenNames.has(nameKey) && nameKey.length > 3) {
          seenNames.add(nameKey);
          uniqueProducts.push(product);
        }
      }

      logger.info(`Found ${uniqueProducts.length} unique products for query: ${query}`);

      // Process each product
      for (const product of uniqueProducts) {
        try {
          totalProcessed++;

          // Check if medicine already exists by name (approximate match)
          const existingMedicine = await medicineRepository.findOne({
            name: new RegExp(`^${product.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$')}$`, 'i')
          });

          // Get detailed information from the product page
          let detailedInfo = {
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            description: '',
            composition: [],
            uses: [],
            dosage: undefined,
            sideEffects: [],
            sourceUrl: product.productUrl,
            source: product.source
          };

          if (product.productUrl) {
            detailedInfo = await scrapeMedicineDetails(product.productUrl, product.source);
            await delay(BASE_DELAY_MS); // Be respectful with requests
          }

          // Create medicine input
          const medicineData = createMedicineInput(product, detailedInfo);
          medicineData.manufacturerId = defaultManufacturer._id;
          medicineData.categoryId = defaultCategory._id;

          if (existingMedicine) {
            // Update existing medicine
            await medicineRepository.update(existingMedicine._id.toString(), medicineData);
            totalUpdated++;
            logger.info(`Updated medicine: ${medicineData.name}`);
          } else {
            // Create new medicine
            await medicineRepository.create(medicineData as any);
            totalCreated++;
            logger.info(`Created medicine: ${medicineData.name}`);
          }
        } catch (error) {
          logger.error(`Error processing product ${product.name}:`, error.message);
          continue;
        }
      }
    }

    logger.info(`Scraping complete. Processed: ${totalProcessed}, Created: ${totalCreated}, Updated: ${totalUpdated}`);

  } catch (error) {
    logger.error('Error during scraping:', error);
  } finally {
    await disconnectDatabase();
    logger.info('Disconnected from database');
  }
}

main().catch(err => {
  logger.error('Fatal error in scrape-medicines:', err);
  process.exit(1);
});