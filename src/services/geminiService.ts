import { VertexAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';
import path from 'path';

// Helper to initialize Vertex AI client
const getVertexClient = () => {
    let project = 'premium-pulsar-483503-k0'; // Default fallback
    let location = 'us-central1';
    let credentials;

    // 1. Check Env Var (Robustly)
    const envVar = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (envVar && envVar.length > 10) {
        try {
            credentials = JSON.parse(envVar);
            if (credentials.project_id) project = credentials.project_id;
            console.log('[GeminiAuth] Vertex AI Client initialized with Env Var credentials. Project:', project);
        } catch (e) {
            console.error('[GeminiAuth] Error parsing GOOGLE_SERVICE_ACCOUNT_JSON:', e);
        }
    }

    if (credentials) {
        return new VertexAI({
            project,
            location,
            googleAuthOptions: { credentials }
        });
    }

    // 2. Fallback to local file
    const keyPath = path.join(process.cwd(), 'google-key.json');
    console.log('[GeminiAuth] Falling back to local file:', keyPath);

    // Attempt to read project_id from local file to avoid mismatch
    try {
        const fs = require('fs');
        if (fs.existsSync(keyPath)) {
            const fileContent = fs.readFileSync(keyPath, 'utf8');
            const localCreds = JSON.parse(fileContent);
            if (localCreds.project_id) {
                project = localCreds.project_id;
                console.log('[GeminiAuth] Detected Project ID from local file:', project);
            }
        }
    } catch (readError) {
        console.warn('[GeminiAuth] Could not read local google-key.json for Project ID, using default:', project);
    }

    return new VertexAI({
        project,
        location,
        googleAuthOptions: { keyFilename: keyPath }
    });
};

const vertexAI = getVertexClient();
const model = vertexAI.getGenerativeModel({
    model: 'gemini-2.5-flash', // Switched to Flash for speed/cost per user request
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
    generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.2,
    }
});

export const askGemini = async (prompt: string, context?: string): Promise<string> => {
    try {
        const fullPrompt = context
            ? `Context:\n${context}\n\nQuestion: ${prompt}`
            : prompt;

        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        return response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    } catch (error) {
        console.error('Gemini Ask Error:', error);
        throw error;
    }
};

export const generateKeyInsights = async (text: string): Promise<any> => {
    const prompt = `
    Analyze the following medical consultation transcript and extract key medical insights.
    
    Transcript:
    "${text}"

    Structure the output as a JSON object with a single key "insights", which is an array of strings.
    Each string should be a concise, factual medical insight (e.g., "Patient reports chronic migraines", "Prescribed Amoxicillin 500mg").
    
    Example JSON:
    {
      "insights": [
        "Patient has a history of asthma.",
        "Complains of wheezing and shortness of breath."
      ]
    }
    `;

    const json = await generateJson(prompt);
    return json?.insights || [];
};

export const generatePrescription = async (text: string): Promise<any> => {
    const prompt = `You are an expert medical practitioner. Your task is to draft a prescription based on the consultation transcript.
        
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
- Ensure the JSON is valid.

TRANSCRIPT:
${text}
`;
    return await generateJson(prompt);
};

export const translateText = async (text: string, targetLang: string = 'en'): Promise<string> => {
    const prompt = `
    You are a professional medical translator.
    Translate the following text into ${targetLang === 'ml' ? 'Malayalam' : targetLang}.
    
    CRITICAL FORMATTING RULES:
    1. **Maintain Original Format**: If the text is a dialogue (e.g., "Speaker A: Hello"), KEEP the speaker labels in English (e.g., "Speaker A:") and ONLY translate the content.
    2. **Timestamps**: Preserve any timestamps (e.g., [00:12]) exactly as they are.
    3. **Delimiters**: If the input text uses "|||" as a separator, YOU MUST PRESERVE these separators in the output at the exact same positions. Do not translate or remove "|||".
    4. **Accuracy**: Ensure medical terms are translated accurately or transliterated if appropriate for the target language.
    5. **Structure**: Do not merge lines or change the paragraph structure.
    
    Text to Translate:
    "${text}"
    `;
    return await askGemini(prompt);
};

export const generateJson = async (prompt: string): Promise<any> => {
    try {
        console.log('[Gemini] Generating JSON with prompt length:', prompt.length);
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            // generationConfig: { responseMimeType: 'application/json' } 
        });

        // Log full result for debugging
        // console.log('[Gemini] Raw Result:', JSON.stringify(result, null, 2));

        let responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('[Gemini] Raw Response Text:', responseText);

        if (!responseText) {
            console.warn('[Gemini] Empty response text received.');
            return null;
        }

        // Cleanup markdown code blocks if present (Gemini often adds ```json ... ```)
        responseText = responseText.replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(responseText);
    } catch (error) {
        console.error('Gemini JSON Gen Error:', error);
        return null;
    }
};
