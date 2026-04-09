import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { v2 as SpeechV2 } from '@google-cloud/speech';
import path from 'path';
import { diarizeWithGroq } from '@/utils/geminiUtils';

// Initialize Google Cloud Clients
const getGoogleClientConfig = () => {
    // 1. Check Environment Variable (Production/Netlify)
    const envVar = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (envVar && envVar.length > 10) {
        try {
            console.log('[Auth] Found GOOGLE_SERVICE_ACCOUNT_JSON env var.');
            const credentials = JSON.parse(envVar);
            return { credentials };
        } catch (error) {
            console.error('[Auth] Error parsing GOOGLE_SERVICE_ACCOUNT_JSON:', error);
        }
    } else {
        if (!envVar) console.log('[Auth] GOOGLE_SERVICE_ACCOUNT_JSON env var not found.');
    }

    // 2. Fallback to Local File (Development)
    const localPath = path.join(process.cwd(), 'google-key.json');
    console.log('[Auth] Falling back to local file:', localPath);

    // Check if file exists to prevent crash
    try {
        const fs = require('fs');
        if (fs.existsSync(localPath)) {
            return { keyFilename: localPath };
        } else {
            console.error('[Auth] Local google-key.json not found and no Env Var set.');
            // Do not return a broken config that causes a hard crash later
            return { credentials: {} }; // Return empty to fail gracefully with "no credentials" error from Google SDK instead of file error
        }
    } catch (e) {
        console.error('[Auth] failed checking local file:', e);
        return { credentials: {} };
    }
};

const config = getGoogleClientConfig();

const storage = new Storage(config);
const googleClientV2 = new SpeechV2.SpeechClient({
    ...config,
    apiEndpoint: 'us-speech.googleapis.com'
});
const BUCKET_NAME = 'medscribe-temp-uploads';

// Helper to get or create V2 Recognizer
async function getOrCreateRecognizer(
    client: SpeechV2.SpeechClient,
    projectId: string,
    location: string,
    recognizerId: string,
    config: any
) {
    const parent = `projects/${projectId}/locations/${location}`;
    const name = `${parent}/recognizers/${recognizerId}`;

    try {
        await client.getRecognizer({ name });
        console.log(`Recognizer found: ${name}`);
        return name;
    } catch (error: any) {
        if (error.code === 5 || (error.message && error.message.includes('not found'))) {
            console.log(`Creating Recognizer: ${name}...`);
            const [operation] = await client.createRecognizer({
                parent,
                recognizerId,
                recognizer: config
            });
            await operation.promise();
            console.log(`Recognizer created: ${name}`);
            return name;
        }
        throw error;
    }
}

// --- 1. POST: Process Audio (Synchronous / No Storage) ---
export async function POST(request: NextRequest) {
    console.log('[Sync] Starting transcription request without GCS...');

    try {
        const formData = await request.formData();
        const file = (formData.get('audio') || formData.get('file')) as File;
        let language = (formData.get('language') as string) || 'en-US';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type || 'audio/wav';

        // --- LANGUAGE DETECTION ---
        const isMalayalam = language.toLowerCase().includes('malayalam') || language.toLowerCase() === 'ml-in';
        const isArabic = language.toLowerCase().includes('arabic') || language.toLowerCase().includes('ar');
        const isHindi = language.toLowerCase().includes('hindi') || language.toLowerCase().includes('hi');

        // Normalize
        if (isMalayalam) language = 'ml-IN';
        else if (isArabic) language = 'ar-BH';
        else if (isHindi) language = 'hi-IN';
        else if (!language.includes('-')) language = 'en-US';

        console.log(`[Sync] Language: ${language}, Mime: ${mimeType}`);

        const projectId = 'tenxds-agents-idp';
        const location = 'us';

        // 2. Configure Recognizer
        let recognizerName = '';
        let useLLMDiarization = false;

        if (isMalayalam) {
            useLLMDiarization = true;
            recognizerName = await getOrCreateRecognizer(googleClientV2, projectId, location, 'medscribe-malayalam-chirp-3-sync', {
                defaultRecognitionConfig: { features: { enableWordTimeOffsets: true } },
                model: 'chirp_3',
                languageCodes: ['ml-IN'],
            });
        }
        else if (isArabic) {
            useLLMDiarization = true;
            const recId = `medscribe-arabic-${language.replace('-', '').toLowerCase()}-chirp-3-sync`;
            recognizerName = await getOrCreateRecognizer(googleClientV2, projectId, location, recId, {
                defaultRecognitionConfig: { features: { enableWordTimeOffsets: true } },
                model: 'chirp_3',
                languageCodes: [language],
            });
        }
        else if (isHindi) {
            useLLMDiarization = false;
            recognizerName = await getOrCreateRecognizer(googleClientV2, projectId, location, 'medscribe-hindi-chirp-3-sync-diarization', {
                defaultRecognitionConfig: { features: { enableWordTimeOffsets: true, diarizationConfig: { minSpeakerCount: 2, maxSpeakerCount: 6 } } },
                model: 'chirp_3',
                languageCodes: ['hi-IN'],
            });
        }
        else {
            useLLMDiarization = false;
            recognizerName = await getOrCreateRecognizer(googleClientV2, projectId, location, 'medscribe-english-chirp-3-sync-diarization', {
                defaultRecognitionConfig: { features: { enableWordTimeOffsets: true, diarizationConfig: { minSpeakerCount: 2, maxSpeakerCount: 6 } } },
                model: 'chirp_3',
                languageCodes: ['en-US'],
            });
        }

        // 3. Start Sync Operation (No GCS Uploads)
        console.log(`[Sync] Calling recognize()...`);
        const syncRequest = {
            recognizer: recognizerName,
            config: { autoDecodingConfig: {} },
            content: buffer.toString('base64')
        };

        const [response] = await googleClientV2.recognize(syncRequest);

        // 4. Parse Results
        let transcriptResults = response.results || [];
        if (transcriptResults.length > 0 && (transcriptResults[0] as any).transcript?.results) {
            transcriptResults = (transcriptResults[0] as any).transcript.results;
        }

        const fullText = transcriptResults
            .map((r: any) => r.alternatives?.[0]?.transcript)
            .join(' ') || '';

        const rawWords = transcriptResults.flatMap((r: any) => r.alternatives?.[0]?.words || []);
        let utterances: any[] = [];

        // 5. Post-Processing (Diarization)
        if (useLLMDiarization) {
            // --- LLM Diarization Logic ---
            console.log(`[Sync] Running LLM Diarization...`);

            const normalizedWords = rawWords.map((w: any) => ({
                word: w.word,
                startTime: w.startOffset || w.startTime,
                endTime: w.endOffset || w.endTime
            })).sort((a: any, b: any) => getMs(a.startTime) - getMs(b.startTime));

            if (normalizedWords.length > 0) {
                const langName = isArabic ? 'Arabic' : (isMalayalam ? 'Malayalam' : 'English');
                utterances = await diarizeWithGroq(normalizedWords, langName);
            } else {
                utterances = [{ speaker: 'Speaker A', text: fullText, start: 0, end: 0 }];
            }
        } else {
            // --- Native Diarization Parsing ---
            console.log('[Sync] Parsing Native Diarization...');

            rawWords.sort((a: any, b: any) => getMs(a.startOffset || a.startTime) - getMs(b.startOffset || b.startTime));

            let currentSpeaker = '';
            let currentText: string[] = [];
            let startTime = 0;
            let endTime = 0;

            rawWords.forEach((w: any, index: number) => {
                let label = w.speakerLabel || '1';
                if (/^\d+$/.test(label)) label = `Speaker ${String.fromCharCode(64 + parseInt(label))}`;
                if (label === 'Speaker A') label = 'DOCTOR';

                const start = getMs(w.startOffset || w.startTime);
                const end = getMs(w.endOffset || w.endTime);

                if (index === 0) {
                    currentSpeaker = label;
                    startTime = start;
                }

                if (label !== currentSpeaker) {
                    utterances.push({ speaker: currentSpeaker, text: currentText.join(' '), start: startTime, end: endTime });
                    currentSpeaker = label;
                    currentText = [w.word];
                    startTime = start;
                } else {
                    currentText.push(w.word);
                }
                endTime = end;

                if (index === rawWords.length - 1) {
                    utterances.push({ speaker: currentSpeaker, text: currentText.join(' '), start: startTime, end: endTime });
                }
            });

            if (utterances.length === 0 && fullText) {
                utterances = [{ speaker: 'Speaker A', text: fullText, start: 0, end: 0 }];
            }
        }

        return NextResponse.json({ status: 'completed', text: fullText, utterances });

    } catch (error: any) {
        console.error('[Sync] POST Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to sync transcribe' }, { status: 500 });
    }
}

// Helpers
const getMs = (t: any) => {
    if (!t) return 0;
    if (typeof t === 'number') return t;
    if (typeof t === 'string') {
        if (t.endsWith('s')) return parseFloat(t) * 1000;
        return parseFloat(t);
    }
    const s = t.seconds ? (typeof t.seconds === 'number' ? t.seconds : parseInt(String(t.seconds))) : 0;
    const n = t.nanos ? (typeof t.nanos === 'number' ? t.nanos : parseInt(String(t.nanos))) : 0;
    return s * 1000 + n / 1000000;
};
