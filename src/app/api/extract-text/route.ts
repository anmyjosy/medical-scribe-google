import { NextRequest, NextResponse } from 'next/server';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mammoth = require('mammoth');
const pdf = require('pdf-parse');

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const mimetype = file.type;
        const originalName = file.name;
        let text = '';

        console.log(`Extracting text from: ${originalName} (${mimetype})`);

        if (mimetype === 'application/pdf') {
            try {
                // pdf-parse v1.1.1 usage
                const data = await pdf(buffer);
                text = data.text;

                // Clean up excessive whitespace often found in PDF extraction
                text = text.replace(/\n\s*\n/g, '\n\n').trim();
            } catch (e: any) {
                console.error("PDF Parse error:", e);
                throw new Error(`Failed to parse PDF: ${e.message}`);
            } // End try/catch for PDF
        } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // docx
            try {
                const result = await mammoth.extractRawText({ buffer: buffer });
                text = result.value;
            } catch (e: any) {
                console.error("Mammoth error:", e);
                throw new Error("Failed to parse DOCX");
            }
        } else {
            if (mimetype.startsWith('text/')) {
                text = buffer.toString('utf-8');
            } else {
                console.log("Skipping text extraction for unsupported type:", mimetype);
                return NextResponse.json({ text: "" });
            }
        }

        text = text.trim();
        return NextResponse.json({ text });

    } catch (error: any) {
        console.error('Text extraction error:', error);
        return NextResponse.json({ error: error.message || 'Failed to extract text' }, { status: 500 });
    }
}
