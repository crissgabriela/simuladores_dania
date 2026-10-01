import React, { useRef, useEffect, useState } from 'react';
import { FFTResult, PhysicalDerivedValues, WindowFunction } from '../types/physics';
import { BarChart2, Layers, Info, CheckCircle2, TrendingUp, Sliders } from 'lucide-react';

interface FourierSpectrumChartProps {
  fftData: FFTResult | null;
  derived: PhysicalDerivedValues;
  windowType: WindowFunction;
  onWindowChange: (w: WindowFunction) => void;
  maxFreqDisplay?: number;
}

export const FourierSpectrumChart: React.FC<FourierSpectrumChartProps> = ({
  fftData,
  derived,
  windowType,
  onWindowChange,
  maxFreqDisplay = 15,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scaleMode, setScaleMode] = useState<'linear' | 'db'>('linear');
  const [showTheoretical, setShowTheoretical] = useState<boolean>(true);
  const [showBaseSpectrum, setShowBaseSpectrum] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ freq: number; mag: number } | null>(null);
  const [maxFreq, setMaxFreq] = useState<number>(maxFreqDisplay);

  const width = 640;
  const height = 280;

  // Dibujo del espectro en canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Fondo técnico
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const paddingLeft = 55;
    const paddingRight = 25;
    const paddingTop = 25;
    const paddingBottom = 40;
    const plotW = width - paddingLeft - paddingRight;
    const plotH = height - paddingTop - paddingBottom;

    if (!fftData || fftData.frequencies.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Adquiriendo suficientes muestras para la Transformada Rápida de Fourier...', width / 2, height / 2);
      return;
    }

    const { frequencies, magnitudeU, magnitudeXb, theoreticalFRF } = fftData;

    // Filtrar hasta maxFreq
    const validIndices: number[] = [];
    for (let i = 0; i < frequencies.length; i++) {
      if (frequencies[i] <= maxFreq) {
        validIndices.push(i);
      }
    }

    if (validIndices.length < 2) return;

    // Rango vertical
    let maxY = 0.001; // en mm o magnitud
    validIndices.forEach(i => {
      const uMm = magnitudeU[i] * 1000;
      if (uMm > maxY) maxY = uMm;
      if (showBaseSpectrum) {
        const xbMm = magnitudeXb[i] * 1000;
        if (xbMm > maxY) maxY = xbMm;
      }
    });

    // Margen superior
    maxY = Math.max(1, maxY * 1.25);

    // Mapeo (f, y) -> (canvasX, canvasY)
    const mapX = (f: number) => paddingLeft + (f / maxFreq) * plotW;
    const mapY = (valMm: number) => {
      if (scaleMode === 'db') {
        // Rango de -60 dB a 10 dB
        const db = 20 * Math.log10(Math.max(1e-4, valMm) / 1.0);
        const minDb = -60;
        const maxDb = 20;
        const norm = (db - minDb) / (maxDb - minDb);
        return paddingTop + (1 - Math.max(0, Math.min(1, norm))) * plotH;
      } else {
        return paddingTop + (1 - Math.min(1, Math.max(0, valMm / maxY))) * plotH;
      }
    };

    // Cuadrícula y escalas
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // Líneas horizontales
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';

    if (scaleMode === 'linear') {
      const numStepsY = 5;
      for (let s = 0; s <= numStepsY; s++) {
        const val = (s / numStepsY) * maxY;
        const py = mapY(val);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, py);
        ctx.lineTo(width - paddingRight, py);
        ctx.stroke();
        ctx.fillText(`${val.toFixed(1)} mm`, paddingLeft - 6, py + 3);
      }
    } else {
      [-60, -40, -20, 0, 20].forEach(db => {
        const minDb = -60;
        const maxDb = 20;
        const norm = (db - minDb) / (maxDb - minDb);
        const py = paddingTop + (1 - norm) * plotH;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, py);
        ctx.lineTo(width - paddingRight, py);
        ctx.stroke();
        ctx.fillText(`${db} dB`, paddingLeft - 6, py + 3);
      });
    }

    // Ejes y marcas de frecuencia (Hz)
    ctx.textAlign = 'center';
    const freqStep = maxFreq <= 10 ? 1 : maxFreq <= 25 ? 2 : 5;
    for (let f = 0; f <= maxFreq; f += freqStep) {
      const px = mapX(f);
      ctx.beginPath();
      ctx.moveTo(px, paddingTop);
      ctx.lineTo(px, height - paddingBottom);
      ctx.stroke();
      ctx.fillText(`${f} Hz`, px, height - paddingBottom + 16);
    }

    // Eje base X
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, height - paddingBottom);
    ctx.lineTo(width - paddingRight, height - paddingBottom);
    ctx.stroke();

    // 1. Trazado del espectro de la BASE (Cyan) si está activado
    if (showBaseSpectrum) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      validIndices.forEach((idx, i) => {
        const x = mapX(frequencies[idx]);
        const y = mapY(magnitudeXb[idx] * 1000);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // 2. Curva Teórica DAF / FRF overlay (Gris azulado punteado)
    if (showTheoretical && theoreticalFRF && theoreticalFRF.length > 0) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);

      // Normalizar la curva teórica respecto a la amplitud máxima observada
      const maxTheo = Math.max(...theoreticalFRF.map(p => p.magnitude));
      const scaleTheo = (maxY * 0.85) / Math.max(1, maxTheo);

      ctx.beginPath();
      let first = true;
      theoreticalFRF.forEach(pt => {
        if (pt.freq <= maxFreq) {
          const x = mapX(pt.freq);
          const y = mapY(pt.magnitude * scaleTheo);
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Trazado principal del Espectro de la MASA U(f) (Amber con degradado)
    const amberGrad = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
    amberGrad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
    amberGrad.addColorStop(1, 'rgba(245, 158, 11, 0.02)');

    ctx.fillStyle = amberGrad;
    ctx.beginPath();
    ctx.moveTo(mapX(frequencies[validIndices[0]]), height - paddingBottom);

    validIndices.forEach(idx => {
      const x = mapX(frequencies[idx]);
      const y = mapY(magnitudeU[idx] * 1000);
      ctx.lineTo(x, y);
    });

    ctx.lineTo(mapX(frequencies[validIndices[validIndices.length - 1]]), height - paddingBottom);
    ctx.closePath();
    ctx.fill();

    // Línea de contorno para U(f)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    validIndices.forEach((idx, i) => {
      const x = mapX(frequencies[idx]);
      const y = mapY(magnitudeU[idx] * 1000);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 4. Marcador de Frecuencia Natural Teórica fn (Línea roja punteada)
    const fnX = mapX(derived.naturalFreqHz);
    if (fnX >= paddingLeft && fnX <= width - paddingRight) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(fnX, paddingTop);
      ctx.lineTo(fnX, height - paddingBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`fn teórica: ${derived.naturalFreqHz.toFixed(2)} Hz`, fnX, paddingTop - 7);
    }

    // 5. Marcador de Pico Espectral Detectado (Círculo y valor)
    if (fftData.peakFrequencyU > 0 && fftData.peakFrequencyU <= maxFreq) {
      const peakX = mapX(fftData.peakFrequencyU);
      const peakY = mapY(fftData.peakMagnitudeU * 1000);

      ctx.beginPath();
      ctx.arc(peakX, peakY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Etiqueta del pico
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = peakX > width - 120 ? 'right' : 'left';
      const offset = peakX > width - 120 ? -10 : 10;
      ctx.fillText(
        `f_pico = ${fftData.peakFrequencyU.toFixed(2)} Hz (${(fftData.peakMagnitudeU * 1000).toFixed(1)} mm)`,
        peakX + offset,
        peakY - 10
      );
    }
  }, [fftData, derived, windowType, scaleMode, showTheoretical, showBaseSpectrum, maxFreq]);

  // Cálculo de discrepancia entre teoría y FFT
  const peakFreq = fftData?.peakFrequencyU || 0;
  const theoryFn = derived.naturalFreqHz;
  const freqDiff = Math.abs(peakFreq - theoryFn);
  const percentError = theoryFn > 0 ? (freqDiff / theoryFn) * 100 : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
      {/* Barra superior de herramientas */}
      <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <BarChart2 size={16} className="text-amber-400" />
          <span className="font-semibold text-slate-200">Espectro de Amplitud FFT / Dominio de la Frecuencia</span>
        </div>

        {/* Controles de ventana, escala y filtro */}
        <div className="flex items-center space-x-2.5 text-xs">
          {/* Selector de Función Ventana */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400">Ventana:</span>
            <select
              value={windowType}
              onChange={e => onWindowChange(e.target.value as WindowFunction)}
              aria-label="Función ventana"
              className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2 py-0.5 text-[11px] focus:outline-none focus:border-amber-500"
            >
              <option value="hann">Hann (Hanning)</option>
              <option value="hamming">Hamming</option>
              <option value="blackman">Blackman</option>
              <option value="flattop">Flat-Top</option>
              <option value="rect">Rectangular (Ninguna)</option>
            </select>
          </div>

          {/* Rango de Frecuencias */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400">Frecuencia máx:</span>
            <select
              value={maxFreq}
              onChange={e => setMaxFreq(Number(e.target.value))}
              aria-label="Frecuencia máxima mostrada"
              className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2 py-0.5 text-[11px] focus:outline-none focus:border-amber-500"
            >
              <option value={10}>10 Hz</option>
              <option value={15}>15 Hz</option>
              <option value={25}>25 Hz</option>
              <option value={50}>50 Hz</option>
            </select>
          </div>

          {/* Escala Lineal / dB */}
          <div className="flex bg-slate-950 border border-slate-700 rounded p-0.5">
            <button
              onClick={() => setScaleMode('linear')}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                scaleMode === 'linear' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lineal
            </button>
            <button
              onClick={() => setScaleMode('db')}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                scaleMode === 'db' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              dB
            </button>
          </div>
        </div>
      </div>

      {/* Canvas del Espectro FFT */}
      <div className="w-full flex justify-center py-2 px-2">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="rounded shadow max-w-full h-auto"
        />
      </div>

      {/* Barra de diagnóstico e inferencia de resonancia */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Comparación analítica vs FFT */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
            <span className="text-slate-400">f_n Teórica:</span>
            <span className="font-mono text-cyan-400 font-bold">{derived.naturalFreqHz.toFixed(2)} Hz</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
            <span className="text-slate-400">Pico FFT Medido:</span>
            <span className="font-mono text-amber-400 font-bold">{peakFreq.toFixed(2)} Hz</span>
          </div>

          {peakFreq > 0 && (
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded text-[11px] ${
                percentError < 5
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : percentError < 15
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Concordancia: {(100 - Math.min(100, percentError)).toFixed(1)}% (Error: {percentError.toFixed(1)}%)</span>
            </div>
          )}
        </div>

        {/* Toggles de curvas */}
        <div className="flex items-center space-x-3 text-[11px]">
          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={showBaseSpectrum}
              onChange={e => setShowBaseSpectrum(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span className="text-cyan-400">|Xb(f)| Base</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={showTheoretical}
              onChange={e => setShowTheoretical(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-slate-400 focus:ring-0"
            />
            <span className="text-slate-400">DAF(f) Teórico</span>
          </label>
        </div>
      </div>
    </div>
  );
};
