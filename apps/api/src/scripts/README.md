# Medicine Image Update Scripts

This directory contains scripts to update medicine information and images by scraping data from pharmacy websites like PharmEasy and Netmeds.

## Scripts Available

### 1. `update-medicine-images.ts`
Updates existing medicine records with better images scraped from PharmEasy and Netmeds.

**Features:**
- Finds medicines with missing or empty image arrays
- Searches PharmEast and Netmeds for each medicine
- Updates the medicine record with the best image found
- Includes rate limiting to be respectful to the source websites
- Logging for tracking progress

**Usage:**
```bash
# Make sure you have MongoDB running (either local or Atlas)
# Then run:
npm run update-medicine-images
```

### 2. `scrape-medicines.ts` (Enhanced)
Comprehensive scraping script that can:
- Search for medicines on PharmEasy and Netmeds
- Extract detailed information (name, price, description, composition, etc.)
- Create new medicine records or update existing ones
- Handle pagination and deduplication

### 3. Test Scripts
- `test-scrape.ts` - Basic test to see what PharmEasy returns
- `test-scrape2.ts`, `test-scrape3.ts`, `test-scrape4.ts` - Additional testing scripts

## Configuration

The scripts use:
- **axios** for HTTP requests
- **cheerio** for HTML parsing
- **mongoose** for MongoDB operations

Rate limiting is built-in (2 seconds between requests) to be respectful to the source websites.

## Important Notes

⚠️ **Please use responsibly:**
- These scripts are for educational and improvement purposes only
- Respect the robots.txt and terms of service of PharmEasy and Netmeds
- Consider using official APIs if available for production use
- The scraping is done with delays to minimize impact on the servers

## Expected Improvements

After running these scripts, you should see:
1. Medicine records with actual product images from pharmacy sites
2. Better accuracy in medicine representations
3. Enhanced user experience in the medicine catalog

## Troubleshooting

If you encounter issues:
1. Check that MongoDB is accessible
2. Verify network connectivity to the pharmacy sites
3. Look at the logs for specific error messages
4. The site structures may change - selectors in the scripts may need updating

## Example Output

After running the update script, medicines that previously had placeholder images (like Unsplash photos) will now have actual product photos from PharmEasy or Netmeds, making the catalog more authentic and useful.