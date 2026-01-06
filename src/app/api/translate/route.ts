import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(req: NextRequest) {
    try {
        const { text, targetLanguage } = await req.json();

        // Debug log
        console.log(`[Translate API] Request for ${targetLanguage}. Text length: ${text?.length}. Key exists: ${!!process.env.GROQ_API_KEY}`);

        if (!text || !targetLanguage) {
            return NextResponse.json({ error: 'Missing text or target language' }, { status: 400 });
        }

        const prompt = `Translate the following medical text accurately into ${targetLanguage}. Maintain professional medical terminology. Return ONLY the translated text. Do not add any conversational filler.\n\nText:\n"${text}"`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a professional medical translator.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.1-8b-instant', // utilizing the faster, newer model
            temperature: 0.3,
        });

        const translatedText = completion.choices[0]?.message?.content || text;

        return NextResponse.json({ translatedText });
    } catch (error: any) {
        console.error('[Translate API] Error detail:', error);
        return NextResponse.json({ error: error.message || 'Translation failed' }, { status: 500 });
    }
}
