import { generateJson } from '@/services/geminiService';
import { Utterance, Word } from './diarizationMerge';

/**
 * Uses Gemini to analyze the conversation and refine speaker labels.
 */
export async function refineSpeakerLabels(utterances: Utterance[]): Promise<Utterance[]> {
    if (!utterances || utterances.length === 0) return utterances;

    const transcriptSample = utterances.slice(0, 20).map(u => `${u.speaker}: ${u.text}`).join('\n');

    const prompt = `
    You are an expert at analyzing medical conversations.
    Below is a transcript of a consultation between a Doctor and a Patient (and possibly others).
    The current speaker labels (like "A", "B", "Speaker 1") are generic.
    Your task is to identify which speaker label corresponds to the DOCTOR and which to the PATIENT based on the dialogue context.

    TRANSCRIPT SAMPLE:
    ${transcriptSample}

    INSTRUCTIONS:
    1. Analyze the sample.
    2. Return a JSON object mapping the original speaker labels to "Doctor" or "Patient".
    3. If you are unsure or if it's not a medical conversation, map them to "Speaker 1", "Speaker 2" etc. or keep original.
    
    Example Output format:
    {
      "A": "Doctor",
      "B": "Patient"
    }
    `;

    try {
        const mapping = await generateJson(prompt);
        if (!mapping) return utterances;

        console.log('Gemini Speaker Refinement Mapping:', mapping);

        return utterances.map(u => ({
            ...u,
            speaker: mapping[u.speaker] || u.speaker
        }));

    } catch (error) {
        console.error('Error in refineSpeakerLabels:', error);
        return utterances;
    }
}

/**
 * Uses Gemini to split a continuous text into Doctor/Patient segments.
 */
export async function diarizeWithGroq(words: Word[], language: string = 'English'): Promise<Utterance[]> {
    // Kept function name 'diarizeWithGroq' for compatibility with existing import in transcribe/route.ts
    // But internally uses Gemini
    if (!words || words.length === 0) return [];

    const fullText = words.map(w => w.word).join(' ');

    const prompt = `
    You are an expert medical transcription assistant.
    I will provide a raw transcript of a consultation in ${language}.
    The transcript currently has NO speaker labels.

    Your task is to SEGMENT the text into turns for:
    - "Doctor"
    - "Patient"
    - "Caregiver" (if applicable)

    INPUT TEXT (${language}):
    "${fullText}"

    INSTRUCTIONS:
    1. Split the text into logical turns based on context.
    2. Return a JSON array of objects: { "speaker": "Doctor" | "Patient" | "Caregiver", "text": "..." }
    3. CRITICAL: Do NOT change, add, or remove words. The text in the segments must MATCH the input text exactly.
    `;

    let segments: { speaker: string; text: string }[] = [];

    try {
        const parsed = await generateJson(prompt);
        if (!parsed) throw new Error('No content from Gemini');

        segments = Array.isArray(parsed) ? parsed : (parsed.segments || parsed.turns || []);
        if (segments.length === 0) throw new Error('Empty segments returned');

    } catch (error) {
        console.error('Gemini Diarization Failed:', error);
        // Fallback
        return [{
            speaker: 'Unknown',
            text: fullText,
            start: getMs(words[0].startTime),
            end: getMs(words[words.length - 1].endTime)
        }];
    }

    // Re-align timestamps
    const utterances: Utterance[] = [];
    let wordIndex = 0;

    for (const segment of segments) {
        if (!segment.text.trim()) continue;
        const segmentWords = segment.text.split(/\s+/).filter(w => w.length > 0);
        if (segmentWords.length === 0) continue;

        const segmentStartWord = words[wordIndex];
        if (!segmentStartWord) break;

        const start = getMs(segmentStartWord.startTime);

        // Advance wordIndex
        for (const w of segmentWords) {
            wordIndex++;
        }

        const segmentEndWord = words[Math.min(wordIndex - 1, words.length - 1)];
        const end = getMs(segmentEndWord.endTime);

        utterances.push({
            speaker: segment.speaker,
            text: segment.text,
            start,
            end
        });

        if (wordIndex >= words.length) break;
    }

    return utterances;
}

function getMs(t: any): number {
    if (!t) return 0;
    if (typeof t === 'number') return t;
    if (typeof t === 'string') {
        if (t.endsWith('s')) return parseFloat(t) * 1000;
        return parseFloat(t);
    }
    const s = t.seconds ? (typeof t.seconds === 'number' ? t.seconds : parseInt(String(t.seconds))) : 0;
    const n = t.nanos ? (typeof t.nanos === 'number' ? t.nanos : parseInt(String(t.nanos))) : 0;
    return s * 1000 + n / 1000000;
}
