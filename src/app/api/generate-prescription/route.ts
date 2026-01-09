import { NextRequest, NextResponse } from 'next/server';
import { generatePrescription } from '@/services/geminiService';

export async function POST(req: NextRequest) {
    try {
        const { text, utterances } = await req.json();

        if (!text) return NextResponse.json({ error: 'Missing transcript text' }, { status: 400 });

        const result = await generatePrescription(text);

        return NextResponse.json({
            medications: result.medications || [],
            notes: result.notes || ''
        });

    } catch (error: any) {
        console.error('Prescription generation error:', error);
        return NextResponse.json({ error: 'Failed to generate prescription' }, { status: 500 });
    }
}
