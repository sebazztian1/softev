function escapePdfText(input: string): string {
  return input
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const result: string[] = [];
  let line = '';
  for (const word of words) {
    if (!line) {
      line = word;
    } else if (line.length + 1 + word.length <= maxChars) {
      line += ' ' + word;
    } else {
      result.push(line);
      line = word;
    }
  }
  if (line) result.push(line);
  return result.length ? result : [''];
}

export function generateAcademicPdfBlob(params: {
  title: string;
  subtitle: string;
  lines: string[];
}): Blob {
  const streamCommands: string[] = [
    'BT',
    '/F2 14 Tf',
    '54 760 Td',
    `(${escapePdfText('INSTITUT SAINS DAN TEKNOLOGI TERPADU SURABAYA (ISTTS)')}) Tj`,
    '0 -22 Td',
    '/F2 12 Tf',
    `(${escapePdfText(params.title)}) Tj`,
    '0 -16 Td',
    '/F1 10 Tf',
    `(${escapePdfText(params.subtitle)}) Tj`,
    '0 -14 Td',
    `(${escapePdfText('----------------------------------------------------------------------------------------')}) Tj`,
    '0 -18 Td',
  ];

  let remainingY = 670;
  for (const rawLine of params.lines) {
    const wrapped = wrapText(rawLine, 84);
    for (const part of wrapped) {
      if (remainingY < 70) break;
      streamCommands.push(`(${escapePdfText(part)}) Tj`);
      streamCommands.push('0 -15 Td');
      remainingY -= 15;
    }
    if (remainingY < 70) break;
  }

  streamCommands.push('ET');
  const contentStream = streamCommands.join('\n');

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}
