import { parse as parseCsv } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import type { CreateMedicineInput, MedicineSearchQuery, UpdateMedicineInput } from '@buymedicines/shared';
import {
  batchRepository,
  branchRepository,
  categoryRepository,
  inventoryRepository,
  manufacturerRepository,
  medicineRepository,
  reviewRepository,
} from '../repositories';
import { CategoryModel } from '../models';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';
import { getOrSetCache, invalidateCache } from '../utils/cache';

const SEARCH_CACHE_TTL_SECONDS = 45;
const DETAIL_CACHE_TTL_SECONDS = 300;

export async function searchMedicines(query: MedicineSearchQuery) {
  // Cache the catalog-metadata search (name/price/category match) — never the
  // live stock filter below, so "in stock" results can't go stale.
  const cacheKey = `medicine:search:${JSON.stringify(query)}`;
  const result = await getOrSetCache(cacheKey, SEARCH_CACHE_TTL_SECONDS, () => medicineRepository.search(query));

  if (!query.inStockOnly) return result;

  const branch = await branchRepository.findMainBranch();
  if (!branch) return result;

  const availabilityChecks = await Promise.all(
    result.items.map((item) => inventoryRepository.getAvailability(String(item._id), String(branch._id))),
  );
  const inStockItems = result.items.filter((_, idx) => availabilityChecks[idx]!.availableQuantity > 0);

  return { items: inStockItems, pagination: result.pagination };
}

export async function getMedicineBySlug(slug: string) {
  const medicine = await getOrSetCache(`medicine:slug:${slug}`, DETAIL_CACHE_TTL_SECONDS, async () => {
    const found = await medicineRepository.findBySlug(slug);
    if (!found) throw ApiError.notFound('Medicine not found');
    return found;
  });

  // findBySlug populates categoryId for the response, which replaces it with the populated
  // document — `.populated()` recovers the original raw ObjectId regardless of population state,
  // so this doesn't break when the field is populated (avoids casting the populated object itself).
  const categoryId = medicine.populated('categoryId') ?? medicine.categoryId;

  const [related, ratingAgg] = await Promise.all([
    medicineRepository.findRelated(String(medicine._id), String(categoryId)),
    reviewRepository.getAggregateRating(String(medicine._id)),
  ]);

  let availability = { totalQuantity: 0, reservedQuantity: 0, availableQuantity: 0 };
  const branch = await branchRepository.findMainBranch();
  if (branch) {
    availability = await inventoryRepository.getAvailability(String(medicine._id), String(branch._id));
  }

  return { medicine, related, rating: ratingAgg, availability };
}

async function invalidateMedicineCaches(): Promise<void> {
  await Promise.all([invalidateCache('medicine:search:*'), invalidateCache('medicine:slug:*')]);
}

export async function createMedicine(input: CreateMedicineInput) {
  const slug = input.slug ?? slugify(input.name);
  const exists = await medicineRepository.exists({ slug });
  if (exists) throw ApiError.conflict('A medicine with this slug already exists');
  const medicine = await medicineRepository.create({ ...input, slug } as never);
  await invalidateMedicineCaches();
  return medicine;
}

export async function updateMedicine(medicineId: string, input: UpdateMedicineInput) {
  const medicine = await medicineRepository.findById(medicineId);
  if (!medicine) throw ApiError.notFound('Medicine not found');
  Object.assign(medicine, input);
  await medicine.save();
  await invalidateMedicineCaches();
  return medicine;
}

export async function deactivateMedicine(medicineId: string) {
  const medicine = await medicineRepository.findById(medicineId);
  if (!medicine) throw ApiError.notFound('Medicine not found');
  medicine.isActive = false;
  await medicine.save();
  await invalidateMedicineCaches();
}

export async function getMedicineById(medicineId: string) {
  const medicine = await medicineRepository.findById(medicineId);
  if (!medicine) throw ApiError.notFound('Medicine not found');
  return medicine;
}

export interface BulkUploadResult {
  processed: number;
  skipped: number;
  failed: number;
  errors: Array<{ row: number; name: string; reason: string }>;
}

type RawRow = Record<string, string>;

function col(row: RawRow, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k] ?? row[k.toLowerCase()] ?? row[k.toUpperCase()];
    if (v !== undefined && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function numCol(row: RawRow, ...keys: string[]): number {
  return parseFloat(col(row, ...keys).replace(/[^\d.]/g, '')) || 0;
}

function parseBuffer(buffer: Buffer, originalname: string): RawRow[] {
  const ext = originalname.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'csv') {
    return parseCsv(buffer.toString('utf-8'), { columns: true, skip_empty_lines: true, trim: true }) as RawRow[];
  }
  if (ext === 'xlsx' || ext === 'xls') {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]!];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json<RawRow>(ws, { raw: false, defval: '' });
  }
  throw new Error('Unsupported file format — use .csv, .xlsx, or .xls');
}

async function getOrCreateGeneralCategory() {
  const slug = 'general';
  let cat = await CategoryModel.findOne({ slug });
  if (!cat) cat = await CategoryModel.create({ name: 'General', slug, group: 'medicine', isActive: true });
  return cat;
}

// ── MARG fixed-width stock report parser ─────────────────────────────────────
// Column layout: code(~10)  name(~40)  unit(~12)  qty  n n n n  cost  total  mrp  ptr  last  manufacturer
const MARG_LINE_RE =
  /^(\S+)\s+(.+?)\s{2,}(\S+)\s+([\d.-]+)\s+\d+\s+\d+\s+\d+\s+\d+\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(.*)/;

interface MargTextRow {
  itemCode: string;
  name: string;
  unit: string;
  qty: number;
  costPrice: number;
  mrp: number;
  manufacturer: string;
}

function parseMargTextBuffer(buffer: Buffer): MargTextRow[] {
  const rows: MargTextRow[] = [];
  for (const raw of buffer.toString('utf-8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(MARG_LINE_RE);
    if (!m) continue;
    const mrp = parseFloat(m[7]!);
    const qty = parseFloat(m[4]!);
    if (!mrp || mrp <= 0 || qty < 0) continue;
    // Manufacturer text follows the last price column; strip trailing shelf/rack codes
    const manufacturer = (m[10] ?? '').trim().replace(/\s{3,}\S.*$/, '').trim() || 'Unknown';
    rows.push({ itemCode: m[1]!.trim(), name: m[2]!.trim(), unit: m[3]!.trim(), qty, costPrice: parseFloat(m[5]!), mrp, manufacturer });
  }
  return rows;
}

function margUnitToType(unit: string): string {
  const u = unit.toUpperCase();
  if (/^TAB|^STRP|^STRI/.test(u)) return 'tablet';
  if (/^CAP/.test(u)) return 'capsule';
  if (/^SYP|^SUS|^SUSP|^SACH/.test(u)) return 'syrup';
  if (/^INJ|^INF/.test(u)) return 'injection';
  if (/^OINT|^OIN|^CRE|^GEL|^PAST/.test(u)) return 'ointment';
  if (/^DROP|^LIQ|^SOL|^LOT/.test(u)) return 'drops';
  if (/^INH|^NEBU/.test(u)) return 'inhaler';
  return 'other';
}

async function bulkUploadFromMargText(buffer: Buffer): Promise<BulkUploadResult> {
  const rows = parseMargTextBuffer(buffer);
  const result: BulkUploadResult = { processed: 0, skipped: 0, failed: 0, errors: [] };
  const defaultCategory = await getOrCreateGeneralCategory();
  const branch = (await branchRepository.findMainBranch()) ?? (await branchRepository.find({}))[0];
  const BATCH_REF = 'MARG-INITIAL';
  const expiryDate = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    try {
      const slug = slugify(row.name);
      const manufacturer = await manufacturerRepository.findOrCreateByName(row.manufacturer);

      // Find existing by MARG item code first, then by slug
      let medicine =
        (await medicineRepository.findByMargItemCode(row.itemCode)) ??
        (await medicineRepository.findBySlug(slug));

      if (!medicine) {
        medicine = await medicineRepository.create({
          name: row.name,
          slug,
          description: `${row.name} — ${row.unit}`,
          composition: [row.name],
          uses: [],
          sideEffects: [],
          manufacturerId: manufacturer._id,
          categoryId: defaultCategory._id,
          categoryGroup: 'medicine',
          medicineType: margUnitToType(row.unit),
          scheduleClass: 'none',
          prescriptionRequired: false,
          isGeneric: false,
          mrp: row.mrp,
          sellingPrice: row.mrp,
          gstPercentage: 12,
          hsnCode: '3004',
          packSize: row.unit,
          images: [],
          margItemCode: row.itemCode,
          tags: [],
          variants: [],
          alternativeMedicineIds: [],
          isActive: true,
        } as never);
        result.processed++;
      } else {
        // Update pricing if MRP changed
        if (medicine.mrp !== row.mrp) {
          medicine.mrp = row.mrp;
          if (medicine.sellingPrice > row.mrp) medicine.sellingPrice = row.mrp;
          await (medicine as any).save();
        }
        result.skipped++;
      }

      // Create/update stock batch if quantity available
      if (row.qty > 0 && branch && medicine) {
        const margBatchRef = `${BATCH_REF}:${row.itemCode}`;
        const existing = await batchRepository.findByMargBatchRef(margBatchRef);
        if (existing) {
          existing.quantityRemaining = row.qty;
          if (row.costPrice > 0) existing.costPrice = row.costPrice;
          await existing.save();
        } else {
          await batchRepository.create({
            medicineId: medicine._id,
            branchId: branch._id,
            batchNumber: BATCH_REF,
            expiryDate,
            quantityReceived: row.qty,
            quantityRemaining: row.qty,
            costPrice: row.costPrice,
            margBatchRef,
          } as never);
        }
        const batches = await batchRepository.find({ medicineId: String(medicine._id), branchId: String(branch._id) });
        const total = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);
        await inventoryRepository.setTotalQuantity(String(medicine._id), String(branch._id), total);
      }
    } catch (err) {
      result.failed++;
      result.errors.push({ row: i + 1, name: row.name, reason: (err as Error).message });
    }
  }

  if (result.processed > 0) await invalidateMedicineCaches();
  return result;
}

export async function bulkUploadMedicines(buffer: Buffer, originalname: string): Promise<BulkUploadResult> {
  const ext = (originalname.split('.').pop() ?? '').toLowerCase();
  if (ext === 'txt') return bulkUploadFromMargText(buffer);

  const rows = parseBuffer(buffer, originalname);
  const result: BulkUploadResult = { processed: 0, skipped: 0, failed: 0, errors: [] };

  const defaultCategory = await getOrCreateGeneralCategory();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rowNum = i + 2; // 1-indexed + header row

    const name = col(row, 'Name', 'name', 'ProductName', 'ItemName', 'Medicine Name', 'Product Name');
    if (!name) {
      result.failed++;
      result.errors.push({ row: rowNum, name: '(empty)', reason: 'Name column is missing or empty' });
      continue;
    }

    const mrp = numCol(row, 'MRP', 'mrp', 'M.R.P', 'MaxRetailPrice');
    const sellingPrice = numCol(row, 'Selling Price', 'SellingPrice', 'selling_price', 'Rate', 'Price', 'SalesRate');
    if (!mrp || !sellingPrice) {
      result.failed++;
      result.errors.push({ row: rowNum, name, reason: `MRP (${mrp}) or Selling Price (${sellingPrice}) is 0 or missing` });
      continue;
    }
    if (sellingPrice > mrp) {
      result.failed++;
      result.errors.push({ row: rowNum, name, reason: `Selling price (${sellingPrice}) cannot exceed MRP (${mrp})` });
      continue;
    }

    try {
      const slug = slugify(name);
      const exists = await medicineRepository.exists({ slug });
      if (exists) {
        result.skipped++;
        continue;
      }

      const manufacturerName = col(row, 'Manufacturer', 'manufacturer', 'Company', 'CompanyName', 'Brand');
      const manufacturer = manufacturerName
        ? await manufacturerRepository.findOrCreateByName(manufacturerName)
        : await manufacturerRepository.findOrCreateByName('Unknown');

      const categoryName = col(row, 'Category', 'category', 'CategoryName');
      let category = defaultCategory;
      if (categoryName) {
        const found = await CategoryModel.findOne({ name: { $regex: new RegExp(`^${categoryName}$`, 'i') } });
        if (found) category = found;
      }

      const gst = numCol(row, 'GST%', 'GST', 'GSTPercent', 'TaxPercent', 'gst') || 12;
      const packSize = col(row, 'Pack Size', 'PackSize', 'Pack', 'Unit', 'packsize') || 'N/A';
      const composition = col(row, 'Composition', 'composition', 'Salt', 'Formula') || name;
      const hsnCode = col(row, 'HSN Code', 'HSNCode', 'HSN', 'hsn') || '3004';
      const rawType = col(row, 'Medicine Type', 'MedicineType', 'Type', 'type').toLowerCase();
      const VALID_TYPES = ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler', 'device', 'other'];
      const medicineType = (VALID_TYPES.includes(rawType) ? rawType : 'other') as typeof VALID_TYPES[number];
      const rxRaw = col(row, 'Prescription Required', 'PrescriptionRequired', 'Rx', 'rx').toLowerCase();
      const prescriptionRequired = rxRaw === 'yes' || rxRaw === '1' || rxRaw === 'true';

      await medicineRepository.create({
        name,
        slug,
        description: `${name} — ${composition}`,
        composition: [composition],
        uses: [],
        sideEffects: [],
        manufacturerId: manufacturer._id,
        categoryId: category._id,
        categoryGroup: 'medicine',
        medicineType,
        scheduleClass: 'none',
        prescriptionRequired,
        isGeneric: false,
        mrp,
        sellingPrice,
        gstPercentage: gst,
        hsnCode,
        packSize,
        images: [],
        tags: [],
        variants: [],
        alternativeMedicineIds: [],
        isActive: true,
      } as never);

      result.processed++;
    } catch (err) {
      result.failed++;
      result.errors.push({ row: rowNum, name, reason: (err as Error).message });
    }
  }

  if (result.processed > 0) await invalidateMedicineCaches();
  return result;
}
