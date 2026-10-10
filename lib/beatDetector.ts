export interface AnalyzedTrackBeats {
  trackId: string;
  bpm: number;
  duration: number;
  allBeats: number[];
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
    console.warn(`[BeatDetector] Fallback to BPM grid for ${trackId}:`, err);
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
  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

  const arrayBuffer = await response.arrayBuffer();
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const tempCtx = new AudioCtx({ sampleRate: 22050 });

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
  } finally {
    tempCtx.close().catch(() => {});
  }

  const duration = audioBuffer.duration;
  const sampleRate = audioBuffer.sampleRate;

  // Mix to mono
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const mono = new Float32Array(length);
  for (let c = 0; c < numChannels; c++) {
    const ch = audioBuffer.getChannelData(c);
    for (let i = 0; i < length; i++) mono[i] += ch[i] / numChannels;
  }

  // Spectral Flux onset detection
  // Hop ~23ms, frame ~46ms at 22050hz
  const hopSize = 512;
  const frameSize = 1024;
  const numFrames = Math.floor((length - frameSize) / hopSize);

  // Simple DFT magnitude per frame using 8 frequency bands (fast, no FFT lib needed)
  // We sum high-frequency half energy changes — catches drum transients well
  const BANDS = 32;
  const binStep = Math.floor(frameSize / 2 / BANDS);

  const prevMag = new Float32Array(BANDS);
  const fluxCurve = new Float32Array(numFrames);

  for (let i = 0; i < numFrames; i++) {
    const offset = i * hopSize;
    // Compute magnitude per band using Goertzel-approximated partial DFT
    // For speed: use rectified half-wave difference of windowed RMS per band slice
    const curMag = new Float32Array(BANDS);
    for (let b = 0; b < BANDS; b++) {
      const start = offset + b * binStep;
      const end = Math.min(offset + frameSize, start + binStep);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += mono[j] * mono[j];
      }
      curMag[b] = Math.sqrt(sum / (end - start));
    }

    // Spectral flux: sum of positive magnitude differences (half-wave rectified)
    let flux = 0;
    for (let b = 0; b < BANDS; b++) {
      const diff = curMag[b] - prevMag[b];
      if (diff > 0) flux += diff;
      prevMag[b] = curMag[b];
    }
    fluxCurve[i] = flux;
  }

  // Smooth flux curve with a short window
  const smoothed = new Float32Array(numFrames);
  const smoothRadius = 3;
  for (let i = smoothRadius; i < numFrames - smoothRadius; i++) {
    let s = 0;
    for (let w = i - smoothRadius; w <= i + smoothRadius; w++) s += fluxCurve[w];
    smoothed[i] = s / (smoothRadius * 2 + 1);
  }

  // Adaptive threshold: local mean + 1.4 * local std
  const threshRadius = 40;
  const rawOnsets: number[] = [];
  const MIN_ONSET_INTERVAL_SEC = 0.08; // ~750ms / 10 = 80ms minimum between onsets
  let lastOnsetSec = -1;

  for (let i = threshRadius; i < numFrames - threshRadius; i++) {
    let mean = 0;
    let sq = 0;
    for (let w = i - threshRadius; w <= i + threshRadius; w++) {
      mean += smoothed[w];
    }
    mean /= threshRadius * 2 + 1;
    for (let w = i - threshRadius; w <= i + threshRadius; w++) {
      const d = smoothed[w] - mean;
      sq += d * d;
    }
    const std = Math.sqrt(sq / (threshRadius * 2 + 1));
    const threshold = mean + 1.4 * std;

    if (smoothed[i] > threshold && smoothed[i] > 0.002) {
      // Local maximum check in ±4 frames
      let isMax = true;
      for (let w = i - 4; w <= i + 4; w++) {
        if (w !== i && smoothed[w] >= smoothed[i]) { isMax = false; break; }
      }
      if (isMax) {
        const timeSec = (i * hopSize) / sampleRate;
        if (timeSec - lastOnsetSec >= MIN_ONSET_INTERVAL_SEC) {
          rawOnsets.push(Number(timeSec.toFixed(3)));
          lastOnsetSec = timeSec;
        }
      }
    }
  }

  // Filter onsets to valid range (exclude last 1.5s so no orphan notes)
  const validOnsets = rawOnsets.filter((t) => t >= 0.8 && t <= duration - 1.5);

  if (validOnsets.length < 12) {
    return { timestamps: generateSyntheticBpmBeats(bpm, duration), duration };
  }

  return { timestamps: validOnsets, duration };
}

export function generateSyntheticBpmBeats(bpm: number, duration: number): number[] {
  const beatInterval = 60 / Math.max(60, Math.min(300, bpm));
  const timestamps: number[] = [];
  const startOffset = beatInterval;
  for (let t = startOffset; t < duration - 1.5; t += beatInterval) {
    timestamps.push(Number(t.toFixed(3)));
  }
  return timestamps;
}
