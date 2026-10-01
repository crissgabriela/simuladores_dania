import React, { useRef, useEffect, useState } from 'react';
import { TimePoint } from '../types/physics';
import { Eye, EyeOff, Activity, Clock, Maximize2 } from 'lucide-react';

interface OscilloscopeChartProps {
  timeBuffer: TimePoint[];
  currentTime: number;
  isRunning: boolean;
}

export const OscilloscopeChart: React.FC<OscilloscopeChartProps> = ({
  timeBuffer,
  currentTime,
  isRunning,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showXb, setShowXb] = useState<boolean>(true);
  const [showU, setShowU] = useState<boolean>(true);
  const [showXtip, setShowXtip] = useState<boolean>(true);
  const [showAccel, setShowAccel] = useState<boolean>(false);
  const [timeWindowSec, setTimeWindowSec] = useState<number>(6.0); // Ver últimos 6 segundos
  const [autoScale, setAutoScale] = useState<boolean>(true);
  const [fixedRangeMm, setFixedRangeMm] = useState<number>(30); // mm

  const width = 640;
  const height = 260;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Fondo oscuro técnico
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Filtrar los datos correspondientes a la ventana de tiempo
    const minT = Math.max(0, currentTime - timeWindowSec);
    const visiblePoints = timeBuffer.filter(p => p.t >= minT && p.t <= currentTime);

    // Determinar rango vertical (en metros)
    let maxValMeters = (fixedRangeMm / 1000);
    if (autoScale && visiblePoints.length > 0) {
      let maxAbs = 0.005; // mínimo 5mm
      visiblePoints.forEach(p => {
        if (showXb) maxAbs = Math.max(maxAbs, Math.abs(p.xb));
        if (showU) maxAbs = Math.max(maxAbs, Math.abs(p.u));
        if (showXtip) maxAbs = Math.max(maxAbs, Math.abs(p.xtip));
        if (showAccel) maxAbs = Math.max(maxAbs, Math.abs(p.xb_ddot) * 0.002);
      });
      maxValMeters = maxAbs * 1.25; // 25% de margen
    }

    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;
    const plotW = width - paddingLeft - paddingRight;
    const plotH = height - paddingTop - paddingBottom;
    const centerY = paddingTop + plotH / 2;

    // Cuadrícula y divisiones de tiempo y amplitud
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // Líneas horizontales de amplitud (5 divisiones)
    const yDivs = 4;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';

    for (let i = -yDivs; i <= yDivs; i++) {
      const yNorm = i / yDivs;
      const py = centerY - yNorm * (plotH / 2);
      const valMm = (yNorm * maxValMeters * 1000).toFixed(1);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, py);
      ctx.lineTo(width - paddingRight, py);
      ctx.stroke();

      if (i % 2 === 0) {
        ctx.fillText(`${valMm} mm`, paddingLeft - 6, py + 3);
      }
    }

    // Eje horizontal central t
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, centerY);
    ctx.lineTo(width - paddingRight, centerY);
    ctx.stroke();

    // Líneas verticales de tiempo
    ctx.textAlign = 'center';
    const numTimeSteps = 6;
    for (let i = 0; i <= numTimeSteps; i++) {
      const px = paddingLeft + (i / numTimeSteps) * plotW;
      const tVal = (minT + (i / numTimeSteps) * timeWindowSec).toFixed(1);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, paddingTop);
      ctx.lineTo(px, height - paddingBottom);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.fillText(`${tVal}s`, px, height - 12);
    }

    // Función de mapeo (t, val) -> (canvasX, canvasY)
    const mapX = (t: number) => paddingLeft + ((t - minT) / timeWindowSec) * plotW;
    const mapY = (val: number) => centerY - (val / maxValMeters) * (plotH / 2);

    if (visiblePoints.length > 1) {
      // 1. Trazado de xb(t) - Base (Cyan)
      if (showXb) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        visiblePoints.forEach((p, idx) => {
          const x = mapX(p.t);
          const y = mapY(p.xb);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // 2. Trazado de u(t) - Deflexión relativa (Amber)
      if (showU) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        visiblePoints.forEach((p, idx) => {
          const x = mapX(p.t);
          const y = mapY(p.u);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // 3. Trazado de xtip(t) - Posición absoluta (Emerald)
      if (showXtip) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        visiblePoints.forEach((p, idx) => {
          const x = mapX(p.t);
          const y = mapY(p.xtip);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // 4. Trazado de aceleración de base xb_ddot (Purple)
      if (showAccel) {
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        visiblePoints.forEach((p, idx) => {
          const x = mapX(p.t);
          // Escalado para visualización
          const y = mapY(p.xb_ddot * 0.002);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Cabezal de tiempo actual (línea vertical a la derecha)
    const currentX = mapX(currentTime);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(currentX, paddingTop);
    ctx.lineTo(currentX, height - paddingBottom);
    ctx.stroke();

    // Valores instantáneos en la esquina superior
    if (visiblePoints.length > 0) {
      const last = visiblePoints[visiblePoints.length - 1];
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`xb: ${(last.xb * 1000).toFixed(2)} mm`, paddingLeft + 10, paddingTop + 14);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`u: ${(last.u * 1000).toFixed(2)} mm`, paddingLeft + 120, paddingTop + 14);
      ctx.fillStyle = '#10b981';
      ctx.fillText(`xtip: ${(last.xtip * 1000).toFixed(2)} mm`, paddingLeft + 230, paddingTop + 14);
    }
  }, [timeBuffer, currentTime, timeWindowSec, autoScale, fixedRangeMm, showXb, showU, showXtip, showAccel, isRunning]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
      {/* Barra de cabecera */}
      <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <Activity size={16} className="text-cyan-400" />
          <span className="font-semibold text-slate-200">Osciloscopio / Señales en el Dominio del Tiempo</span>
        </div>

        {/* Controles de ventana de tiempo y escala */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <Clock size={13} className="text-slate-400" />
            <select
              value={timeWindowSec}
              onChange={e => setTimeWindowSec(Number(e.target.value))}
              aria-label="Ventana de tiempo"
              className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2 py-0.5 text-[11px] focus:outline-none focus:border-cyan-500"
            >
              <option value={3}>3 segundos</option>
              <option value={6}>6 segundos</option>
              <option value={10}>10 segundos</option>
              <option value={20}>20 segundos</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setAutoScale(!autoScale)}
              className={`px-2 py-0.5 rounded text-[11px] transition ${
                autoScale ? 'bg-cyan-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Escalado vertical automático"
            >
              Auto Escala
            </button>
          </div>
        </div>
      </div>

      {/* Canvas del Osciloscopio */}
      <div className="w-full flex justify-center py-2 px-2">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="rounded shadow max-w-full h-auto"
        />
      </div>

      {/* Barra de activación de canales */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowXb(!showXb)}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded transition text-[11px] ${
              showXb ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            {showXb ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>Base xb(t)</span>
          </button>

          <button
            onClick={() => setShowU(!showU)}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded transition text-[11px] ${
              showU ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            {showU ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>Deflexión Relativa u(t)</span>
          </button>

          <button
            onClick={() => setShowXtip(!showXtip)}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded transition text-[11px] ${
              showXtip ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            {showXtip ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>Extremo Absoluto xtip(t)</span>
          </button>

          <button
            onClick={() => setShowAccel(!showAccel)}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded transition text-[11px] ${
              showAccel ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            {showAccel ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>Acel. Base xb''(t)</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500 italic">
          {isRunning ? '🟢 Adquiriendo datos en tiempo real' : '⏸ Pausado'}
        </span>
      </div>
    </div>
  );
};
