

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
        // 1. Start Transcription Job (Async)
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('language', language);

        console.log('[Client] Starting Transcription Job...');
        const startResponse = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
        });

        if (!startResponse.ok) {
            const err = await startResponse.json();
            throw new Error(err.error || 'Transcription start failed');
        }

        const startData = await startResponse.json();

        let text = '';
        let utterances: any[] = [];

        // 2. Poll for Completion using Job ID
        if (startData.status === 'processing' && startData.jobId) {
            console.log(`[Client] Job Started: ${startData.jobId}. Polling...`);

            const jobId = startData.jobId;
            const outputUri = startData.outputUri; // Needed for fetching GCS result
            const useLLM = startData.useLLMDiarization; // Needed to re-trigger correct logic on server if needed (though server has it in params)

            let attempts = 0;
            const maxAttempts = 60; // 2 minutes (2s * 60)

            while (attempts < maxAttempts) {
                // Wait 2s
                await new Promise(resolve => setTimeout(resolve, 2000));

                const pollUrl = `/api/transcribe?jobId=${encodeURIComponent(jobId)}&outputUri=${encodeURIComponent(outputUri)}&language=${encodeURIComponent(language)}&useLLM=${useLLM}`;
                const pollResponse = await fetch(pollUrl);

                if (!pollResponse.ok) {
                    // Try to parse specific error or just throw
                    const errText = await pollResponse.text();
                    throw new Error(`Polling failed: ${pollResponse.status} ${errText}`);
                }

                const pollData = await pollResponse.json();

                if (pollData.status === 'completed') {
                    console.log('[Client] Job Completed!');
                    text = pollData.text;
                    utterances = pollData.utterances;
                    break;
                } else if (pollData.error) {
                    throw new Error(pollData.error);
                }

                attempts++;
                if (attempts % 5 === 0) console.log(`[Client] Still processing... (${attempts * 2}s)`);
            }

            if (!text) throw new Error('Transcription timed out or failed to return text.');

        } else {
            // Fallback if somehow it returned immediately (e.g. cached or short path if we kept it)
            // But our current POST always returns processing.
            text = startData.text;
            utterances = startData.utterances;
        }

        if (!text) throw new Error('No transcript generated');

        // 3. Generate SOAP
        console.log('[Client] Generating SOAP Note...');
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
