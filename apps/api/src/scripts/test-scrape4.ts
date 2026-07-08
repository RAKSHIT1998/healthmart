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
  const containers = $('div.ProductCard_medicineUnitContainer__m2_zO');
  console.log('Found containers:', containers.length);
  if (containers.length === 0) return;
  const first = containers.first();
  let link = first.find('a').first();
  if (!link || !link.attr('href')) link = first.closest('a');
  const href = link.attr('href');
  let productUrl = '';
  if (href.startsWith('http')) productUrl = href;
  else if (href.startsWith('/')) productUrl = `https://pharmeasy.in${href}`;
  else productUrl = `https://pharmeasy.in/${href}`;
  console.log('Product URL:', productUrl);
  const { data: productData } = await axios.get(productUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  const $$ = load(productData);
  // Look for JSON-LD scripts
  const jsonldScripts = $$('script[type="application/ld+json"]');
  console.log('Found JSON-LD scripts:', jsonldScripts.length);
  jsonldScripts.each((i, el) => {
    try {
      const json = $$(el).html();
      const parsed = JSON.parse(json);
      console.log(`JSON-LD ${i}:`, JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(`Failed to parse JSON-LD ${i}:`, e.message);
    }
  });
  // Look for meta description
  const metaDesc = $$('meta[name="description"]').attr('content');
  console.log('Meta description:', metaDesc);
  // Look for product name from h1
  const h1 = $$('h1').first().text().trim();
  console.log('H1:', h1);
  // Look for price
  const priceSelectors = ['.price', '.mrp', '[class*="price"]'];
  for (const sel of priceSelectors) {
    const el = $$(sel).first();
    if (el.length) {
      console.log(`Price selector ${sel}:`, el.text().trim());
      break;
    }
  }
  // Look for image from og:image or twitter:image
  const ogImage = $$('meta[property="og:image"]').attr('content');
  console.log('OG image:', ogImage);
  // Look for sections with headings
  const headings = $$('h2, h3');
  headings.each((i, el) => {
    const $$el = $$(el);
    const text = $$el.text().trim();
    if (/uses|side\s*effect|dosage|composition|storage/i.test(text)) {
      console.log(`Heading ${i}: ${text}`);
      // Get next element until next heading
      let next = $$el.next();
      let collected = '';
      while (next.length && !next.is('h2, h3')) {
        collected += next.text() + ' ';
        next = next.next();
      }
      console.log(`  Content snippet:`, collected.substring(0, 200));
    }
  });
}).catch(err => {
  console.error('Error:', err.message);
});
