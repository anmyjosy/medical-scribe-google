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
    return { keyFilename: localPath };
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

export async function POST(request: NextRequest) {
    console.log('Processing transcription request via Google Cloud Hybrid Pipeline...');

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

        // Normalize language code
        if (isMalayalam) language = 'ml-IN';
        else if (isArabic) language = 'ar-BH';
        else if (isHindi) language = 'hi-IN';
        else if (!language.includes('-')) language = 'en-US';

        console.log(`Language Identity: ${language}, Mime: ${mimeType}`);

        // 1. Upload to GCS
        const filename = `audio-${Date.now()}-${Math.random().toString(36).substring(7)}${mimeType.includes('mp3') ? '.mp3' : mimeType.includes('webm') ? '.webm' : '.wav'}`;
        const bucket = storage.bucket(BUCKET_NAME);
        const fileUpload = bucket.file(filename);
        const gcsUri = `gs://${BUCKET_NAME}/${filename}`;

        console.log(`Uploading to GCS: ${gcsUri}`);
        try {
            await fileUpload.save(buffer, { contentType: mimeType });
        } catch (err) {
            try { await bucket.create({ location: 'us' }); await fileUpload.save(buffer, { contentType: mimeType }); } catch (e) { }
        }

        let fullText = '';
        let utterances: any[] = [];

        const projectId = 'premium-pulsar-483503-k0';
        const location = 'us';

        let recognizerName = '';
        let useLLMDiarization = false;

        // --- PIPELINE SELECTION ---
        if (isMalayalam) {
            // Malayalam: Chirp 3 + LLM Diarization
            useLLMDiarization = true;
            recognizerName = await getOrCreateRecognizer(googleClientV2, projectId, location, 'medscribe-malayalam-chirp-3-batch', {
                defaultRecognitionConfig: { features: { enableWordTimeOffsets: true } },
                model: 'chirp_3',
                languageCodes: ['ml-IN'],
            });
        }
        else if (isArabic) {
            // Arabic: Chirp 3 + LLM Diarization (Per User Request)
            useLLMDiarization = true;
            // Use dynamic ID based on language to avoid stale config
            const recId = `medscribe-arabic-${language.replace('-', '').toLowerCase()}-chirp-3-batch`;
            recognizerName = await getOrCreateRecognizer(googleClientV2, projectId, location, recId, {
                defaultRecognitionConfig: { features: { enableWordTimeOffsets: true } },
                model: 'chirp_3',
                languageCodes: [language], // Use the detected/normalized language
            });
        }
        else if (isHindi) {
            // Hindi: Chirp 3 + Native Diarization (Per User Request)
            useLLMDiarization = false;
            recognizerName = await getOrCreateRecognizer(googleClientV2, projectId, location, 'medscribe-hindi-chirp-3-diarization', {
                defaultRecognitionConfig: {
                    features: {
                        enableWordTimeOffsets: true,
                        diarizationConfig: { minSpeakerCount: 2, maxSpeakerCount: 6 }
                    }
                },
                model: 'chirp_3',
                languageCodes: ['hi-IN'],
            });
        }
        else {
            // English/Others: Chirp 3 + Native Diarization
            useLLMDiarization = false;
            recognizerName = await getOrCreateRecognizer(googleClientV2, projectId, location, 'medscribe-english-chirp-3-diarization', {
                defaultRecognitionConfig: {
                    features: {
                        enableWordTimeOffsets: true,
                        diarizationConfig: { minSpeakerCount: 2, maxSpeakerCount: 6 }
                    }
                },
                model: 'chirp_3',
                languageCodes: ['en-US'],
            });
        }

        console.log(`Starting V2 BatchRecognize using ${recognizerName}... LLM Diarization: ${useLLMDiarization}`);
        const [operation] = await googleClientV2.batchRecognize({
            recognizer: recognizerName,
            config: { autoDecodingConfig: {} },
            files: [{ uri: gcsUri }],
            recognitionOutputConfig: { inlineResponseConfig: {} }
        });

        const [response] = await operation.promise();
        const fileResult = response.results ? response.results[gcsUri] : null;

        if (fileResult && fileResult.transcript) {
            // Extract Full Text
            fullText = fileResult.transcript.results
                ?.map((r: any) => r.alternatives?.[0]?.transcript)
                .join(' ') || '';

            const results = fileResult.transcript.results || [];
            const rawWords = results.flatMap((r: any) => r.alternatives?.[0]?.words || []);

            if (useLLMDiarization) {
                // --- LLM Diarization Logic (Malayalam & Arabic) ---
                const languageName = isArabic ? 'Arabic' : (isMalayalam ? 'Malayalam' : 'English');
                console.log(`Running LLM Diarization for ${languageName}...`);

                const normalizedWords = rawWords.map((w: any) => ({
                    word: w.word,
                    startTime: w.startOffset || w.startTime,
                    endTime: w.endOffset || w.endTime
                })).sort((a: any, b: any) => getMs(a.startTime) - getMs(b.startTime));

                if (normalizedWords.length > 0) {
                    utterances = await diarizeWithGroq(normalizedWords, languageName);
                } else {
                    utterances = [{ speaker: 'Speaker A', text: fullText, start: 0, end: 0 }];
                }
            } else {
                // --- Native V2 Diarization Parsing (English & Hindi) ---
                console.log('Parsing Native V2 Diarization results...');

                rawWords.sort((a: any, b: any) => getMs(a.startOffset || a.startTime) - getMs(b.startOffset || b.startTime));

                let currentSpeaker = '';
                let currentText: string[] = [];
                let startTime = 0;
                let endTime = 0;

                rawWords.forEach((w: any, index: number) => {
                    let label = w.speakerLabel || '1';
                    if (/^\d+$/.test(label)) {
                        label = `Speaker ${String.fromCharCode(64 + parseInt(label))}`; // 1->A
                    }
                    // Manual Mapping per User Request: Speaker A -> DOCTOR
                    if (label === 'Speaker A') {
                        label = 'DOCTOR';
                    }

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
        }

        // Clean up GCS
        try { await fileUpload.delete(); } catch (e) { }

        return NextResponse.json({ text: fullText, utterances });

    } catch (error: any) {
        console.error('Transcription error:', error);
        return NextResponse.json({ error: error.message || 'Failed to transcribe' }, { status: 500 });
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
