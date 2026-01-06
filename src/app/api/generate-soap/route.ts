import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
});

export async function POST(req: NextRequest) {
    try {
        const { text, utterances } = await req.json();

        if (!text || !utterances) {
            return NextResponse.json({ error: 'Missing text or utterances' }, { status: 400 });
        }

        const formattedConversation = utterances
            .map((u: any) => `Speaker ${u.speaker}: ${u.text}`)
            .join('\n\n');

        const systemPrompt = `You are an expert medical scribe.
Your task is to extract medical info from a consultation transcript.

CRITICAL INSTRUCTIONS:
1. **NO HALLUCINATIONS**: If a symptom, vital, or diagnosis is NOT in the transcript, DO NOT INVENT IT.
   - If the transcript is not medical (e.g., random text about "moon", "weather", or "politics"), return a JSON where the title is "Non-Medical Content" and summary is "The transcript does not contain medical information.".
2. **STRICT EXTRACTION**: 
   - Vitals: Only output numeric values if explicitly spoken. Otherwise "Not recorded".
   - Diagnosis: Only list what is discussed.
3. **LANGUAGE**: The transcript may be in Malayalam, Hindi, or English. Translate the *meaning* into professional English for the SOAP note.

Return a JSON object with this exact structure (all keys lowercase):
{
  "title": "Short title or 'Non-Medical Content'",
  "summary": "Brief summary of the medical problem. If unrelated to health, state that.",
  "objective": {
    "vitals": {
        "temperature": "38°C" or "Not recorded", 
        "bloodPressure": "120/80" or "Not recorded", 
        "pulse": "72 bpm" or "Not recorded", 
        "respiratoryRate": "16/min" or "Not recorded"
    },
    "appearance": ["alert"] or ["Not recorded"]
  },
  "assessment": "Diagnosis or 'No diagnosis'",
  "plan": "Plan or 'No plan'"
}`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Consultation Transcript:\n${formattedConversation}` }
            ],
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' }
        });

        const content = completion.choices[0]?.message?.content || '{}';

        let cleanJson = content.trim();
        if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '');
        }

        const rawResult = JSON.parse(cleanJson);

        const soapNote = {
            summary: rawResult.summary || 'Consultation overview not available.',
            subjective: {
                chiefComplaint: rawResult.subjective?.chiefComplaint || 'Not documented',
                historyOfPresentIllness: rawResult.subjective?.historyOfPresentIllness || 'Not documented'
            },
            objective: {
                vitals: {
                    temperature: rawResult.objective?.vitals?.temperature || 'Not recorded',
                    bloodPressure: rawResult.objective?.vitals?.bloodPressure || 'Not recorded',
                    pulse: rawResult.objective?.vitals?.pulse || 'Not recorded',
                    respiratoryRate: rawResult.objective?.vitals?.respiratoryRate || 'Not recorded'
                },
                appearance: rawResult.objective?.appearance || ['Not documented']
            },
            assessment: rawResult.assessment || 'Not documented',
            plan: rawResult.plan || rawResult.actionPlan || 'No specific plan documented'
        };

        return NextResponse.json(soapNote);

    } catch (error: any) {
        console.error('SOAP generation error:', error);
        return NextResponse.json({
            subjective: {
                chiefComplaint: "Patient complaint from consultation",
                historyOfPresentIllness: "Consultation text available"
            },
            objective: {
                vitals: {
                    temperature: "Not recorded",
                    bloodPressure: "Not recorded",
                    pulse: "Not recorded",
                    respiratoryRate: "Not recorded"
                },
                appearance: ["General appearance not noted"]
            },
            assessment: "Assessment based on consultation",
            plan: "Follow-up and treatment plan"
        });
    }
}
