import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';
import { SarvamAIClient } from 'sarvamai';
import fs from 'fs';
import path from 'path';

const assemblyClient = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY || ''
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('audio') as File;
        const language = formData.get('language') as string || 'English';

        if (!file) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        console.log(`Processing transcription request. Language: ${language}`);

        if (language === 'Malayalam') {
            console.log('Using Sarvam AI for Malayalam transcription...');

            const sarvamApiKey = process.env.SARVAM_API_KEY;
            if (!sarvamApiKey) {
                return NextResponse.json({ error: 'Sarvam API key not configured' }, { status: 500 });
            }

            // --- Sarvam AI Batch API Implementation ---
            // Create temp file
            const tempDir = path.join(process.cwd(), 'temp_uploads');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            const uniqueId = Date.now() + Math.random().toString(36).substring(7);
            const inputFilePath = path.join(tempDir, `input_${uniqueId}.wav`);
            const outputDir = path.join(tempDir, `output_${uniqueId}`);

            fs.writeFileSync(inputFilePath, buffer);

            try {
                const client = new SarvamAIClient({ apiSubscriptionKey: sarvamApiKey });

                const job = await client.speechToTextJob.createJob({
                    languageCode: "ml-IN",
                    model: "saarika:v2.5",
                    withDiarization: true,
                });

                await job.uploadFiles([inputFilePath]);
                await job.start();
                await job.waitUntilComplete();

                const fileResults = await job.getFileResults();
                if (fileResults.successful.length === 0) {
                    throw new Error(`Sarvam processing failed`);
                }

                if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
                await job.downloadOutputs(outputDir);

                const resultFiles = fs.readdirSync(outputDir);
                const jsonFile = resultFiles.find(f => f.endsWith('.json'));

                if (!jsonFile) throw new Error('No JSON output found');

                const rawData = fs.readFileSync(path.join(outputDir, jsonFile), 'utf-8');
                const data = JSON.parse(rawData);

                const text = data.transcript || '';
                let utterances = [];

                if (data.diarized_transcript && data.diarized_transcript.entries) {
                    utterances = data.diarized_transcript.entries.map((entry: any) => ({
                        speaker: (entry.speaker_id === '0' || entry.speaker_id === 0) ? 'A' : entry.speaker_id,
                        text: entry.transcript,
                        start: (entry.start_time_seconds || 0) * 1000,
                        end: (entry.end_time_seconds || 0) * 1000
                    }));
                } else {
                    utterances = [{ speaker: 'A', text: text, start: 0, end: 0 }];
                }

                return NextResponse.json({ text, utterances });

            } finally {
                // Cleanup
                try {
                    if (fs.existsSync(inputFilePath)) fs.unlinkSync(inputFilePath);
                    if (fs.existsSync(outputDir)) {
                        fs.rmSync(outputDir, { recursive: true, force: true });
                    }
                } catch (e) { console.error('Cleanup error', e) }
            }
        }

        // Default: AssemblyAI
        console.log('Using AssemblyAI for transcription...');
        // AssemblyAI SDK supports buffer? Use Audio URL
        // Actually, upload to AssemblyAI first is better or send base64
        // The SDK might accept buffer directly or I can send base64 data url.
        // Original server sent base64 data url.

        const base64Audio = buffer.toString('base64');
        const mimeType = file.type || 'audio/wav'; // Fallback
        const dataUrl = `data:${mimeType};base64,${base64Audio}`;

        const transcript = await assemblyClient.transcripts.transcribe({
            audio: dataUrl,
            speaker_labels: true,
            language_detection: true,
        });

        if (transcript.status === 'error') {
            throw new Error(`Transcription failed: ${transcript.error}`);
        }

        const utterances = (transcript.utterances || []).map(u => ({
            speaker: u.speaker,
            text: u.text,
            start: u.start,
            end: u.end
        }));

        return NextResponse.json({
            text: transcript.text || '',
            utterances
        });

    } catch (error: any) {
        console.error('Transcription error:', error);
        return NextResponse.json({ error: error.message || 'Failed to transcribe' }, { status: 500 });
    }
}
