export interface ScheduledRhythmBeat {
  id: string;
  hitTimestamp: number; // Audio time in seconds when ring fully closes
  noteCount: number;
  hasBonus: boolean;
  hasAvoid: boolean;
}

export function buildRhythmChart(
  detectedBeats: number[],
  bpm: number,
  difficulty: "normal" | "medium" | "hard" | "extreme",
  duration: number
): ScheduledRhythmBeat[] {
  const beatSec = 60 / Math.max(60, Math.min(300, bpm));
  
  // Difficulty density configuration
  let minIntervalSec = 1.4;
  let maxNotes = 1;
  let bonusRate = 0.08;
  let avoidRate = 0.05;
  let subdivisionStep = 4; // Downbeats (every 4 beats)

  switch (difficulty) {
    case "normal":
      minIntervalSec = Math.max(1.3, beatSec * 2);
      maxNotes = 1;
      bonusRate = 0.06;
      avoidRate = 0.04;
      subdivisionStep = 4;
      break;
    case "medium":
      minIntervalSec = Math.max(0.75, beatSec * 1.5);
      maxNotes = 2;
      bonusRate = 0.1;
      avoidRate = 0.08;
      subdivisionStep = 2;
      break;
    case "hard":
      minIntervalSec = Math.max(0.42, beatSec * 0.85);
      maxNotes = 3;
      bonusRate = 0.14;
      avoidRate = 0.12;
      subdivisionStep = 1;
      break;
    case "extreme":
      minIntervalSec = Math.max(0.24, beatSec * 0.45);
      maxNotes = 4;
      bonusRate = 0.18;
      avoidRate = 0.15;
      subdivisionStep = 0.5;
      break;
  }

  // Filter detected timestamps to match difficulty density and pacing
  const filteredTimestamps: number[] = [];
  let lastTimestamp = -999;

  for (const time of detectedBeats) {
    if (time < 1.0 || time > duration - 1.5) continue;
    
    if (time - lastTimestamp >= minIntervalSec) {
      filteredTimestamps.push(time);
      lastTimestamp = time;
    }
  }

  // If detected beats are too sparse, backfill with quantized BPM grid
  if (filteredTimestamps.length < Math.floor(duration / (minIntervalSec * 1.8))) {
    let t = Math.max(1.2, beatSec * subdivisionStep);
    while (t < duration - 1.5) {
      if (!filteredTimestamps.some((ft) => Math.abs(ft - t) < minIntervalSec * 0.6)) {
        filteredTimestamps.push(Number(t.toFixed(3)));
      }
      t += beatSec * subdivisionStep;
    }
    filteredTimestamps.sort((a, b) => a - b);
  }

  // Build scheduled rhythm nodes
  return filteredTimestamps.map((ts, index) => {
    // Determine note count based on difficulty & combo tension
    let count = 1;
    if (maxNotes > 1) {
      const rand = Math.random();
      if (difficulty === "extreme") {
        count = rand < 0.35 ? 1 : rand < 0.7 ? 2 : rand < 0.9 ? 3 : 4;
      } else if (difficulty === "hard") {
        count = rand < 0.5 ? 1 : rand < 0.85 ? 2 : 3;
      } else if (difficulty === "medium") {
        count = rand < 0.7 ? 1 : 2;
      }
    }

    const hasBonus = Math.random() < bonusRate;
    const hasAvoid = !hasBonus && Math.random() < avoidRate;

    return {
      id: `rhythm-${index}-${ts.toFixed(2)}`,
      hitTimestamp: ts,
      noteCount: count,
      hasBonus,
      hasAvoid,
    };
  });
}
