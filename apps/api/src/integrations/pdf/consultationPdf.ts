import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { IAppointment } from '../../models/appointment.model';
import type { IDoctor } from '../../models/doctor.model';
import type { IUser } from '../../models/user.model';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

export async function generateConsultationPrescriptionPdf(
  appointment: IAppointment,
  doctor: IDoctor,
  patient: IUser,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE_HEIGHT - MARGIN;
  const drawText = (text: string, x: number, size = 10, bold = false, color = rgb(0.1, 0.1, 0.1)) => {
    page.drawText(text, { x, y, size, font: bold ? fontBold : font, color });
  };
  const lineBreak = (amount = 16) => {
    y -= amount;
  };

  drawText('Medicare Medical Store — Teleconsultation Prescription', MARGIN, 16, true, rgb(0.05, 0.4, 0.3));
  lineBreak(26);

  drawText(`Doctor: Dr. ${(doctor as unknown as { userId: { name: string } }).userId?.name ?? ''}`, MARGIN, 10, true);
  lineBreak(14);
  drawText(`${doctor.qualification} · ${doctor.specialization}`, MARGIN, 9);
  lineBreak(20);

  drawText(`Patient: ${patient.name}`, MARGIN, 10, true);
  lineBreak(14);
  if (patient.phone) {
    drawText(`Phone: ${patient.phone}`, MARGIN, 9);
    lineBreak(14);
  }
  drawText(`Consultation date: ${appointment.scheduledAt.toLocaleString('en-IN')}`, MARGIN, 9);
  lineBreak(24);

  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  lineBreak(20);

  drawText('Diagnosis', MARGIN, 11, true);
  lineBreak(16);
  const diagnosisLines = (appointment.diagnosis ?? '').match(/.{1,90}(\s|$)/g) ?? [];
  for (const line of diagnosisLines) {
    drawText(line.trim(), MARGIN, 9);
    lineBreak(13);
  }
  lineBreak(10);

  drawText('Prescribed Medicines', MARGIN, 11, true);
  lineBreak(18);

  for (const med of appointment.prescribedMedicines) {
    drawText(`• ${med.name}`, MARGIN, 10, true);
    lineBreak(13);
    if (med.dosage) {
      drawText(`  Dosage: ${med.dosage}`, MARGIN, 9);
      lineBreak(13);
    }
    if (med.instructions) {
      drawText(`  Instructions: ${med.instructions}`, MARGIN, 9);
      lineBreak(13);
    }
    lineBreak(6);
  }

  if (appointment.followUpDate) {
    lineBreak(8);
    drawText(`Follow-up recommended on: ${appointment.followUpDate.toLocaleDateString('en-IN')}`, MARGIN, 9, true);
    lineBreak(16);
  }

  lineBreak(20);
  page.drawText('This is a digitally generated prescription issued after a teleconsultation.', {
    x: MARGIN,
    y,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
