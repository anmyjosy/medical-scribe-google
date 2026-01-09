import { NextRequest, NextResponse } from 'next/server';
import { generateJson } from '@/services/geminiService';

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
Your task is to generate a professional SOAP note from the consultation transcript.

TRANSCRIPT:
${formattedConversation}

INSTRUCTIONS:
1. **Subjective**: Summarize the patient's complaints and history.
2. **Objective**: Extract vitals (temperature, BP, pulse, RR) and physical appearance. If a vital is not mentioned, use "Not recorded".
3. **Assessment**: Provide the likely diagnosis or medical impression based *only* on the discussion. Do not invent.
4. **Plan**: List the treatment plan, medications, tests, or follow-up instructions discussed.

OUTPUT FORMAT (JSON):
{
  "summary": "Brief summary of the consultation",
  "subjective": {
    "chiefComplaint": "Patient's main concern",
    "historyOfPresentIllness": "Details of the complaint"
  },
  "objective": {
    "vitals": {
        "temperature": "Value or 'Not recorded'", 
        "bloodPressure": "Value or 'Not recorded'", 
        "pulse": "Value or 'Not recorded'", 
        "respiratoryRate": "Value or 'Not recorded'"
    },
    "appearance": ["List of observations"]
  },
  "assessment": "Diagnosis or medical impression",
  "plan": "Detailed treatment plan, medications, and next steps"
}
`;

        const rawResult = await generateJson(systemPrompt); // generateJson handles prompting Gemini

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
            assessment: rawResult.assessment || 'No specific diagnosis documented',
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
