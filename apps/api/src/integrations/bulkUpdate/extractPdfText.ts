import path from 'path';
import { pathToFileURL } from 'url';

// pdfjs-dist v4 ships ESM-only builds (.mjs). This backend compiles to CommonJS, and `tsc`
// downlevels a plain `await import(...)` into `require(...)`, which can't load an .mjs file
// and breaks at runtime under the compiled build (works under tsx in dev, fails under `node
// dist/server.js` in prod — verified). Routing through `new Function` keeps the import truly
// dynamic so it isn't rewritten, which is the standard workaround for this CJS/ESM gap.
// eslint-disable-next-line no-new-func
const dynamicImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string,
) => Promise<typeof import('pdfjs-dist/legacy/build/pdf.mjs')>;

const standardFontDataUrl = pathToFileURL(
  path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts/'),
).href;

/** Extracts plain text (page by page, newline-joined) from a PDF buffer using pdfjs-dist directly. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjsLib = await dynamicImport('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    standardFontDataUrl,
  }).promise;

  try {
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      // Text items only carry their own run of text; pdfjs marks the run that ends a visual
      // line with `hasEOL`. Joining everything with a single space (ignoring that flag)
      // collapses every row of a tabular PDF onto one line, which silently breaks row-per-line
      // parsing — so a real newline has to be inserted wherever hasEOL is set.
      for (const item of content.items) {
        if (!('str' in item)) continue;
        text += item.str;
        text += item.hasEOL ? '\n' : ' ';
      }
      text += '\n';
    }
    return text;
  } finally {
    await doc.destroy();
  }
}
