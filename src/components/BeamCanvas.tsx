import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BeamParameters, ExcitationParameters, PhysicalDerivedValues, SimulationState } from '../types/physics';
import { getBeamDeflectionAtHeight } from '../utils/physicsEngine';
import { ZoomIn, ZoomOut, RotateCcw, Hand, MoveHorizontal } from 'lucide-react';

interface BeamCanvasProps {
  state: SimulationState;
  beamParams: BeamParameters;
  derived: PhysicalDerivedValues;
  excitation: ExcitationParameters;
  onTipDragStart: () => void;
  onTipDragMove: (targetU: number) => void;
  onTipDragEnd: () => void;
  onReset: () => void;
  isDraggingTip: boolean;
}

export const BeamCanvas: React.FC<BeamCanvasProps> = ({
  state,
  beamParams,
  derived,
  onTipDragStart,
  onTipDragMove,
  onTipDragEnd,
  onReset,
  isDraggingTip,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isHoveringTip, setIsHoveringTip] = useState<boolean>(false);

  // Dimensiones lógicas internas del canvas
  const canvasWidth = 600;
  const canvasHeight = 520;

  // Escala de píxeles por metro
  const baseScaleY = 320 / Math.max(0.1, beamParams.length);
  // Escala horizontal para los desplazamientos (exagera visualmente para que sea intuitivo)
  const visualDisplacementScale = 4.0; // 4x para visualización clara de mm

  // Convertir coordenadas del puntero de pantalla (MouseEvent / Touch) a coordenadas internas del canvas
  const getCanvasCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Calcular la posición exacta del centro de la masa puntual en el canvas
  const getTipCanvasCoords = useCallback(() => {
    const centerX = canvasWidth / 2;
    const baseY = canvasHeight - 90;
    const scale = baseScaleY * zoom;
    const baseCanvasX = centerX + state.xb * scale * visualDisplacementScale;
    const tipX = baseCanvasX + state.u * scale * visualDisplacementScale;
    const tipY = baseY - 14 - beamParams.length * scale;
    return { tipX, tipY, scale, centerX, baseY };
  }, [state.xb, state.u, beamParams.length, baseScaleY, zoom, visualDisplacementScale]);

  // Manejo de inicio de arrastre (MouseDown y TouchStart)
  const handleStartDrag = (clientX: number, clientY: number) => {
    const { x, y } = getCanvasCoords(clientX, clientY);
    const { tipX, tipY } = getTipCanvasCoords();
    const tipMassRadius = Math.max(14, Math.min(32, 14 + Math.cbrt(beamParams.tipMass) * 10));
    const hitRadius = Math.max(45, tipMassRadius + 20); // Área de interacción amplia y cómoda

    const dist = Math.hypot(x - tipX, y - tipY);
    if (dist <= hitRadius) {
      onTipDragStart();
    }
  };

  // Manejo del movimiento del puntero
  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      const { x, y } = getCanvasCoords(clientX, clientY);
      const { tipX, tipY, centerX, scale } = getTipCanvasCoords();
      const tipMassRadius = Math.max(14, Math.min(32, 14 + Math.cbrt(beamParams.tipMass) * 10));
      const hitRadius = Math.max(45, tipMassRadius + 20);

      // Comprobar si el cursor está sobre la masa para hover feedback
      const dist = Math.hypot(x - tipX, y - tipY);
      setIsHoveringTip(dist <= hitRadius);

      if (isDraggingTip) {
        // Calcular la deflexión relativa u objetivo:
        // x = centerX + (xb + u) * scale * visualDisplacementScale
        // => u = (x - centerX) / (scale * visualDisplacementScale) - xb
        const totalDispMeters = (x - centerX) / (scale * visualDisplacementScale);
        const targetU = totalDispMeters - state.xb;
        onTipDragMove(targetU);
      }
    },
    [getCanvasCoords, getTipCanvasCoords, beamParams.tipMass, isDraggingTip, state.xb, onTipDragMove]
  );

  // Escuchar eventos globales de arrastre en window para que no se pierda el foco
  useEffect(() => {
    if (!isDraggingTip) return;

    const onWindowMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const onWindowMouseUp = () => {
      onTipDragEnd();
    };

    const onWindowTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onWindowTouchEnd = () => {
      onTipDragEnd();
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
    window.addEventListener('touchmove', onWindowTouchMove, { passive: false });
    window.addEventListener('touchend', onWindowTouchEnd);
    window.addEventListener('touchcancel', onWindowTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
      window.removeEventListener('touchmove', onWindowTouchMove);
      window.removeEventListener('touchend', onWindowTouchEnd);
      window.removeEventListener('touchcancel', onWindowTouchEnd);
    };
  }, [isDraggingTip, handlePointerMove, onTipDragEnd]);

  // Dibujo en el canvas a 60 FPS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Fondo técnico oscuro
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Cuadrícula de referencia
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridStep = 40;
    for (let x = 0; x < canvasWidth; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y < canvasHeight; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    const centerX = canvasWidth / 2;
    const baseY = canvasHeight - 90;
    const scale = baseScaleY * zoom;

    // Coordenadas físicas convertidas a canvas
    const baseCanvasX = centerX + state.xb * scale * visualDisplacementScale;
    const baseWidth = 140;
    const baseHeight = 35;

    // 1. Riel / guía horizontal de la base
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, baseY + baseHeight + 10);
    ctx.lineTo(canvasWidth - 30, baseY + baseHeight + 10);
    ctx.stroke();

    // Marcas de regla en el riel
    ctx.strokeStyle = '#475569';
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (let offsetMm = -100; offsetMm <= 100; offsetMm += 20) {
      const markX = centerX + (offsetMm / 1000) * scale * visualDisplacementScale;
      if (markX > 35 && markX < canvasWidth - 35) {
        ctx.beginPath();
        ctx.moveTo(markX, baseY + baseHeight + 7);
        ctx.lineTo(markX, baseY + baseHeight + 13);
        ctx.stroke();
        if (offsetMm % 40 === 0) {
          ctx.fillText(`${offsetMm}mm`, markX, baseY + baseHeight + 25);
        }
      }
    }

    // Línea central de referencia neutra (x = 0)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX, baseY + baseHeight + 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Plataforma móvil (base del carro)
    ctx.save();
    ctx.translate(baseCanvasX, baseY);

    // Ruedas del carro
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    [-baseWidth / 3, baseWidth / 3].forEach(wheelOffset => {
      ctx.beginPath();
      ctx.arc(wheelOffset, baseHeight + 5, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(wheelOffset, baseHeight + 5, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.fillStyle = '#64748b';
    });

    // Cuerpo del carro
    const baseGrad = ctx.createLinearGradient(0, 0, 0, baseHeight);
    baseGrad.addColorStop(0, '#334155');
    baseGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = baseGrad;
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-baseWidth / 2, 0, baseWidth, baseHeight, 6);
    ctx.fill();
    ctx.stroke();

    // Empotramiento / Mordaza en la base
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-22, -14, 44, 14);
    ctx.strokeRect(-22, -14, 44, 14);

    // Tornillos de fijación
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.arc(-12, -7, 2.5, 0, Math.PI * 2);
    ctx.arc(12, -7, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Texto descriptivo en la base
    ctx.fillStyle = '#93c5fd';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BASE MÓVIL (xb)', 0, 16);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`xb: ${(state.xb * 1000).toFixed(1)} mm`, 0, 28);
    ctx.restore();

    // 3. Viga elástica continua flexionada
    const numSegments = 32;
    const beamPoints: { x: number; y: number }[] = [];
    const L = beamParams.length;

    for (let i = 0; i <= numSegments; i++) {
      const z = (i / numSegments) * L;
      const deflectionMeters = getBeamDeflectionAtHeight(z, L, state.u);
      const canvasY = baseY - 14 - (z / L) * (L * scale);
      const canvasX = baseCanvasX + deflectionMeters * scale * visualDisplacementScale;
      beamPoints.push({ x: canvasX, y: canvasY });
    }

    const beamThickness = Math.max(
      4,
      Math.min(14, (beamParams.crossSection === 'circular' ? beamParams.diameter || 0.01 : beamParams.height || 0.005) * 800)
    );

    const absDeflection = Math.abs(state.u);
    const stressRatio = Math.min(1, absDeflection / 0.04);
    const beamColor = `hsl(${210 - stressRatio * 60}, ${80}%, ${65}%)`;

    ctx.beginPath();
    ctx.moveTo(beamPoints[0].x, beamPoints[0].y);
    for (let i = 1; i < beamPoints.length; i++) {
      ctx.lineTo(beamPoints[i].x, beamPoints[i].y);
    }
    ctx.strokeStyle = beamColor;
    ctx.lineWidth = beamThickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 + stressRatio * 0.3})`;
    ctx.lineWidth = beamThickness + 6;
    ctx.stroke();

    // 4. Masa Puntual en el Extremo Superior
    const tipPoint = beamPoints[beamPoints.length - 1];
    const tipMassRadius = Math.max(14, Math.min(32, 14 + Math.cbrt(beamParams.tipMass) * 10));

    ctx.save();
    ctx.translate(tipPoint.x, tipPoint.y);

    // Halo interactivo de arrastre o hover
    if (isDraggingTip || isHoveringTip) {
      ctx.beginPath();
      ctx.arc(0, 0, tipMassRadius + 12, 0, Math.PI * 2);
      ctx.fillStyle = isDraggingTip ? 'rgba(245, 158, 11, 0.45)' : 'rgba(56, 189, 248, 0.35)';
      ctx.fill();

      // Anillo exterior pulsante
      ctx.beginPath();
      ctx.arc(0, 0, tipMassRadius + 18, 0, Math.PI * 2);
      ctx.strokeStyle = isDraggingTip ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Esfera / Cilindro de la masa
    const massGrad = ctx.createRadialGradient(-5, -5, 2, 0, 0, tipMassRadius);
    massGrad.addColorStop(0, '#fef08a');
    massGrad.addColorStop(0.4, '#f59e0b');
    massGrad.addColorStop(1, '#92400e');

    ctx.beginPath();
    ctx.arc(0, 0, tipMassRadius, 0, Math.PI * 2);
    ctx.fillStyle = massGrad;
    ctx.fill();
    ctx.strokeStyle = isDraggingTip ? '#ffffff' : '#d97706';
    ctx.lineWidth = isDraggingTip ? 3 : 2;
    ctx.stroke();

    // Anillo central
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Texto de la masa
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${beamParams.tipMass} kg`, 0, tipMassRadius + 15);

    ctx.restore();

    // 5. Cotas de deflexión relativa u(t) y posición absoluta xtip
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    ctx.moveTo(baseCanvasX, tipPoint.y - 10);
    ctx.lineTo(baseCanvasX, tipPoint.y + 10);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(baseCanvasX, tipPoint.y);
    ctx.lineTo(tipPoint.x, tipPoint.y);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = tipPoint.x >= baseCanvasX ? 'left' : 'right';
    const textOffset = tipPoint.x >= baseCanvasX ? 12 : -12;
    ctx.fillText(`u: ${(state.u * 1000).toFixed(1)} mm`, tipPoint.x + textOffset, tipPoint.y - 6);
    ctx.restore();

    // Marcador de posición absoluta xtip en la parte superior
    ctx.save();
    ctx.fillStyle = '#10b981';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`xtip (abs): ${(state.x_tip * 1000).toFixed(1)} mm`, tipPoint.x, 32);
    ctx.restore();

    // Mensaje de ayuda si está arrastrando
    if (isDraggingTip) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Soltando la masa iniciará la oscilación libre desde esta posición', canvasWidth / 2, 48);
    }
  }, [state, beamParams, derived, zoom, baseScaleY, visualDisplacementScale, isDraggingTip, isHoveringTip]);

  return (
    <div className="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center">
      {/* Barra superior de herramientas del canvas */}
      <div className="w-full px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isDraggingTip ? 'bg-amber-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
          <span className="font-semibold text-slate-200">
            {isDraggingTip ? 'Arrastre Manual Activo' : 'Simulación Mecánica en Tiempo Real'}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-cyan-400 font-mono">f_n = {derived.naturalFreqHz.toFixed(2)} Hz</span>
          <span className="text-amber-400 font-mono">Q = {derived.qualityFactor.toFixed(1)}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setZoom(z => Math.max(0.6, z - 0.1))}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
            title="Reducir zoom"
          >
            <ZoomOut size={15} />
          </button>
          <span className="px-1 text-slate-400 font-mono text-[11px]">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(1.8, z + 0.1))}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
            title="Aumentar zoom"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={() => {
              setZoom(1.0);
              onReset();
            }}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition ml-1"
            title="Restablecer vista"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Contenedor del Canvas con eventos de Mouse y Touch */}
      <div
        className={`relative w-full flex justify-center py-2 select-none ${
          isDraggingTip ? 'cursor-grabbing' : isHoveringTip ? 'cursor-grab' : 'cursor-default'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={e => handleStartDrag(e.clientX, e.clientY)}
          onMouseMove={e => handlePointerMove(e.clientX, e.clientY)}
          onTouchStart={e => {
            if (e.touches.length > 0) {
              handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          className="rounded-lg shadow-inner max-w-full h-auto touch-none"
        />

        {/* Guía interactiva flotante permanente para que el usuario sepa que puede arrastrar */}
        {!isDraggingTip && (
          <div className="absolute top-16 pointer-events-none bg-slate-900/90 border border-amber-500/40 text-amber-300 px-3.5 py-1.5 rounded-full text-xs flex items-center space-x-2 shadow-lg backdrop-blur-sm animate-pulse">
            <Hand size={15} className="text-amber-400" />
            <span>Haz clic o toca la masa amarilla para arrastrarla</span>
          </div>
        )}
      </div>

      {/* Leyenda en pie de canvas */}
      <div className="w-full px-4 py-2 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-around text-[11px] text-slate-400">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-1.5 rounded bg-cyan-400"></span>
          <span>Base móvil <code className="text-cyan-300 font-mono">xb(t)</code></span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-1.5 rounded bg-amber-400"></span>
          <span>Deflexión relativa <code className="text-amber-300 font-mono">u(t)</code></span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-1.5 rounded bg-emerald-400"></span>
          <span>Extremo absoluto <code className="text-emerald-300 font-mono">xtip = xb + u</code></span>
        </div>
      </div>
    </div>
  );
};
