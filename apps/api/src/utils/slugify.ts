export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function generateOrderNumber(): string {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `MMS-${datePart}-${randomPart}`;
}

export function generateInvoiceNumber(sequence: number): string {
  const date = new Date();
  const fy =
    date.getMonth() >= 3
      ? `${date.getFullYear()}-${String(date.getFullYear() + 1).slice(-2)}`
      : `${date.getFullYear() - 1}-${String(date.getFullYear()).slice(-2)}`;
  return `INV/${fy}/${String(sequence).padStart(6, '0')}`;
}
