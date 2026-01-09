import { NextRequest, NextResponse } from 'next/server';
import { generateKeyInsights } from '@/services/geminiService';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, userData } = body;

        if (!text) return NextResponse.json({ error: 'Missing transcript text' }, { status: 400 });

        // Note: geminiService.generateKeyInsights uses a generic prompt. 
        // If we need the specific "Patient Context" awareness, we might need to modify the service 
        // or pass a custom prompt via generateJson. 
        // For now, let's use the service function but prefix the text?
        // Actually, the service function just takes `text`.
        // Let's modify the service function call to include context in the text if we want.

        const textWithContext = `Patient Context: Age ${userData?.age || 'Unknown'}, Gender ${userData?.gender || 'Unknown'}. Transcript: ${text}`;

        const insights = await generateKeyInsights(textWithContext);

        return NextResponse.json({ insights });

    } catch (error: any) {
        console.error('Gemini insights error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
