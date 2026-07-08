import axios from 'axios';
import { load } from 'cheerio';

const searchUrl = 'https://pharmeasy.in/search/all?name=paracetamol';
console.log('Fetching search page:', searchUrl);
axios.get(searchUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
}).then(async ({ data }) => {
  const $ = load(data);
  // Find product containers
  const containers = $('div.ProductCard_medicineUnitContainer__m2_zO');
  console.log('Found containers:', containers.length);
  if (containers.length === 0) {
    console.log('No containers found');
    return;
  }
  // Get first container
  const first = containers.first();
  // Find link inside container (maybe the container is wrapped in a link)
  let link = first.find('a').first();
  if (!link || !link.attr('href')) {
    //maybe the container itself is a link? check if it's inside an a
    link = first.closest('a');
  }
  const href = link.attr('href');
  console.log('First product link href:', href);
  let productUrl = '';
  if (href.startsWith('http')) {
    productUrl = href;
  } else if (href.startsWith('/')) {
    productUrl = `https://pharmeasy.in${href}`;
  } else {
    productUrl = `https://pharmeasy.in/${href}`;
  }
  console.log('Product URL:', productUrl);
  // Fetch product page
  const { data: productData } = await axios.get(productUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  const $$ = load(productData);
  console.log('Product page title:', $$('title').text());
  // Look for description: maybe in a div with class containing description or tab content
  // Let's find all text and see if we can find dosage etc.
  // We'll search for common labels like 'Dosage', 'Description', 'Composition'
  const text = $$.text();
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  console.log('First 20 lines of text:');
  lines.slice(0, 20).forEach((l, i) => {
    console.log(`${i}: ${l}`);
  });
  // Look for elements with specific class names
  // Try to find a section with description
  const descSelectors = ['.product-description', '.description', '[class*="description"]', '[class*="desc"]'];
  for (const sel of descSelectors) {
    const el = $$(sel);
    if (el.length) {
      console.log(`Found description with selector ${sel}: length ${el.length}`);
      console.log('Sample text:', el.first().text().substring(0, 200));
      break;
    }
  }
  // Look for dosage
  const dosageSelectors = ['[class*="dosage"]', '[class*="dose"]', '.dosage', '.dose'];
  for (const sel of dosageSelectors) {
    const el = $$(sel);
    if (el.length) {
      console.log(`Found dosage with selector ${sel}: length ${el.length}`);
      console.log('Sample text:', el.first().text().substring(0, 200));
      break;
    }
  }
  // Look for composition
  const compSelectors = ['[class*="composition"]', '.composition'];
  for (const sel of compSelectors) {
    const el = $$(sel);
    if (el.length) {
      console.log(`Found composition with selector ${sel}: length ${el.length}`);
      console.log('Sample text:', el.first().text().substring(0, 200));
      break;
    }
  }
  // Look for images
  const imgs = $$('img');
  console.log('Total images:', imgs.length);
  if (imgs.length > 0) {
    console.log('First image src:', imgs.first().attr('src'));
    console.log('Second image src:', imgs.eq(1).attr('src'));
  }
}).catch(err => {
  console.error('Error:', err.message);
});
