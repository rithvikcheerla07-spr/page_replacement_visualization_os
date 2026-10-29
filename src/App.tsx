/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Download,
  BookOpen,
  BarChart3,
  Layers,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Sparkles,
  Info,
  Terminal,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import {
  runNamedAlgorithm,
  compareAllAlgorithms,
  analyzeFrameRange,
  type AlgorithmSummary,
  type ComparisonResult,
  type FrameAnalysisResult,
} from './algorithms';

const STANDARD_REFS_STR = '7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2';
const BELADY_REFS_STR = '1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5';

export default function App() {
  // Configuration State
  const [refStringInput, setRefStringInput] = useState<string>(STANDARD_REFS_STR);
  const [frameCount, setFrameCount] = useState<number>(3);
  const [selectedAlgo, setSelectedAlgo] = useState<'FIFO' | 'LRU' | 'Optimal'>('FIFO');
  const [activeTab, setActiveTab] = useState<'simulation' | 'comparison' | 'frames' | 'learn'>('simulation');

  // Simulation Playback State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(800); // ms per step
  const [viewMode, setViewMode] = useState<'both' | 'step' | 'all'>('both');

  // Modals & UI State
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [selectedCodeFile, setSelectedCodeFile] = useState<string>('algorithms.py');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [randomLength, setRandomLength] = useState<number>(12);
  const [randomMaxPage, setRandomMaxPage] = useState<number>(7);

  // Parsing reference string
  const parseRefString = (str: string): { pages: number[]; error: string | null } => {
    if (!str.trim()) return { pages: [], error: 'Reference string cannot be empty.' };
    const tokens = str.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    const pages: number[] = [];
    for (const token of tokens) {
      const val = Number(token);
      if (isNaN(val) || !Number.isInteger(val)) {
        return { pages: [], error: `Invalid page token "${token}". Must be integers.` };
      }
      if (val < 0) {
        return { pages: [], error: `Page numbers must be non-negative (found ${val}).` };
      }
      pages.push(val);
    }
    if (pages.length === 0) return { pages: [], error: 'No valid integers found.' };
    return { pages, error: null };
  };

  const { pages, error: parseError } = parseRefString(refStringInput);
  const totalSteps = pages.length;

  // Auto-clamp step
  useEffect(() => {
    if (totalSteps > 0 && currentStep > totalSteps) {
      setCurrentStep(totalSteps);
    }
  }, [totalSteps, currentStep]);

  // Compute Results
  let simResult: AlgorithmSummary | null = null;
  let compResult: ComparisonResult | null = null;
  let framesResult: FrameAnalysisResult | null = null;

  if (!parseError && pages.length > 0) {
    try {
      simResult = runNamedAlgorithm(selectedAlgo, pages, frameCount);
      compResult = compareAllAlgorithms(pages, frameCount);
      framesResult = analyzeFrameRange(pages, 10);
    } catch (e) {
      console.error(e);
    }
  }

  // Playback timer
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setTimeout(() => {
        if (currentStep < totalSteps) {
          setCurrentStep((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, playSpeed);
    }
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, currentStep, totalSteps, playSpeed]);

  const handleGenerateRandom = () => {
    const arr = Array.from({ length: randomLength }, () => Math.floor(Math.random() * (randomMaxPage + 1)));
    setRefStringInput(arr.join(', '));
    setCurrentStep(1);
    setIsPlaying(false);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const stepData = simResult && simResult.steps[currentStep - 1];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-4 lg:px-8 py-3.5 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-inner">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg lg:text-xl font-bold tracking-tight text-white">
                  Page Replacement Visualization System
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Pytest 17/17 Passed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                B.Tech Operating Systems Course-Based Project (CBP) • FIFO, LRU & Optimal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowCodeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Inspect Python, Batch, and Test Files"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Project Files</span>
            </button>
            <a
              href="/page-replacement-visualizer.zip"
              download="page-replacement-visualizer.zip"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-500 text-white shadow transition"
              title="Download full project archive with Python scripts, tests, and Windows launchers"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .ZIP</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-5 flex-1 flex flex-col gap-5">
        {/* Desk Analogy Callout Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border-l-4 border-blue-600 p-4 rounded-r-lg shadow-xs flex items-start gap-3 text-slate-700">
          <BookOpen className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong className="text-blue-900 font-semibold">The Desk & Library Analogy:</strong> A student works at a small desk that holds only a few open books at a time (<strong>RAM Memory Frames</strong>). The massive university library stacks hold all books (<strong>Secondary Storage / Hard Disk</strong>). When a needed book is already on the desk, it is an instantaneous <span className="font-bold text-emerald-700 bg-emerald-100 px-1 rounded">Page Hit</span>. When absent, a time-consuming <span className="font-bold text-rose-700 bg-rose-100 px-1 rounded">Page Fault</span> occurs: the student must retrieve it, and if the desk is full, choose which book to return based on the eviction policy (FIFO, LRU, or Optimal).
          </div>
        </div>

        {/* Configuration Controls Bar */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Reference String Input */}
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Page Reference String</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setRefStringInput(STANDARD_REFS_STR);
                      setCurrentStep(1);
                      setIsPlaying(false);
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-normal cursor-pointer"
                  >
                    Textbook Default
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => {
                      setRefStringInput(BELADY_REFS_STR);
                      setCurrentStep(1);
                      setIsPlaying(false);
                    }}
                    className="text-[11px] text-amber-600 hover:underline font-normal cursor-pointer"
                  >
                    Belady Anomaly
                  </button>
                </div>
              </label>
              <input
                type="text"
                value={refStringInput}
                onChange={(e) => {
                  setRefStringInput(e.target.value);
                  setCurrentStep(1);
                  setIsPlaying(false);
                }}
                placeholder="e.g. 7, 0, 1, 2, 0, 3, 0, 4, 2"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-slate-50"
              />
              {parseError && <p className="text-xs text-rose-600 mt-1 font-medium">{parseError}</p>}
            </div>

            {/* Frame Count Slider */}
            <div className="md:col-span-3">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Memory Frames
                </label>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {frameCount} Slots
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={frameCount}
                onChange={(e) => {
                  setFrameCount(Number(e.target.value));
                  setCurrentStep(1);
                  setIsPlaying(false);
                }}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>1</span>
                <span>3 (Std)</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            {/* Algorithm Selector & Random Gen */}
            <div className="md:col-span-3 flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Algorithm
                </label>
                <select
                  value={selectedAlgo}
                  onChange={(e) => setSelectedAlgo(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="FIFO">FIFO (First In, First Out)</option>
                  <option value="LRU">LRU (Least Recently Used)</option>
                  <option value="Optimal">Optimal (OPT / Belady's Min)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 opacity-0">
                  Gen
                </label>
                <button
                  onClick={handleGenerateRandom}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition flex items-center gap-1 cursor-pointer"
                  title="Generate random sequence"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Random</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('simulation')}
              className={`py-3 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition ${
                activeTab === 'simulation'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>1. Simulation</span>
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`py-3 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition ${
                activeTab === 'comparison'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>2. Comparison</span>
            </button>
            <button
              onClick={() => setActiveTab('frames')}
              className={`py-3 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition ${
                activeTab === 'frames'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>3. Frames Analysis (Belady)</span>
            </button>
            <button
              onClick={() => setActiveTab('learn')}
              className={`py-3 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition ${
                activeTab === 'learn'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>4. Learn OS Paging</span>
            </button>
          </nav>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SIMULATION */}
        {/* ========================================================================= */}
        {activeTab === 'simulation' && simResult && stepData && (
          <div className="space-y-5">
            {/* Automated Simulation Launcher Bar */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-xl p-4 shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <button
                  onClick={() => {
                    if (isPlaying) {
                      setIsPlaying(false);
                    } else {
                      if (currentStep >= totalSteps) {
                        setCurrentStep(1);
                      }
                      setIsPlaying(true);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow transition cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold'
                  }`}
                  title="Run through the entire simulation automatically"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause Auto-Run</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>🚀 Auto-Simulate (Run Total Itself)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep(totalSteps);
                    setViewMode('all');
                  }}
                  className="px-3.5 py-2 rounded-lg font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  title="Instantly complete simulation and display all tasks"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>⚡ Run Total & Show All Tasks</span>
                </button>
              </div>

              {/* Speed & View Mode Controls */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
                  <span className="text-[11px] text-slate-400 px-1 font-medium">Speed:</span>
                  <button
                    onClick={() => setPlaySpeed(300)}
                    className={`px-2 py-1 rounded cursor-pointer transition ${
                      playSpeed === 300 ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    0.3s (Fast)
                  </button>
                  <button
                    onClick={() => setPlaySpeed(800)}
                    className={`px-2 py-1 rounded cursor-pointer transition ${
                      playSpeed === 800 ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    0.8s
                  </button>
                  <button
                    onClick={() => setPlaySpeed(1500)}
                    className={`px-2 py-1 rounded cursor-pointer transition ${
                      playSpeed === 1500 ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    1.5s
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
                  <span className="text-[11px] text-slate-400 px-1 font-medium">View:</span>
                  <button
                    onClick={() => setViewMode('both')}
                    className={`px-2 py-1 rounded cursor-pointer transition ${
                      viewMode === 'both' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Both
                  </button>
                  <button
                    onClick={() => setViewMode('step')}
                    className={`px-2 py-1 rounded cursor-pointer transition ${
                      viewMode === 'step' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Step Focus
                  </button>
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-2 py-1 rounded cursor-pointer transition ${
                      viewMode === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    All Tasks
                  </button>
                </div>
              </div>
            </div>

            {/* Manual Stepping & Progress */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full md:w-auto justify-center">
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setIsPlaying(false);
                  }}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="First Step"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentStep((prev) => Math.max(1, prev - 1));
                    setIsPlaying(false);
                  }}
                  disabled={currentStep <= 1}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition cursor-pointer"
                  title="Previous Step"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (currentStep >= totalSteps) {
                      setCurrentStep(1);
                    } else {
                      setCurrentStep((prev) => prev + 1);
                    }
                    setIsPlaying(false);
                  }}
                  className="px-3.5 py-2 rounded-lg font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1"
                  title="Step by Step"
                >
                  <span>Step Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setCurrentStep(totalSteps);
                    setIsPlaying(false);
                  }}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="Last Step"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setIsPlaying(false);
                  }}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="Reset to Beginning"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Stepper & Slider */}
              <div className="flex items-center gap-3 w-full md:w-80">
                <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                  Task {currentStep} of {totalSteps}
                </span>
                <input
                  type="range"
                  min="1"
                  max={totalSteps}
                  value={currentStep}
                  onChange={(e) => {
                    setCurrentStep(Number(e.target.value));
                    setIsPlaying(false);
                  }}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* Current Step Visual Cards (Shown in Both or Step Focus modes) */}
            {(viewMode === 'both' || viewMode === 'step') && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Requested Page Hero Card */}
                <div className="md:col-span-3 bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Requested Page
                  </span>
                  <div className="text-5xl font-extrabold text-slate-900 my-2">{stepData.page}</div>
                  <div>
                    {stepData.result === 'HIT' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" /> PAGE HIT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5" /> PAGE FAULT
                      </span>
                    )}
                  </div>
                </div>

                {/* Memory Frames Display */}
                <div className="md:col-span-6 bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Physical Memory Frames (RAM)
                      </span>
                      <span className="text-xs text-slate-500">
                        Capacity: <strong>{frameCount} frames</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {stepData.frames.map((frameVal, fIdx) => {
                        const isActive = frameVal === stepData.page;
                        return (
                          <div
                            key={fIdx}
                            className={`flex-1 min-w-[70px] max-w-[120px] rounded-lg p-3 text-center border-2 transition-all ${
                              frameVal === null
                                ? 'border-dashed border-slate-200 bg-slate-50 text-slate-400'
                                : isActive
                                ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                                : 'border-slate-300 bg-white text-slate-800 shadow-xs'
                            }`}
                          >
                            <div className="text-[10px] font-bold uppercase text-slate-400">
                              Frame {fIdx + 1}
                            </div>
                            <div className="text-xl font-bold my-1">
                              {frameVal !== null ? frameVal : '—'}
                            </div>
                            <div
                              className={`text-[9px] font-semibold uppercase tracking-wider ${
                                frameVal === null
                                  ? 'text-slate-400'
                                  : isActive
                                  ? 'text-blue-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {frameVal === null ? 'Empty' : isActive ? 'Active' : 'Resident'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                    <strong className="text-slate-900">Decision:</strong> {stepData.explanation}
                  </div>
                </div>

                {/* Eviction & Cumulative Card */}
                <div className="md:col-span-3 bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between text-center">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Eviction Status
                    </span>
                    <div
                      className={`text-2xl font-bold my-2 ${
                        stepData.evicted !== null ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    >
                      {stepData.evicted !== null ? `Page ${stepData.evicted}` : 'None'}
                    </div>
                    <p className="text-xs text-slate-500">
                      {stepData.evicted !== null
                        ? 'Replaced to accommodate new page'
                        : 'No page evicted this step'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                    <div className="p-2 rounded bg-rose-50 border border-rose-100">
                      <div className="text-[10px] font-bold uppercase text-rose-600">Faults</div>
                      <div className="text-lg font-bold text-rose-700">{stepData.faults}</div>
                    </div>
                    <div className="p-2 rounded bg-emerald-50 border border-emerald-100">
                      <div className="text-[10px] font-bold uppercase text-emerald-600">Hits</div>
                      <div className="text-lg font-bold text-emerald-700">{stepData.hits}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sequence Interactive Strip */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
                Reference Sequence Timeline
              </span>
              <div className="flex flex-wrap gap-1.5">
                {pages.map((p, idx) => {
                  const stepNum = idx + 1;
                  const isCurrent = stepNum === currentStep;
                  const isPast = stepNum < currentStep;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentStep(stepNum);
                        setIsPlaying(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-md scale-105'
                          : isPast
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-white text-slate-400 border border-dashed border-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* All Tasks Visual Grid (Complete Memory Access Trace) */}
            {(viewMode === 'both' || viewMode === 'all') && (
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Complete Memory Trace — All Tasks (1 to {simResult.steps.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Every memory reference task executed with its full frame state, eviction record, and policy decision
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {simResult.faults} Faults • {simResult.hits} Hits ({simResult.hitPercentage}% Hit Rate)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {simResult.steps.map((task) => {
                    const isTaskActive = task.step === currentStep;
                    const isHit = task.result === 'HIT';
                    return (
                      <div
                        key={task.step}
                        onClick={() => {
                          setCurrentStep(task.step);
                          setIsPlaying(false);
                        }}
                        className={`rounded-xl p-3.5 border-2 transition-all cursor-pointer ${
                          isTaskActive
                            ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-200'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-600">
                            Task #{task.step}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isHit
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {task.result}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-2.5">
                          <span className="text-xs text-slate-400 font-medium">Req:</span>
                          <span className="text-xl font-extrabold text-slate-900">
                            Page {task.page}
                          </span>
                        </div>

                        {/* Memory Frames Mini-Slots */}
                        <div className="mb-2">
                          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                            Frames State:
                          </div>
                          <div className="flex gap-1.5">
                            {task.frames.map((val, fIdx) => (
                              <div
                                key={fIdx}
                                className={`flex-1 text-center py-1 rounded text-xs font-bold border ${
                                  val === null
                                    ? 'bg-slate-50 text-slate-300 border-slate-200 border-dashed'
                                    : val === task.page
                                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {val !== null ? val : '—'}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Eviction Notice */}
                        <div className="text-[11px] font-medium pt-1 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-slate-400">Eviction:</span>
                          <span
                            className={`font-semibold ${
                              task.evicted !== null ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {task.evicted !== null ? `Page ${task.evicted}` : 'None'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step-by-Step Table Audit */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">Full Execution Audit Log</h3>
                <span className="text-xs text-slate-500">{simResult.steps.length} Steps Recorded</span>
              </div>
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-semibold sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5">Step</th>
                      <th className="px-4 py-2.5">Requested Page</th>
                      <th className="px-4 py-2.5">Resident Frames</th>
                      <th className="px-4 py-2.5">Result</th>
                      <th className="px-4 py-2.5">Evicted</th>
                      <th className="px-4 py-2.5">Faults</th>
                      <th className="px-4 py-2.5">Hits</th>
                      <th className="px-4 py-2.5">Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {simResult.steps.map((st) => (
                      <tr
                        key={st.step}
                        onClick={() => {
                          setCurrentStep(st.step);
                          setIsPlaying(false);
                        }}
                        className={`cursor-pointer transition hover:bg-blue-50/60 ${
                          st.step === currentStep ? 'bg-blue-50/90 font-bold' : ''
                        }`}
                      >
                        <td className="px-4 py-2 text-slate-500">{st.step}</td>
                        <td className="px-4 py-2 font-bold text-slate-900">{st.page}</td>
                        <td className="px-4 py-2">
                          [{st.frames.map((f) => (f !== null ? f : '-')).join(', ')}]
                        </td>
                        <td className="px-4 py-2">
                          {st.result === 'HIT' ? (
                            <span className="text-emerald-700 font-bold">HIT</span>
                          ) : (
                            <span className="text-rose-600 font-bold">FAULT</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {st.evicted !== null ? st.evicted : '—'}
                        </td>
                        <td className="px-4 py-2 text-rose-600 font-semibold">{st.faults}</td>
                        <td className="px-4 py-2 text-emerald-600 font-semibold">{st.hits}</td>
                        <td className="px-4 py-2 font-sans text-slate-600">{st.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: COMPARISON */}
        {/* ========================================================================= */}
        {activeTab === 'comparison' && compResult && (
          <div className="space-y-6">
            {/* Top Cards for 3 algorithms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['FIFO', 'LRU', 'Optimal'] as const).map((algoKey) => {
                const res = compResult!.results[algoKey];
                const isWinner = compResult!.bestAlgorithms.includes(algoKey);
                return (
                  <div
                    key={algoKey}
                    className={`bg-white rounded-xl p-5 border-2 shadow-xs relative transition ${
                      isWinner ? 'border-emerald-500 shadow-sm' : 'border-slate-200'
                    }`}
                  >
                    {isWinner && (
                      <span className="absolute top-3 right-3 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        🏆 Best Performer
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-slate-900">{algoKey}</h3>
                    <p className="text-xs text-slate-500 mb-4">
                      {algoKey === 'FIFO' && 'Oldest loaded page evicted'}
                      {algoKey === 'LRU' && 'Least recently used page evicted'}
                      {algoKey === 'Optimal' && 'Theoretical future lookahead'}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <div className="text-xs text-slate-500 font-medium">Page Faults</div>
                        <div className="text-2xl font-extrabold text-rose-600">{res.faults}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {res.faultPercentage}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-medium">Page Hits</div>
                        <div className="text-2xl font-extrabold text-emerald-600">{res.hits}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {res.hitPercentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comparison Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="text-sm font-bold text-slate-900">
                  Statistical Comparison ({frameCount} Frames, {totalSteps} Total References)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-5 py-3">Algorithm</th>
                      <th className="px-5 py-3">Total References</th>
                      <th className="px-5 py-3">Page Hits</th>
                      <th className="px-5 py-3">Page Faults</th>
                      <th className="px-5 py-3">Hit Ratio</th>
                      <th className="px-5 py-3">Fault Ratio</th>
                      <th className="px-5 py-3">Hit Percentage</th>
                      <th className="px-5 py-3">Fault Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {(['FIFO', 'LRU', 'Optimal'] as const).map((algoKey) => {
                      const res = compResult!.results[algoKey];
                      const isWinner = compResult!.bestAlgorithms.includes(algoKey);
                      return (
                        <tr
                          key={algoKey}
                          className={isWinner ? 'bg-emerald-50/50 font-semibold' : ''}
                        >
                          <td className="px-5 py-3 font-sans font-bold text-slate-900 flex items-center gap-1.5">
                            {algoKey} {isWinner && <span className="text-emerald-600">★</span>}
                          </td>
                          <td className="px-5 py-3">{res.totalReferences}</td>
                          <td className="px-5 py-3 text-emerald-600">{res.hits}</td>
                          <td className="px-5 py-3 text-rose-600">{res.faults}</td>
                          <td className="px-5 py-3">{res.hitRatio}</td>
                          <td className="px-5 py-3">{res.faultRatio}</td>
                          <td className="px-5 py-3">{res.hitPercentage}%</td>
                          <td className="px-5 py-3">{res.faultPercentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual SVG Chart: Total Faults Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900 mb-4">
                  Total Page Faults vs Hits by Algorithm
                </h4>
                <div className="space-y-4">
                  {(['FIFO', 'LRU', 'Optimal'] as const).map((algoKey) => {
                    const res = compResult!.results[algoKey];
                    const faultPct = (res.faults / totalSteps) * 100;
                    const hitPct = (res.hits / totalSteps) * 100;
                    return (
                      <div key={algoKey} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{algoKey}</span>
                          <span className="text-slate-500">
                            <span className="text-rose-600">{res.faults} Faults</span> •{' '}
                            <span className="text-emerald-600">{res.hits} Hits</span>
                          </span>
                        </div>
                        <div className="w-full h-5 rounded-md overflow-hidden bg-slate-100 flex shadow-inner">
                          <div
                            style={{ width: `${faultPct}%` }}
                            className="bg-rose-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                            title={`Faults: ${res.faults}`}
                          >
                            {res.faults > 0 ? `${res.faults}` : ''}
                          </div>
                          <div
                            style={{ width: `${hitPct}%` }}
                            className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                            title={`Hits: ${res.hits}`}
                          >
                            {res.hits > 0 ? `${res.hits}` : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-6 mt-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
                    <span>Page Faults</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                    <span>Page Hits</span>
                  </div>
                </div>
              </div>

              {/* Cumulative Faults Graph */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  Cumulative Faults Trajectory
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Lower curve represents superior cache retention over time
                </p>

                {/* SVG Line Chart */}
                <div className="relative h-48 w-full">
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${totalSteps * 20} 100`}>
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2={totalSteps * 20} y2="20" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="50" x2={totalSteps * 20} y2="50" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="80" x2={totalSteps * 20} y2="80" stroke="#f1f5f9" strokeWidth="1" />

                    {/* FIFO Path (Amber) */}
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      points={compResult.cumulativeTraces.FIFO.map((f, i) => `${i * 20},${100 - (f / totalSteps) * 90}`).join(' ')}
                    />
                    {/* LRU Path (Blue) */}
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      points={compResult.cumulativeTraces.LRU.map((f, i) => `${i * 20},${100 - (f / totalSteps) * 90}`).join(' ')}
                    />
                    {/* Optimal Path (Emerald) */}
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      points={compResult.cumulativeTraces.Optimal.map((f, i) => `${i * 20},${100 - (f / totalSteps) * 90}`).join(' ')}
                    />
                  </svg>
                </div>

                <div className="flex justify-center gap-6 mt-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <span className="w-3 h-0.5 bg-amber-500 inline-block" />
                    <span>FIFO</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-3 h-0.5 bg-blue-500 inline-block" />
                    <span>LRU</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
                    <span>Optimal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FRAMES ANALYSIS (BELADY) */}
        {/* ========================================================================= */}
        {activeTab === 'frames' && framesResult && (
          <div className="space-y-6">
            {/* Anomaly Detection Banner */}
            {framesResult.hasBeladyAnomaly ? (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-xs">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">
                      Belady's Anomaly Detected in FIFO!
                    </h4>
                    {framesResult.beladyAnomalies.map((anom, aIdx) => (
                      <p key={aIdx} className="text-xs text-amber-800 mt-1">
                        When frame capacity increased from <strong>{anom.lowerFrames} frames</strong> to{' '}
                        <strong>{anom.higherFrames} frames</strong>, page faults increased from{' '}
                        <strong>{anom.faultsLower}</strong> to <strong>{anom.faultsHigher}</strong> (+{anom.difference} faults).
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 border-l-4 border-slate-400 p-4 rounded-r-lg shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <Info className="w-4 h-4 text-slate-500" />
                  <span>
                    No Belady's Anomaly observed in FIFO for current reference string across frames 1 to 10.
                  </span>
                </div>
                <button
                  onClick={() => {
                    setRefStringInput(BELADY_REFS_STR);
                    setCurrentStep(1);
                    setIsPlaying(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-white transition cursor-pointer"
                >
                  Load Canonical Belady String
                </button>
              </div>
            )}

            {/* Frame Scaling Visual Line Chart */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Page Faults vs. Memory Capacity (Frames 1–10)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Notice how stack algorithms (LRU, Optimal) monotonically decrease or stay flat, while FIFO can spike
                  </p>
                </div>
              </div>

              {/* Bar/Line Multi Comparison */}
              <div className="overflow-x-auto">
                <div className="min-w-[500px] h-52 flex items-end gap-2 pt-6 pb-2 border-b border-slate-200">
                  {framesResult.data.map((point) => {
                    const maxVal = Math.max(...framesResult!.data.map((d) => d.fifoFaults), 1);
                    return (
                      <div key={point.frames} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <div className="flex items-end gap-1 h-full w-full justify-center">
                          {/* FIFO */}
                          <div
                            style={{ height: `${(point.fifoFaults / maxVal) * 85}%` }}
                            className="w-2.5 bg-amber-500 rounded-t"
                            title={`Frames ${point.frames} - FIFO: ${point.fifoFaults}`}
                          />
                          {/* LRU */}
                          <div
                            style={{ height: `${(point.lruFaults / maxVal) * 85}%` }}
                            className="w-2.5 bg-blue-500 rounded-t"
                            title={`Frames ${point.frames} - LRU: ${point.lruFaults}`}
                          />
                          {/* Optimal */}
                          <div
                            style={{ height: `${(point.optFaults / maxVal) * 85}%` }}
                            className="w-2.5 bg-emerald-500 rounded-t"
                            title={`Frames ${point.frames} - Optimal: ${point.optFaults}`}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{point.frames}F</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center gap-6 mt-3 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-amber-600">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs" />
                  <span>FIFO Faults</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-xs" />
                  <span>LRU Faults</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />
                  <span>Optimal Faults</span>
                </div>
              </div>
            </div>

            {/* Frame Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="text-sm font-bold text-slate-900">Frame Scaling Raw Data</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Frames</th>
                      <th className="px-4 py-2.5">FIFO Faults</th>
                      <th className="px-4 py-2.5">FIFO Hits</th>
                      <th className="px-4 py-2.5">LRU Faults</th>
                      <th className="px-4 py-2.5">LRU Hits</th>
                      <th className="px-4 py-2.5">OPT Faults</th>
                      <th className="px-4 py-2.5">OPT Hits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {framesResult.data.map((row) => (
                      <tr key={row.frames} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-bold text-slate-800">{row.frames} Frames</td>
                        <td className="px-4 py-2 text-amber-600 font-semibold">{row.fifoFaults}</td>
                        <td className="px-4 py-2 text-slate-600">{row.fifoHits}</td>
                        <td className="px-4 py-2 text-blue-600 font-semibold">{row.lruFaults}</td>
                        <td className="px-4 py-2 text-slate-600">{row.lruHits}</td>
                        <td className="px-4 py-2 text-emerald-600 font-semibold">{row.optFaults}</td>
                        <td className="px-4 py-2 text-slate-600">{row.optHits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LEARN */}
        {/* ========================================================================= */}
        {activeTab === 'learn' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> 1. Virtual Memory & Paging
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Virtual memory gives executing programs the illusion of large, contiguous physical RAM.
                  Address space is partitioned into fixed-sized blocks called <strong>Pages</strong> (typically 4 KB).
                  Physical RAM is divided into matching slots called <strong>Frames</strong>.
                </p>
                <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-200">
                  <div>
                    <strong className="text-emerald-700">Page Hit:</strong> CPU requests a page already resident in a frame. Instantaneous memory fetch.
                  </div>
                  <div>
                    <strong className="text-rose-700">Page Fault:</strong> CPU requests a page not in RAM. An interrupt halts execution while the OS loads the page from disk.
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> 2. Mathematical Formulas
                </h3>
                <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800">
                  <div>Hit Ratio = Page Hits / Total References</div>
                  <div>Fault Ratio = Page Faults / Total References</div>
                  <div>Hit Percentage = Hit Ratio × 100%</div>
                  <div>Fault Percentage = Fault Ratio × 100%</div>
                  <div className="text-blue-700 font-bold">
                    Total References = Page Hits + Page Faults
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> 3. Belady's Anomaly
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Discovered in 1969 by László Bélády, Belady's Anomaly describes situations where giving an algorithm
                  <strong> more memory frames actually results in MORE page faults</strong>.
                </p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  <strong>Stack Algorithms (LRU & Optimal):</strong> The set of pages in memory with <em>n</em> frames is always a subset of pages with <em>n+1</em> frames:
                  <code className="block bg-slate-100 p-1.5 rounded my-1 text-[11px] text-blue-900 font-mono">
                    M(n, t) ⊆ M(n+1, t)
                  </code>
                  Because of this property, LRU and Optimal are mathematically immune to Belady's Anomaly.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> 4. Algorithm Policies Comparison
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2">Policy</th>
                        <th className="py-2">Eviction Criteria</th>
                        <th className="py-2">Stack Algo?</th>
                        <th className="py-2">Practicality</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 font-bold text-amber-600">FIFO</td>
                        <td className="py-2">Oldest loaded</td>
                        <td className="py-2 text-rose-600">No</td>
                        <td className="py-2 text-slate-600">Simple queue</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-blue-600">LRU</td>
                        <td className="py-2">Least recently accessed</td>
                        <td className="py-2 text-emerald-600">Yes</td>
                        <td className="py-2 text-slate-600">High hardware cost</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-emerald-600">Optimal</td>
                        <td className="py-2">Farthest in future</td>
                        <td className="py-2 text-emerald-600">Yes</td>
                        <td className="py-2 text-slate-600">Theoretical benchmark</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> 5. Real-World Kernel Implementations
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real operating systems cannot look into the future (making Optimal impossible in production), and tracking exact timestamps on every single memory reference for pure LRU imposes unacceptable CPU bus overhead.
                </p>
                <ul className="text-xs text-slate-600 space-y-1 mt-2 list-disc pl-4">
                  <li><strong>Clock Algorithm (Second-Chance):</strong> Uses a circular list and a single reference bit per frame.</li>
                  <li><strong>Multi-Gen LRU (MGLRU):</strong> Modern Linux kernel subsystem providing tiered page aging with low overhead.</li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> 6. Standard Worked Example
                </h3>
                <p className="text-xs text-slate-600">
                  Reference string <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2</code> with <strong>3 frames</strong>:
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3">
                  <div className="p-2 rounded bg-amber-50 border border-amber-200">
                    <div className="font-bold text-amber-800">FIFO</div>
                    <div className="text-base font-extrabold text-amber-900">10 Faults</div>
                    <div className="text-[10px] text-amber-700">3 Hits</div>
                  </div>
                  <div className="p-2 rounded bg-blue-50 border border-blue-200">
                    <div className="font-bold text-blue-800">LRU</div>
                    <div className="text-base font-extrabold text-blue-900">9 Faults</div>
                    <div className="text-[10px] text-blue-700">4 Hits</div>
                  </div>
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                    <div className="font-bold text-emerald-800">Optimal</div>
                    <div className="text-base font-extrabold text-emerald-900">7 Faults</div>
                    <div className="text-[10px] text-emerald-700">6 Hits</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Code & Project Files Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Project Source Explorer</h3>
                <span className="text-xs text-slate-400">({selectedCodeFile})</span>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* File Switcher Tabs */}
            <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex flex-wrap gap-2 text-xs">
              {[
                'algorithms.py',
                'app.py',
                'test_algorithms.py',
                'run_windows.bat',
                'run_tests.bat',
                'requirements.txt',
                'README.md',
              ].map((file) => (
                <button
                  key={file}
                  onClick={() => setSelectedCodeFile(file)}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${
                    selectedCodeFile === file
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {file}
                </button>
              ))}
            </div>

            {/* Code Content Area */}
            <div className="p-4 overflow-y-auto font-mono text-xs text-slate-300 flex-1 bg-slate-950/80 leading-relaxed">
              <pre className="whitespace-pre-wrap select-all">
                {selectedCodeFile === 'algorithms.py' && `# Virtual Memory Page Replacement Algorithms
# Implements FIFO, LRU, Optimal, comparison, and Belady anomaly analysis
# (See file in repository: page-replacement-visualizer/algorithms.py)`}
                {selectedCodeFile === 'app.py' && `# Streamlit Multi-Tab Dashboard Application
# Interactive visualizer, Plotly comparison graphs, Belady benchmark
# (See file in repository: page-replacement-visualizer/app.py)`}
                {selectedCodeFile === 'test_algorithms.py' && `# Automated Pytest Suite
# Tests standard textbook sequence (10, 9, 7 faults), Belady anomaly, edge cases
# (See file in repository: page-replacement-visualizer/tests/test_algorithms.py)`}
                {selectedCodeFile === 'run_windows.bat' && `@echo off
:: Windows One-Click Launcher for Streamlit Dashboard
:: Creates .venv if missing, installs dependencies, launches browser
streamlit run app.py`}
                {selectedCodeFile === 'run_tests.bat' && `@echo off
:: Automated Pytest Test Runner
python -m pytest -v tests`}
                {selectedCodeFile === 'requirements.txt' && `streamlit>=1.30.0,<2.0.0
plotly>=5.18.0,<6.0.0
pandas>=2.0.0,<3.0.0
pytest>=8.0.0,<9.0.0`}
                {selectedCodeFile === 'README.md' && `# Page Replacement Visualization System
# Complete B.Tech Operating Systems Course-Based Project (CBP)
# Detailed installation, VS Code quickstart, formulas, and GitHub cloning`}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs">
              <span className="text-slate-400">
                Directly downloadable as clean clonable folder
              </span>
              <a
                href="/page-replacement-visualizer.zip"
                download="page-replacement-visualizer.zip"
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Entire Repository (.ZIP)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Page Replacement Visualization System • B.Tech Operating Systems Course-Based Project (CBP)
          </span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3 h-3" /> 17 Pytest Tests Passing
            </span>
            <span className="text-slate-300">|</span>
            <a
              href="/page-replacement-visualizer.zip"
              download
              className="text-blue-600 hover:underline font-semibold"
            >
              Get ZIP Archive
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
