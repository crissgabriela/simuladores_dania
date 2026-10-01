import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BeamParameters, ExcitationParameters, PhysicalDerivedValues, SimulationState } from '../types/physics';
import { getBeamDeflectionAtHeight } from '../utils/physicsEngine';
import { MoveHorizontal, ZoomIn, ZoomOut, RotateCcw, Hand } from 'lucide-react';

interface BeamCanvasProps {
  state: SimulationState;
  beamParams: BeamParameters;
  derived: PhysicalDerivedValues;
  excitation: ExcitationParameters;
  onManualTipDisplace: (deltaU: number) => void;
  onReset: () => void;
}

export const BeamCanvas: React.FC<BeamCanvasProps> = ({
  state,
  beamParams,
  derived,
  onManualTipDisplace,
  onReset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);

  // Dimensiones lógicas del canvas
  const canvasWidth = 600;
  const canvasHeight = 520;

  // Escala de píxeles por metro
  // Si la viga mide L metros, queremos que ocupe ~300px verticalmente
  const baseScaleY = 320 / Math.max(0.1, beamParams.length);
  // Escala horizontal para los desplazamientos (exagera visualmente para que sea intuitivo)
  const visualDisplacementScale = 4.0; // 4x para visualización clara de mm

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Verificar si el click está cerca del extremo superior (masa)
    const centerX = canvasWidth / 2;
    const baseY = canvasHeight - 80;
    const tipY = baseY - beamParams.length * baseScaleY * zoom;
    const tipX = centerX + (state.xb + state.u * visualDisplacementScale) * baseScaleY * zoom;

    const dist = Math.hypot(clickX - tipX, clickY - tipY);
    if (dist < 35) {
      setIsDragging(true);
      setDragStartX(clickX);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const dxPx = currentX - dragStartX;
    const dxMeters = dxPx / (baseScaleY * zoom * visualDisplacementScale);
    onManualTipDisplace(dxMeters);
    setDragStartX(currentX);
  }, [isDragging, dragStartX, baseScaleY, zoom, visualDisplacementScale, onManualTipDisplace]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Dibujo en el canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Fondo con cuadrícula técnica sutil
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

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
    // La base se desplaza con xb
    const baseCanvasX = centerX + state.xb * scale * visualDisplacementScale;
    const baseWidth = 140;
    const baseHeight = 35;

    // 1. Dibujar riel / guía horizontal de la base
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

    // Línea central de referencia (x = 0)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX, baseY + baseHeight + 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Dibujar plataforma móvil (base del carro)
    // Carrito
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

    // Tornillos de fijación del empotramiento
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.arc(-12, -7, 2.5, 0, Math.PI * 2);
    ctx.arc(12, -7, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Texto en la base
    ctx.fillStyle = '#93c5fd';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BASE MÓVIL (xb)', 0, 16);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`xb: ${(state.xb * 1000).toFixed(1)} mm`, 0, 28);

    ctx.restore();

    // 3. Dibujar viga elástica flexionada
    // Se muestrean 30 puntos a lo largo de la altura z de 0 a L
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

    // Grosor visual de la viga en función de las dimensiones reales
    const beamThickness = Math.max(
      4,
      Math.min(14, (beamParams.crossSection === 'circular' ? beamParams.diameter || 0.01 : beamParams.height || 0.005) * 800)
    );

    // Trazar línea de viga con degradado de esfuerzo
    // Cuanto mayor sea la flexión, más brillante es la base (concentración de momentos)
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

    // Glow effect en la viga
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 + stressRatio * 0.3})`;
    ctx.lineWidth = beamThickness + 6;
    ctx.stroke();

    // 4. Dibujar la Masa en el Extremo Superior
    const tipPoint = beamPoints[beamPoints.length - 1];
    const tipMassRadius = Math.max(14, Math.min(32, 14 + Math.cbrt(beamParams.tipMass) * 10));

    ctx.save();
    ctx.translate(tipPoint.x, tipPoint.y);

    // Halo interactivo si se está arrastrando o hover
    if (isDragging) {
      ctx.beginPath();
      ctx.arc(0, 0, tipMassRadius + 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.fill();
    }

    // Sombra de masa
    const massGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, tipMassRadius);
    massGrad.addColorStop(0, '#fde68a');
    massGrad.addColorStop(0.4, '#f59e0b');
    massGrad.addColorStop(1, '#b45309');

    ctx.beginPath();
    ctx.arc(0, 0, tipMassRadius, 0, Math.PI * 2);
    ctx.fillStyle = massGrad;
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Anillo metálico de montaje
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
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
    ctx.fillText(`${beamParams.tipMass} kg`, 0, tipMassRadius + 14);

    ctx.restore();

    // 5. Vectores y Marcadores Informativos en Canvas
    // Marcador de deflexión relativa u(t)
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    // Línea vertical desde la posición recta proyectada de la base
    ctx.beginPath();
    ctx.moveTo(baseCanvasX, tipPoint.y - 10);
    ctx.lineTo(baseCanvasX, tipPoint.y + 10);
    ctx.stroke();

    // Cota horizontal para u
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(baseCanvasX, tipPoint.y);
    ctx.lineTo(tipPoint.x, tipPoint.y);
    ctx.stroke();

    // Flechitas para u
    ctx.fillStyle = '#f59e0b';
    ctx.font = '11px monospace';
    ctx.textAlign = tipPoint.x >= baseCanvasX ? 'left' : 'right';
    const textOffset = tipPoint.x >= baseCanvasX ? 10 : -10;
    ctx.fillText(`u: ${(state.u * 1000).toFixed(1)} mm`, tipPoint.x + textOffset, tipPoint.y - 5);
    ctx.restore();

    // Marcador de posición absoluta xtip
    ctx.save();
    ctx.fillStyle = '#10b981';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`xtip (abs): ${(state.x_tip * 1000).toFixed(1)} mm`, tipPoint.x, 35);
    ctx.restore();

    // Cartel explicativo de interacción
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('💡 Arrastra la masa amarilla con el mouse para aplicar desplazamiento inicial', 14, canvasHeight - 15);
  }, [state, beamParams, derived, zoom, baseScaleY, visualDisplacementScale, isDragging]);

  return (
    <div className="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center">
      {/* Barra superior de herramientas del canvas */}
      <div className="w-full px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-200">Simulación Mecánica en Tiempo Real</span>
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

      {/* Contenedor del Canvas */}
      <div className="relative cursor-grab active:cursor-grabbing w-full flex justify-center py-2">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleMouseDown}
          className="rounded-lg shadow-inner max-w-full h-auto"
        />

        {/* Guía flotante de arrastre si no se está moviendo */}
        {Math.abs(state.u) < 0.001 && Math.abs(state.xb) < 0.001 && (
          <div className="absolute top-16 pointer-events-none bg-slate-800/90 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-full text-xs flex items-center space-x-2 shadow-lg animate-bounce">
            <Hand size={14} className="text-amber-400" />
            <span>Haz clic y estira la masa con el ratón</span>
          </div>
        )}
      </div>

      {/* Leyenda de canales en pie de canvas */}
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
          <span>Posición total del extremo <code className="text-emerald-300 font-mono">xtip = xb + u</code></span>
        </div>
      </div>
    </div>
  );
};
