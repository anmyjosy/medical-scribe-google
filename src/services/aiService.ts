

const API_BASE_URL = '';

export const generateKeyInsights = async (text: string): Promise<string[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/generate-insights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data.insights || [];
    } catch (error: any) {
        console.error('Groq service error details:', error);
        return [`Groq Endpoint Failed: ${error.message || 'Connection Refused'}`];
    }
};

export const askAI = async (prompt: string, context?: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ask-ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, context })
        });
        if (!response.ok) throw new Error('Failed to query AI');
        const data = await response.json();
        return data.answer;
    } catch (error) {
        console.error('AI Ask Error:', error);
        return 'AI Service Unavailable';
    }
};

export const generatePrescription = async (text: string): Promise<{ medications: any[], notes: string }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/generate-prescription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        if (!response.ok) throw new Error('Failed to generate prescription');
        return await response.json();
    } catch (error) {
        console.error('Prescription Gen Error:', error);
        throw error;
    }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targetLanguage })
        });

        if (!response.ok) throw new Error('Translation failed');
        const data = await response.json();
        return data.translatedText;
    } catch (error) {
        console.error('Translation Error:', error);
        return text; // Fallback to original
    }
};

export const processConsultation = async (audioBlob: Blob, language: string = 'ml-IN'): Promise<{ soapNote: any, utterances: any[], fullText: string }> => {
    try {
        // 1. Transcribe
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('language', language);

        const transResponse = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
        });

        if (!transResponse.ok) {
            const err = await transResponse.json();
            throw new Error(err.error || 'Transcription failed');
        }

        const { text, utterances } = await transResponse.json();

        if (!text) throw new Error('No transcript generated');

        // 2. Generate SOAP
        const soapResponse = await fetch('/api/generate-soap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, utterances })
        });

        if (!soapResponse.ok) {
            const err = await soapResponse.json();
            throw new Error(err.error || 'SOAP generation failed');
        }

        const soapNote = await soapResponse.json();

        return {
            soapNote,
            utterances,
            fullText: text
        };

    } catch (error) {
        console.error('Process Consultation Error:', error);
        throw error;
    }
};
