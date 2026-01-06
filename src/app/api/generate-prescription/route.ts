import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
});

export async function POST(req: NextRequest) {
    try {
        const { text, utterances } = await req.json();

        if (!text) return NextResponse.json({ error: 'Missing transcript text' }, { status: 400 });

        const systemPrompt = `You are an expert medical practitioner. Your task is to draft a prescription based on the consultation transcript.
        
1. **EXTRACT** any medications explicitly mentioned/prescribed by the speaker.
2. **SUGGEST** appropriate standard medications if the transcript describes a condition but no specific drugs are mentioned. Use your medical knowledge to recommend standard treatments for the identified symptoms/diagnosis.

Return a strictly formatted JSON object with the following schema:
{
  "medications": [
    {
      "name": "string",
      "dosage": "string",
      "frequency": "string",
      "duration": "string",
      "instructions": "string"
    }
  ],
  "notes": "string"
}

Important:
- 'notes' must be a SINGLE string containing diagnosis or advice. Do not return an array or object for notes.
- If a field is unknown, use an empty string "", do NOT use null.
- Ensure the JSON is valid.`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Transcript:\n${text}` }
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
        return NextResponse.json({
            medications: result.medications || [],
            notes: result.notes || ''
        });

    } catch (error: any) {
        console.error('Prescription generation error:', error);
        return NextResponse.json({ error: 'Failed to generate prescription' }, { status: 500 });
    }
}
