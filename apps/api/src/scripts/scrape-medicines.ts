import { connectDatabase, disconnectDatabase } from '../config/db';
import { logger } from '../config/logger';
import * as medicineService from '../services/medicine.service';
import { categoryRepository, manufacturerRepository } from '../repositories';
import axios from 'axios';
import cheerio from 'cheerio';

const BASE_DELAY_MS = 1000; // delay between requests

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapePharmeasy(query: string) {
  logger.info(`Scraping PharmEasy for query: ${query}`);
  const searchUrl = `https://pharmeasy.in/search/all?name=${encodeURIComponent(query)}`;
  const { data } = await axios.get(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  const $ = cheerio.load(data);
  // TODO: parse product cards
  // For now, return empty
  return [];
}

async function scrapeNetmeds(query: string) {
  logger.info(`Scraping NetMeds for query: ${query}`);
  const searchUrl = `https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(query)}/all`;
  const { data } = await axios.get(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  const $ = cheerio.load(data);
  // TODO: parse product cards
  return [];
}

async function scrapeMedicineDetails(url: string, source: string) {
  logger.info(`Scraping medicine details from ${url}`);
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  const $ = cheerio.load(data);
  // TODO: extract name, description, dosage, images, etc.
  // Return a partial object matching CreateMedicineInput
  return {
    name: '',
    description: '',
    dosage: '',
    // other fields with defaults
  };
}

async function main() {
  await connectDatabase();
  logger.info('Connected to database');

  try {
    // Ensure we have a default category and manufacturer
    let defaultCategory = await categoryRepository.findOne({ slug: 'general' });
    if (!defaultCategory) {
      defaultCategory = await categoryRepository.create({ name: 'General', slug: 'general', group: 'medicine', isActive: true });
      logger.info('Created default category');
    }

    let defaultManufacturer = await manufacturerRepository.findOne({ slug: 'unknown' });
    if (!defaultManufacturer) {
      defaultManufacturer = await manufacturerRepository.create({ name: 'Unknown', slug: 'unknown' });
      logger.info('Created default manufacturer');
    }

    // Define list of medicines to scrape (common medicines)
    const queries = ['paracetamol', 'amoxicillin', 'cetirizine', 'atorvastatin', 'omeprazole'];

    for (const query of queries) {
      logger.info(`Processing query: ${query}`);
      // Scrape from both sources
      const pharmeasyProducts = await scrapePharmeasy(query);
      await delay(BASE_DELAY_MS);
      const netmedsProducts = await scrapeNetmeds(query);
      await delay(BASE_DELAY_MS);

      // Combine and deduplicate (by name maybe)
      // For each product, scrape details and create medicine
      // For demonstration, we'll just log
      logger.info(`Found ${pharmeasyProducts.length} products on PharmEasy, ${netmedsProducts.length} on NetMeds`);
    }

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
