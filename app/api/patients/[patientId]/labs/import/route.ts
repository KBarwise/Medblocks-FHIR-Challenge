import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { canViewClinicalData } from '@/lib/clinic/access';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import { parseLabReportText } from '@/lib/clinical/parse-lab-report';
import { extractPdfText } from '@/lib/labs/extract-pdf-text';
import { createLabImportJob } from '@/lib/labs/import-jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { patientId: string } },
) {
  if (!canViewClinicalData(getActingRoleFromCookie())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const patientId = params.patientId;
  const contentType = request.headers.get('content-type') ?? '';

  try {
    let text = '';
    let fileName = 'pasted-text.txt';
    let extractionMethod: 'pdf-text' | 'paste' = 'paste';

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      const pasted = form.get('text');

      if (file instanceof File && file.size > 0) {
        fileName = file.name;
        const buffer = Buffer.from(await file.arrayBuffer());
        if (file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
          text = await extractPdfText(buffer);
          extractionMethod = 'pdf-text';
        } else {
          text = buffer.toString('utf8');
        }
      } else if (typeof pasted === 'string' && pasted.trim()) {
        text = pasted;
      }
    } else {
      const body = (await request.json()) as { text?: string };
      text = body.text?.trim() ?? '';
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'No text could be extracted. For scanned PDFs, paste report text manually (Phase 1).' },
        { status: 400 },
      );
    }

    const rows = parseLabReportText(text);
    const jobId = randomUUID();

    createLabImportJob({
      id: jobId,
      patientId,
      fileName,
      createdAt: new Date().toISOString(),
      status: 'parsed',
      extractionMethod,
      rawTextPreview: text.slice(0, 500),
      rows,
    });

    return NextResponse.json({
      jobId,
      fileName,
      extractionMethod,
      rowCount: rows.length,
      rawTextPreview: text.slice(0, 500),
      rows,
      message:
        rows.length === 0
          ? 'No analytes matched. Review the preview and edit values manually before saving.'
          : undefined,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
