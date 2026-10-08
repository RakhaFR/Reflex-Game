export interface AnalyzedTrackBeats {
  trackId: string;
  bpm: number;
  duration: number;
  allBeats: number[]; // Exact second timestamps of detected peaks
}

const beatCache = new Map<string, AnalyzedTrackBeats>();

export async function getOrAnalyzeTrackBeats(
  trackId: string,
  audioUrl: string,
  bpm: number,
  fallbackDuration: number = 60
): Promise<AnalyzedTrackBeats> {
  const cacheKey = `${trackId}_${bpm}`;
  if (beatCache.has(cacheKey)) {
    return beatCache.get(cacheKey)!;
  }

  try {
    const beats = await analyzeAudioFromUrl(audioUrl, bpm, fallbackDuration);
    const result: AnalyzedTrackBeats = {
      trackId,
      bpm,
      duration: beats.duration || fallbackDuration,
      allBeats: beats.timestamps,
    };
    beatCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn(`[BeatDetector] Audio decode fallback to BPM grid for ${trackId}:`, err);
    const synthetic = generateSyntheticBpmBeats(bpm, fallbackDuration);
    const result: AnalyzedTrackBeats = {
      trackId,
      bpm,
      duration: fallbackDuration,
      allBeats: synthetic,
    };
    beatCache.set(cacheKey, result);
    return result;
  }
}

async function analyzeAudioFromUrl(
  audioUrl: string,
  bpm: number,
  fallbackDuration: number
): Promise<{ timestamps: number[]; duration: number }> {
  if (typeof window === "undefined") {
    return { timestamps: generateSyntheticBpmBeats(bpm, fallbackDuration), duration: fallbackDuration };
  }

  const response = await fetch(audioUrl, { mode: "cors" });
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const tempCtx = new AudioCtx();
  
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
  } finally {
    tempCtx.close().catch(() => {});
  }

  const duration = audioBuffer.duration;
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // Frame based onset detection
  const frameSize = 1024;
  const hopSize = 512;
  const numFrames = Math.floor((channelData.length - frameSize) / hopSize);
  const energies: number[] = new Float32Array(numFrames) as any;

  for (let i = 0; i < numFrames; i++) {
    const offset = i * hopSize;
    let sum = 0;
    for (let j = 0; j < frameSize; j++) {
      const val = channelData[offset + j];
      sum += val * val;
    }
    energies[i] = Math.sqrt(sum / frameSize);
  }

  // Adaptive threshold peak picking
  const windowRadius = 15;
  const multiplier = 1.35;
  const rawPeaks: number[] = [];

  for (let i = windowRadius; i < numFrames - windowRadius; i++) {
    let localSum = 0;
    for (let w = i - windowRadius; w <= i + windowRadius; w++) {
      localSum += energies[w];
    }
    const localAvg = localSum / (windowRadius * 2 + 1);
    const currentEnergy = energies[i];

    if (currentEnergy > localAvg * multiplier && currentEnergy > 0.05) {
      // Check if it's a local maximum
      let isMax = true;
      for (let w = i - 3; w <= i + 3; w++) {
        if (energies[w] > currentEnergy) {
          isMax = false;
          break;
        }
      }
      if (isMax) {
        const timeSec = (i * hopSize) / sampleRate;
        rawPeaks.push(timeSec);
      }
    }
  }

  // Quantize peaks to BPM subdivisions for musical coherence
  const beatDuration = 60 / Math.max(60, Math.min(300, bpm));
  const subGrid = beatDuration / 4; // 16th note resolution

  const quantizedBeats: number[] = [];
  let lastTime = -1;

  for (const peak of rawPeaks) {
    const snapped = Math.round(peak / subGrid) * subGrid;
    if (snapped > 0.5 && snapped < duration - 1.0) {
      if (lastTime < 0 || snapped - lastTime >= subGrid * 1.5) {
        quantizedBeats.push(Number(snapped.toFixed(3)));
        lastTime = snapped;
      }
    }
  }

  if (quantizedBeats.length < 15) {
    return {
      timestamps: generateSyntheticBpmBeats(bpm, duration),
      duration,
    };
  }

  return {
    timestamps: quantizedBeats,
    duration,
  };
}

export function generateSyntheticBpmBeats(bpm: number, duration: number): number[] {
  const beatInterval = 60 / Math.max(60, Math.min(300, bpm));
  const timestamps: number[] = [];
  const startOffset = beatInterval; // Start after 1 beat

  for (let t = startOffset; t < duration - 1.0; t += beatInterval) {
    timestamps.push(Number(t.toFixed(3)));
  }

  return timestamps;
}
