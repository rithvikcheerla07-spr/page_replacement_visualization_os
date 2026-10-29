/**
 * Client-side implementation of Page Replacement Algorithms
 * Mirrors page-replacement-visualizer/algorithms.py exactly.
 */

export interface StepRecord {
  step: number;
  page: number;
  frames: (number | null)[];
  residentPages: number[];
  result: 'HIT' | 'FAULT';
  evicted: number | null;
  explanation: string;
  hits: number;
  faults: number;
}

export interface AlgorithmSummary {
  algorithm: 'FIFO' | 'LRU' | 'Optimal';
  frameCount: number;
  referenceString: number[];
  totalReferences: number;
  hits: number;
  faults: number;
  hitRatio: number;
  faultRatio: number;
  hitPercentage: number;
  faultPercentage: number;
  steps: StepRecord[];
}

export interface ComparisonResult {
  referenceString: number[];
  frameCount: number;
  results: Record<'FIFO' | 'LRU' | 'Optimal', AlgorithmSummary>;
  bestAlgorithms: ('FIFO' | 'LRU' | 'Optimal')[];
  minFaults: number;
  isTie: boolean;
  cumulativeTraces: {
    steps: number[];
    FIFO: number[];
    LRU: number[];
    Optimal: number[];
  };
}

export interface FrameAnalysisPoint {
  frames: number;
  fifoFaults: number;
  fifoHits: number;
  fifoHitRatio: number;
  lruFaults: number;
  lruHits: number;
  lruHitRatio: number;
  optFaults: number;
  optHits: number;
  optHitRatio: number;
}

export interface BeladyAnomaly {
  algorithm: string;
  lowerFrames: number;
  higherFrames: number;
  faultsLower: number;
  faultsHigher: number;
  difference: number;
}

export interface FrameAnalysisResult {
  maxFrames: number;
  data: FrameAnalysisPoint[];
  hasBeladyAnomaly: boolean;
  beladyAnomalies: BeladyAnomaly[];
}

function buildSummary(
  algorithm: 'FIFO' | 'LRU' | 'Optimal',
  referenceString: number[],
  frameCount: number,
  steps: StepRecord[],
  hits: number,
  faults: number
): AlgorithmSummary {
  const total = referenceString.length;
  const hitRatio = total > 0 ? hits / total : 0;
  const faultRatio = total > 0 ? faults / total : 0;

  return {
    algorithm,
    frameCount,
    referenceString: [...referenceString],
    totalReferences: total,
    hits,
    faults,
    hitRatio: Number(hitRatio.toFixed(4)),
    faultRatio: Number(faultRatio.toFixed(4)),
    hitPercentage: Number((hitRatio * 100).toFixed(2)),
    faultPercentage: Number((faultRatio * 100).toFixed(2)),
    steps,
  };
}

export function runFifo(referenceString: number[], frameCount: number): AlgorithmSummary {
  if (frameCount < 1) throw new Error('Frame count must be >= 1');
  const frames: number[] = [];
  const queue: number[] = [];
  const steps: StepRecord[] = [];
  let hits = 0;
  let faults = 0;

  referenceString.forEach((page, idx) => {
    let evicted: number | null = null;
    let result: 'HIT' | 'FAULT' = 'FAULT';
    let explanation = '';

    if (frames.includes(page)) {
      hits++;
      result = 'HIT';
      explanation = `Page ${page} is already resident in frame ${frames.indexOf(page) + 1}. No replacement needed (FIFO order unchanged).`;
    } else {
      faults++;
      result = 'FAULT';
      if (frames.length < frameCount) {
        frames.push(page);
        queue.push(page);
        explanation = `Page fault: Page ${page} loaded into empty frame ${frames.length}.`;
      } else {
        evicted = queue.shift()!;
        const evictIdx = frames.indexOf(evicted);
        frames[evictIdx] = page;
        queue.push(page);
        explanation = `Page fault: Memory full. Page ${evicted} (oldest in memory) evicted from frame ${evictIdx + 1} and replaced by page ${page}.`;
      }
    }

    const displayFrames: (number | null)[] = [...frames];
    while (displayFrames.length < frameCount) {
      displayFrames.push(null);
    }

    steps.push({
      step: idx + 1,
      page,
      frames: displayFrames,
      residentPages: [...frames],
      result,
      evicted,
      explanation,
      hits,
      faults,
    });
  });

  return buildSummary('FIFO', referenceString, frameCount, steps, hits, faults);
}

export function runLru(referenceString: number[], frameCount: number): AlgorithmSummary {
  if (frameCount < 1) throw new Error('Frame count must be >= 1');
  const frames: number[] = [];
  let recency: number[] = [];
  const steps: StepRecord[] = [];
  let hits = 0;
  let faults = 0;

  referenceString.forEach((page, idx) => {
    let evicted: number | null = null;
    let result: 'HIT' | 'FAULT' = 'FAULT';
    let explanation = '';

    if (frames.includes(page)) {
      hits++;
      result = 'HIT';
      recency = recency.filter((p) => p !== page);
      recency.push(page);
      explanation = `Page ${page} found in frame ${frames.indexOf(page) + 1} (HIT). Marked as most recently used.`;
    } else {
      faults++;
      result = 'FAULT';
      if (frames.length < frameCount) {
        frames.push(page);
        recency.push(page);
        explanation = `Page fault: Page ${page} loaded into empty frame ${frames.length}.`;
      } else {
        evicted = recency.shift()!;
        const evictIdx = frames.indexOf(evicted);
        frames[evictIdx] = page;
        recency.push(page);
        explanation = `Page fault: Memory full. Page ${evicted} (least recently used) evicted from frame ${evictIdx + 1} and replaced by page ${page}.`;
      }
    }

    const displayFrames: (number | null)[] = [...frames];
    while (displayFrames.length < frameCount) {
      displayFrames.push(null);
    }

    steps.push({
      step: idx + 1,
      page,
      frames: displayFrames,
      residentPages: [...frames],
      result,
      evicted,
      explanation,
      hits,
      faults,
    });
  });

  return buildSummary('LRU', referenceString, frameCount, steps, hits, faults);
}

export function runOptimal(referenceString: number[], frameCount: number): AlgorithmSummary {
  if (frameCount < 1) throw new Error('Frame count must be >= 1');
  const frames: number[] = [];
  const steps: StepRecord[] = [];
  let hits = 0;
  let faults = 0;

  referenceString.forEach((page, idx) => {
    let evicted: number | null = null;
    let result: 'HIT' | 'FAULT' = 'FAULT';
    let explanation = '';

    if (frames.includes(page)) {
      hits++;
      result = 'HIT';
      explanation = `Page ${page} found in frame ${frames.indexOf(page) + 1} (HIT). No replacement needed.`;
    } else {
      faults++;
      result = 'FAULT';
      if (frames.length < frameCount) {
        frames.push(page);
        explanation = `Page fault: Page ${page} loaded into empty frame ${frames.length}.`;
      } else {
        const future = referenceString.slice(idx + 1);
        let farthestPage = frames[0];
        let maxDistance = -1;

        for (const resident of frames) {
          const nextIdx = future.indexOf(resident);
          const distance = nextIdx === -1 ? Infinity : nextIdx;
          if (distance > maxDistance) {
            maxDistance = distance;
            farthestPage = resident;
          }
        }

        evicted = farthestPage;
        const evictIdx = frames.indexOf(evicted);
        frames[evictIdx] = page;

        const distanceDesc =
          maxDistance === Infinity ? 'never referenced again' : 'next needed farthest in future';
        explanation = `Page fault: Memory full. Page ${evicted} (${distanceDesc}) evicted from frame ${evictIdx + 1} and replaced by page ${page}.`;
      }
    }

    const displayFrames: (number | null)[] = [...frames];
    while (displayFrames.length < frameCount) {
      displayFrames.push(null);
    }

    steps.push({
      step: idx + 1,
      page,
      frames: displayFrames,
      residentPages: [...frames],
      result,
      evicted,
      explanation,
      hits,
      faults,
    });
  });

  return buildSummary('Optimal', referenceString, frameCount, steps, hits, faults);
}

export function runNamedAlgorithm(
  algorithm: 'FIFO' | 'LRU' | 'Optimal',
  referenceString: number[],
  frameCount: number
): AlgorithmSummary {
  switch (algorithm) {
    case 'FIFO':
      return runFifo(referenceString, frameCount);
    case 'LRU':
      return runLru(referenceString, frameCount);
    case 'Optimal':
      return runOptimal(referenceString, frameCount);
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }
}

export function compareAllAlgorithms(
  referenceString: number[],
  frameCount: number
): ComparisonResult {
  const fifoRes = runFifo(referenceString, frameCount);
  const lruRes = runLru(referenceString, frameCount);
  const optRes = runOptimal(referenceString, frameCount);

  const results = {
    FIFO: fifoRes,
    LRU: lruRes,
    Optimal: optRes,
  };

  const minFaults = Math.min(fifoRes.faults, lruRes.faults, optRes.faults);
  const bestAlgorithms = (['FIFO', 'LRU', 'Optimal'] as const).filter(
    (key) => results[key].faults === minFaults
  );

  const steps = referenceString.map((_, i) => i + 1);

  return {
    referenceString: [...referenceString],
    frameCount,
    results,
    bestAlgorithms,
    minFaults,
    isTie: bestAlgorithms.length > 1,
    cumulativeTraces: {
      steps,
      FIFO: fifoRes.steps.map((s) => s.faults),
      LRU: lruRes.steps.map((s) => s.faults),
      Optimal: optRes.steps.map((s) => s.faults),
    },
  };
}

export function analyzeFrameRange(
  referenceString: number[],
  maxFrames = 10
): FrameAnalysisResult {
  const data: FrameAnalysisPoint[] = [];
  const beladyAnomalies: BeladyAnomaly[] = [];

  for (let f = 1; f <= maxFrames; f++) {
    const fFifo = runFifo(referenceString, f);
    const fLru = runLru(referenceString, f);
    const fOpt = runOptimal(referenceString, f);

    data.push({
      frames: f,
      fifoFaults: fFifo.faults,
      fifoHits: fFifo.hits,
      fifoHitRatio: fFifo.hitRatio,
      lruFaults: fLru.faults,
      lruHits: fLru.hits,
      lruHitRatio: fLru.hitRatio,
      optFaults: fOpt.faults,
      optHits: fOpt.hits,
      optHitRatio: fOpt.hitRatio,
    });
  }

  for (let i = 0; i < data.length - 1; i++) {
    if (data[i + 1].fifoFaults > data[i].fifoFaults) {
      beladyAnomalies.push({
        algorithm: 'FIFO',
        lowerFrames: data[i].frames,
        higherFrames: data[i + 1].frames,
        faultsLower: data[i].fifoFaults,
        faultsHigher: data[i + 1].fifoFaults,
        difference: data[i + 1].fifoFaults - data[i].fifoFaults,
      });
    }
  }

  return {
    maxFrames,
    data,
    hasBeladyAnomaly: beladyAnomalies.length > 0,
    beladyAnomalies,
  };
}
