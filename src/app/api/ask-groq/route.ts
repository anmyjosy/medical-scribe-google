import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
});

export async function POST(req: NextRequest) {
    try {
        const { prompt, context } = await req.json();
        if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

        const MAX_CONTEXT_LENGTH = 20000;
        let truncatedContext = context || '';
        if (truncatedContext.length > MAX_CONTEXT_LENGTH) {
            truncatedContext = truncatedContext.substring(0, MAX_CONTEXT_LENGTH) + '... (truncated)';
        }

        const systemContent = truncatedContext
            ? `You are a helpful medical assistant. Answer the user question based on the provided clinical context.\n\nCLINICAL CONTEXT FROM PATIENT RECORDS:\n${truncatedContext}`
            : 'You are a helpful medical assistant. Answer the user question based on the provided clinical context if available.';

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemContent },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.1-8b-instant'
        });

        return NextResponse.json({ answer: completion.choices[0]?.message?.content || 'No specific answer found.' });

    } catch (error: any) {
        console.error('Groq Q&A error:', error);
        return NextResponse.json({ error: 'AI service unavailable', details: error.message }, { status: 500 });
    }
}
