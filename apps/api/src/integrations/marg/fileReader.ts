import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

export type FileRow = Record<string, string>;

/** Reads a CSV or XLSX file (first sheet) into an array of header-keyed row objects. */
export function readTabularFile(filePath: string): FileRow[] {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.csv') {
    const content = fs.readFileSync(filePath, 'utf-8');
    return parse(content, { columns: true, skip_empty_lines: true, trim: true }) as FileRow[];
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json<FileRow>(sheet, { raw: false, defval: '' });
  }

  throw new Error(`Unsupported MARG sync file format: ${ext}`);
}

/** Finds the most recent file in `dir` whose name starts with `prefix` (case-insensitive). */
export function findLatestFile(dir: string, prefix: string): string | null {
  if (!fs.existsSync(dir)) return null;

  const matches = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().startsWith(prefix.toLowerCase()))
    .filter((f) => ['.csv', '.xlsx', '.xls'].includes(path.extname(f).toLowerCase()))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  return matches.length > 0 ? path.join(dir, matches[0]!.name) : null;
}

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function moveToProcessed(filePath: string, processedDir: string): void {
  ensureDir(processedDir);
  const fileName = path.basename(filePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.renameSync(filePath, path.join(processedDir, `${timestamp}-${fileName}`));
}
