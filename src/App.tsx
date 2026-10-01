import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  BeamParameters,
  ExcitationParameters,
  PhysicalDerivedValues,
  SimulationState,
  TimePoint,
  WindowFunction,
  FFTResult,
} from './types/physics';
import {
  calculateDerivedValues,
  rk4Step,
  getBaseKinematics,
} from './utils/physicsEngine';
import { analyzeOscillationsFFT } from './utils/fourier';
import { Navbar } from './components/Navbar';
import { BeamCanvas } from './components/BeamCanvas';
import { OscilloscopeChart } from './components/OscilloscopeChart';
import { FourierSpectrumChart } from './components/FourierSpectrumChart';
import { ControlsPanel } from './components/ControlsPanel';
import { GuidedExperimentsModal } from './components/GuidedExperiments';
import { TheoryModal } from './components/TheoryModal';
import { DataExportModal } from './components/DataExportModal';
import { GitVercelAgentModal } from './components/GitVercelAgentModal';

export const App: React.FC = () => {
  // 1. Estado de la viga y masa
  const [beamParams, setBeamParams] = useState<BeamParameters>({
    length: 0.55,
    crossSection: 'circular',
    diameter: 0.012, // 12 mm
    width: 0.025,
    height: 0.005,
    youngModulus: 200e9, // Acero
    density: 7850,
    tipMass: 0.4, // 400 gramos
    dampingRatio: 0.02, // 2%
  });

  // 2. Estado de excitación de la base móvil
  const [excitation, setExcitation] = useState<ExcitationParameters>({
    type: 'harmonic',
    amplitude: 0.008, // 8 mm
    frequency: 2.2, // Hz
    chirpStartFreq: 0.5,
    chirpEndFreq: 6.0,
    chirpDuration: 15,
    noiseIntensity: 1.0,
    pulseTime: 0.05,
  });

  // 3. Estado dinámico de simulación
  const [simState, setSimState] = useState<SimulationState>({
    t: 0,
    xb: 0,
    xb_dot: 0,
    xb_ddot: 0,
    u: 0,
    u_dot: 0,
    u_ddot: 0,
    x_tip: 0,
    isRunning: true,
    timeScale: 1.0,
  });

  // 4. Parámetros físicos derivados calculados
  const derived: PhysicalDerivedValues = useMemo(() => {
    return calculateDerivedValues(beamParams);
  }, [beamParams]);

  // 5. Buffer de datos temporales (muestreo a ~100Hz para graficación fluida y FFT de alta fidelidad)
  const [timeBuffer, setTimeBuffer] = useState<TimePoint[]>([]);
  const bufferRef = useRef<TimePoint[]>([]);

  // 6. Configuración y cálculo de FFT
  const [windowType, setWindowType] = useState<WindowFunction>('hann');
  const [fftData, setFftData] = useState<FFTResult | null>(null);

  // 7. Modales informativos y de prácticas
  const [isExperimentsOpen, setIsExperimentsOpen] = useState<boolean>(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isAgentOpen, setIsAgentOpen] = useState<boolean>(false);

  // Referencias mutables para el ciclo de animación en 60 FPS
  const stateRef = useRef(simState);
  stateRef.current = simState;

  const beamParamsRef = useRef(beamParams);
  beamParamsRef.current = beamParams;

  const derivedRef = useRef(derived);
  derivedRef.current = derived;

  const excitationRef = useRef(excitation);
  excitationRef.current = excitation;

  const lastAnimTimeRef = useRef<number>(performance.now());
  const lastSampleTimeRef = useRef<number>(0);
  const lastFFTTimeRef = useRef<number>(0);

  // Reiniciar estado
  const handleReset = useCallback(() => {
    setSimState(prev => ({
      ...prev,
      t: 0,
      xb: 0,
      xb_dot: 0,
      xb_ddot: 0,
      u: 0,
      u_dot: 0,
      u_ddot: 0,
      x_tip: 0,
    }));
    bufferRef.current = [];
    setTimeBuffer([]);
    setFftData(null);
  }, []);

  // Sintonizar frecuencia de excitación exactamente a resonancia (fb = fn)
  const handleTuneToResonance = useCallback(() => {
    setExcitation(prev => ({
      ...prev,
      type: 'harmonic',
      frequency: derived.naturalFreqHz,
    }));
  }, [derived.naturalFreqHz]);

  // Manejo de arrastre manual de la masa con el ratón
  const handleManualTipDisplace = useCallback((deltaU: number) => {
    setSimState(prev => {
      const nextU = Math.max(-0.15, Math.min(0.15, prev.u + deltaU));
      return {
        ...prev,
        u: nextU,
        u_dot: 0, // se suelta desde reposo
        x_tip: prev.xb + nextU,
      };
    });
  }, []);

  // Cargar experimento predefinido
  const handleLoadExperiment = useCallback(
    (newBeam: Partial<BeamParameters>, newExcit: Partial<ExcitationParameters>) => {
      setBeamParams(prev => ({ ...prev, ...newBeam }));
      setExcitation(prev => ({ ...prev, ...newExcit }));
      handleReset();
    },
    [handleReset]
  );

  // Ciclo principal de simulación física en requestAnimationFrame
  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      const dtReal = Math.min(0.05, (now - lastAnimTimeRef.current) / 1000);
      lastAnimTimeRef.current = now;

      if (stateRef.current.isRunning) {
        const timeScale = stateRef.current.timeScale;
        const simDtTotal = dtReal * timeScale;

        // Sub-stepping numérico (pasos fijos de 2 ms para estabilidad RK4 absoluta)
        const subStep = 0.002;
        let elapsed = 0;
        let currentState = stateRef.current;

        while (elapsed < simDtTotal) {
          const stepSize = Math.min(subStep, simDtTotal - elapsed);
          currentState = rk4Step(currentState, derivedRef.current, excitationRef.current, stepSize);
          elapsed += stepSize;
        }

        setSimState(currentState);

        // Muestrear en el buffer a 100 Hz (cada 10 ms simulados)
        if (currentState.t - lastSampleTimeRef.current >= 0.01) {
          lastSampleTimeRef.current = currentState.t;
          const newPoint: TimePoint = {
            t: currentState.t,
            xb: currentState.xb,
            u: currentState.u,
            xtip: currentState.x_tip,
            xb_ddot: currentState.xb_ddot,
          };

          const maxBufferSize = 2048; // ~20 segundos a 100 Hz
          const buf = bufferRef.current;
          if (buf.length >= maxBufferSize) {
            buf.shift();
          }
          buf.push(newPoint);
          setTimeBuffer([...buf]);
        }

        // Recalcular FFT cada 120 ms de tiempo real para que la UI responda instantáneamente sin sobrecargar la CPU
        if (now - lastFFTTimeRef.current > 120 && bufferRef.current.length >= 64) {
          lastFFTTimeRef.current = now;
          const result = analyzeOscillationsFFT(
            bufferRef.current,
            windowType,
            derivedRef.current.naturalFreqHz,
            beamParamsRef.current.dampingRatio
          );
          if (result) {
            setFftData(result);
          }
        }
      }

      animId = requestAnimationFrame(tick);
    };

    lastAnimTimeRef.current = performance.now();
    animId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animId);
  }, [windowType]);

  // Atajos de teclado (Espacio: Play/Pause, R: Reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setSimState(prev => ({ ...prev, isRunning: !prev.isRunning }));
      } else if (e.code === 'KeyR') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-white">
      {/* 1. Barra de Navegación Superior */}
      <Navbar
        onOpenExperiments={() => setIsExperimentsOpen(true)}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAgent={() => setIsAgentOpen(true)}
      />

      {/* 2. Contenedor Principal */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 flex flex-col space-y-6 flex-1">
        {/* Banner Informativo y Pedagógico */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-amber-950/30 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-wider uppercase text-cyan-400">
              Laboratorio Interactivo de Dinámica Estructural
            </span>
            <h2 className="text-lg font-bold text-white">
              Viga Vertical Empotrada con Masa en el Extremo y Base Móvil
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Configura los parámetros elásticos y geométricos de la viga, la masa puntual y el movimiento de la base.
              Observa la amplificación dinámica en resonancia y aplica la{' '}
              <strong className="text-amber-300 font-semibold">Transformada Rápida de Fourier (FFT)</strong> para
              descomponer y analizar el comportamiento vibratorio en el dominio frecuencial.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExperimentsOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-lg shadow-cyan-950/50 flex items-center space-x-2"
            >
              <span>Explorar Prácticas Guiadas</span>
            </button>
          </div>
        </div>

        {/* Fila 1: Simulador Gráfico (Canvas) + Osciloscopio Temporal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Canvas de Animación de la Viga-Masa */}
          <div className="lg:col-span-5 w-full">
            <BeamCanvas
              state={simState}
              beamParams={beamParams}
              derived={derived}
              excitation={excitation}
              onManualTipDisplace={handleManualTipDisplace}
              onReset={handleReset}
            />
          </div>

          {/* Osciloscopio en el Dominio del Tiempo */}
          <div className="lg:col-span-7 w-full">
            <OscilloscopeChart
              timeBuffer={timeBuffer}
              currentTime={simState.t}
              isRunning={simState.isRunning}
            />
          </div>
        </div>

        {/* Fila 2: Espectro de Frecuencia con Transformada de Fourier */}
        <div className="w-full">
          <FourierSpectrumChart
            fftData={fftData}
            derived={derived}
            windowType={windowType}
            onWindowChange={setWindowType}
            maxFreqDisplay={15}
          />
        </div>

        {/* Fila 3: Panel Completo de Parámetros y Control */}
        <div className="w-full">
          <ControlsPanel
            beamParams={beamParams}
            onBeamParamsChange={setBeamParams}
            excitation={excitation}
            onExcitationChange={setExcitation}
            state={simState}
            derived={derived}
            onTogglePlay={() => setSimState(prev => ({ ...prev, isRunning: !prev.isRunning }))}
            onReset={handleReset}
            onTimeScaleChange={scale => setSimState(prev => ({ ...prev, timeScale: scale }))}
            onTuneToResonance={handleTuneToResonance}
          />
        </div>
      </main>

      {/* 3. Pie de página */}
      <footer className="w-full bg-slate-950 border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Laboratorio Virtual de Oscilaciones & Transformada de Fourier • Dania</span>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsTheoryOpen(true)}
              className="text-slate-400 hover:text-white transition"
            >
              Fórmulas y Teoría
            </button>
            <button
              onClick={() => setIsAgentOpen(true)}
              className="text-slate-400 hover:text-white transition"
            >
              Control GitHub & Vercel
            </button>
            <a
              href="https://github.com/crissgabriela/simuladores_dania"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline"
            >
              GitHub Repo
            </a>
          </div>
        </div>
      </footer>

      {/* Modales */}
      <GuidedExperimentsModal
        isOpen={isExperimentsOpen}
        onClose={() => setIsExperimentsOpen(false)}
        onLoadExperiment={handleLoadExperiment}
      />

      <TheoryModal
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
      />

      <DataExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        timeBuffer={timeBuffer}
        fftData={fftData}
      />

      <GitVercelAgentModal
        isOpen={isAgentOpen}
        onClose={() => setIsAgentOpen(false)}
      />
    </div>
  );
};

export default App;
