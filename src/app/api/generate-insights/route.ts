import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, userData } = body;

        if (!text) return NextResponse.json({ error: 'Missing transcript text' }, { status: 400 });

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an expert medical consultant. Extract 3-5 concise, high-value medical insights. 

CRITICAL RULES:
1. **NO HALLUCINATION**: If the transcript contains NO medical information or is irrelevant (e.g. random text, poems), return an empty array [] or ["No medical insights found"].
2. **STRICT FACTUALITY**: Only generate insights based on what is EXPLICITLY said. Do not infer symptoms that aren't there.
3. **FOCUS**: 
   - Critical Vitals/Labs (only if stated)
   - New Diagnosis/Risks (only if stated)
   - Medication Changes
   - Immediate Action Items
4. **FORMAT**: Keep each insight under 12 words. Direct and punchy.
5. **LANGUAGE**: Parse the meaning of the input (English/Malayalam/Hindi) but output insights in English.

Return ONLY a JSON object with a property 'insights' containing an array of strings.`
                },
                {
                    role: "user",
                    content: `Patient Context: Age ${userData?.age || 'Unknown'}, Gender ${userData?.gender || 'Unknown'}, Nationality ${userData?.nationality || 'Unknown'}. Transcript: ${text}`
                }
            ],
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' }
        });

        const content = completion.choices[0]?.message?.content || '{}';

        let cleanJson = content.trim();
        if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '');
        }

        const result = JSON.parse(cleanJson);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Groq insights error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
