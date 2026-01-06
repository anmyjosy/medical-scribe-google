

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

export const askGroq = async (prompt: string, context?: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ask-groq`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, context })
        });
        if (!response.ok) throw new Error('Failed to query Groq');
        const data = await response.json();
        return data.answer;
    } catch (error) {
        console.error('Groq Ask Error:', error);
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
