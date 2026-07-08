import axios from 'axios';
import { load } from 'cheerio';

const url = 'https://pharmeasy.in/search/all?name=paracetamol';
console.log('Fetching:', url);
axios.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
}).then(({ data }) => {
  const $ = load(data);
  // Find all elements containing the word paracetamol (case insensitive)
  const elements = $('*').filter((i, el) => {
    const text = $(el).text();
    return /paracetamol/i.test(text);
  });
  console.log('Elements containing paracetamol:', elements.length);
  if (elements.length > 0) {
    // Show first few with their tag and class
    elements.each((i, el) => {
      if (i < 5) {
        const $el = $(el);
        console.log(`${i}: tag=${el.tagName}, class=${$el.attr('class')}, text=${$el.text().substring(0, 100)}`);
      }
    });
  }
  // Now try to find product containers: maybe look for elements with data-testid or specific patterns
  const productContainers = $('div[class*="ProductCard"], div[class*="medicine-card"], div[class*="product-card"]');
  console.log('Product containers (by class):', productContainers.length);
  if (productContainers.length > 0) {
    productContainers.each((i, el) => {
      if (i < 3) {
        const $el = $(el);
        console.log(`Container ${i}: class=${$el.attr('class')}`);
        // Look for name inside
        const nameEl = $el.find('h1, h2, h3, h4, .product-name, .medicine-name, [class*="name"]');
        if (nameEl.length) {
          console.log(`  Name candidate: ${nameEl.first().text().trim()}`);
        }
        // Look for price
        const priceEl = $el.find('.price, .cost, [class*="price"], [class*="mrp"]');
        if (priceEl.length) {
          console.log(`  Price candidate: ${priceEl.first().text().trim()}`);
        }
        // Look for image
        const imgEl = $el.find('img');
        if (imgEl.length) {
          console.log(`  Image src: ${imgEl.first().attr('src')}`);
        }
      }
    });
  }
}).catch(err => {
  console.error('Error:', err.message);
});
