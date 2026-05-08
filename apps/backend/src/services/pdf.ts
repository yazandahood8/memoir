import PDFDocument from 'pdfkit';
import type { Chapter, Collection } from '@memoir/shared';

export function generateChapterPDF(
  chapter: Chapter,
  collection: Pick<Collection, 'name'>
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 72, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .text(collection.name, { align: 'center' });

    doc.moveDown(0.5);

    // Meta
    const generated = new Date(chapter.generated_at).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#888888')
      .text(`Generated ${generated}${chapter.word_count ? ` · ${chapter.word_count} words` : ''}`, {
        align: 'center',
      });

    doc.moveDown(1.5);

    // Divider
    doc
      .moveTo(72, doc.y)
      .lineTo(doc.page.width - 72, doc.y)
      .strokeColor('#dddddd')
      .stroke();

    doc.moveDown(1.5);

    // Chapter prose
    doc
      .fontSize(13)
      .font('Helvetica')
      .fillColor('#222222')
      .text(chapter.content, { align: 'justify', lineGap: 4 });

    doc.moveDown(2);

    // Footer
    doc
      .fontSize(9)
      .fillColor('#aaaaaa')
      .text('Created with Memoir', { align: 'center' });

    doc.end();
  });
}
