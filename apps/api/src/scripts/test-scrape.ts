import axios from 'axios';
import { load } from 'cheerio';

const url = 'https://pharmeasy.in/search/all?name=paracetamol';
console.log('Fetching:', url);
axios.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
}).then(({ data }) => {
  console.log('Data length:', data.length);
  console.log('First 2000 chars:', data.substring(0, 2000));
  const $ = load(data);
  // Let's see if there are any divs with class containing 'product'
  const divs = $('div[class*="product"]');
  console.log('Divs with class containing product:', divs.length);
  if (divs.length > 0) {
    console.log('First such div class:', divs.first().attr('class'));
    console.log('First such div HTML snippet:', divs.first().html()?.substring(0, 500));
  }
  // Look for any links
  const links = $('a');
  console.log('Total links:', links.length);
  if (links.length > 0) {
    console.log('First link href:', links.first().attr('href'));
    console.log('First link text:', links.first().text().trim());
  }
}).catch(err => {
  console.error('Error:', err.message);
});
