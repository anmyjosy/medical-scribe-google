import { NextRequest, NextResponse } from 'next/server';
import { askGemini } from '@/services/geminiService';

export async function POST(req: NextRequest) {
    try {
        const { prompt, context } = await req.json();
        if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

        const answer = await askGemini(prompt, context);
        return NextResponse.json({ answer });

    } catch (error: any) {
        console.error('Gemini Q&A error:', error);
        return NextResponse.json({ error: 'AI service unavailable', details: error.message }, { status: 500 });
    }
}
