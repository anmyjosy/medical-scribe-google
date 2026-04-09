// src/services/aiService.ts
import { convertToWavBlobs } from '@/utils/audioUtils';

const API_BASE_URL = '';

export const generateKeyInsights = async (text: string): Promise<string[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/generate-insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        return data.insights || [];
    } catch (error: any) {
        console.error('Groq service error:', error);
        return [`Analysis failed: ${error.message}`];
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
        return text; 
    }
};

/**
 * NEW CHUNKED CONSULTATION PROCESSOR
 * Handles audio > 60s by splitting into 55s segments
 */
export const processConsultation = async (audioBlob: Blob, language: string = 'ml-IN'): Promise<{ soapNote: any, utterances: any[], fullText: string }> => {
    try {
        let blobs: Blob[] = [audioBlob];
        const CHUNK_DURATION_SEC = 55;

        // 1. Slice audio into 55-second WAV chunks 
        console.log(`[Client] Chunking audio (max ${CHUNK_DURATION_SEC}s per segment)...`);
        try {
            blobs = await convertToWavBlobs(audioBlob, CHUNK_DURATION_SEC);
            console.log(`[Client] Generated ${blobs.length} chunks.`);
        } catch (err) {
            console.warn('[Client] Chunking failed, sending as single file.', err);
        }

        let fullText = '';
        let allUtterances: any[] = [];

        // 2. Process chunks sequentially to stay under the 60s limit per request
        for (let i = 0; i < blobs.length; i++) {
            const chunkBlob = blobs[i];
            console.log(`[Client] Transcribing segment ${i + 1}/${blobs.length}...`);
            
            const formData = new FormData();
            formData.append('audio', chunkBlob);
            formData.append('language', language);

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || `Failed on chunk ${i + 1}`);
            }

            const data = await response.json();
            
            // Accumulate transcript text
            if (data.text) {
                fullText += (fullText ? ' ' : '') + data.text;
            }

            // Sync timestamps by adding the time offset for this chunk
            if (data.utterances && Array.isArray(data.utterances)) {
                const timeOffset = i * CHUNK_DURATION_SEC * 1000;
                const shifted = data.utterances.map((u: any) => ({
                    ...u,
                    start: u.start + timeOffset,
                    end: u.end + timeOffset
                }));
                allUtterances = allUtterances.concat(shifted);
            }
        }

        if (!fullText) throw new Error('No transcript was generated.');

        // 3. Generate Clinical SOAP Note
        console.log('[Client] Generating SOAP Note...');
        const soapResponse = await fetch('/api/generate-soap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: fullText, utterances: allUtterances })
        });

        if (!soapResponse.ok) {
            const err = await soapResponse.json();
            throw new Error(err.error || 'SOAP generation failed');
        }

        const soapNote = await soapResponse.json();

        return {
            soapNote,
            utterances: allUtterances,
            fullText: fullText
        };

    } catch (error) {
        console.error('Process Consultation Error:', error);
        throw error;
    }
};
