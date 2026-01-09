import { NextRequest, NextResponse } from 'next/server';
import { translateText } from '@/services/geminiService';

export async function POST(req: NextRequest) {
    try {
        const { text, targetLanguage } = await req.json();

        // Debug log
        console.log(`[Translate API] Request for ${targetLanguage}. Text length: ${text?.length}.`);

        if (!text || !targetLanguage) {
            return NextResponse.json({ error: 'Missing text or target language' }, { status: 400 });
        }

        const translatedText = await translateText(text, targetLanguage);

        return NextResponse.json({ translatedText });
    } catch (error: any) {
        console.error('[Translate API] Error detail:', error);
        return NextResponse.json({ error: error.message || 'Translation failed' }, { status: 500 });
    }
}
