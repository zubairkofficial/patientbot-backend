// utils/audioUtils.js
import fs from 'fs';
import decodeAudio from 'audio-decode';

export const convertAudioToBuffer = async (filePath) => {
    try {
        const audioFile = fs.readFileSync(filePath);
        const audioBuffer = await decodeAudio(audioFile);
        return audioBuffer;
    } catch (error) {
        console.error('Error converting audio to buffer:', error);
        throw error;
    }
};
