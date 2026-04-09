export async function convertToWavBlobs(blob: Blob, chunkDurationSec: number = 55): Promise<Blob[]> {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const numOfChan = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const totalSamples = audioBuffer.length;
    const samplesPerChunk = chunkDurationSec * sampleRate;
    
    const blobs: Blob[] = [];

    for (let startOffset = 0; startOffset < totalSamples; startOffset += samplesPerChunk) {
        const chunkSamples = Math.min(samplesPerChunk, totalSamples - startOffset);
        const length = chunkSamples * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        let pos = 0;

        const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
        const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };
        
        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8);
        setUint32(0x45564157); // "WAVE"
        setUint32(0x20746d66); // "fmt "
        setUint32(16);
        setUint16(1); // PCM
        setUint16(numOfChan);
        setUint32(sampleRate);
        setUint32(sampleRate * 2 * numOfChan);
        setUint16(numOfChan * 2);
        setUint16(16);
        setUint32(0x61746164); // "data"
        setUint32(length - pos - 4);

        for(let i = 0; i < chunkSamples; i++) {
            for(let c = 0; c < numOfChan; c++) {
                let sample = audioBuffer.getChannelData(c)[startOffset + i];
                sample = Math.max(-1, Math.min(1, sample));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(pos, sample, true); 
                pos += 2;
            }
        }
        
        blobs.push(new Blob([buffer], { type: 'audio/wav' }));
    }
    
    return blobs;
}
