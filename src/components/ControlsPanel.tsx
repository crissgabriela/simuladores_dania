import React from 'react';
import {
  BeamParameters,
  ExcitationParameters,
  ExcitationType,
  PhysicalDerivedValues,
  SimulationState,
} from '../types/physics';
import { MATERIAL_PRESETS } from '../utils/physicsEngine';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Zap,
  Sliders,
  Settings2,
  Activity,
  Waves,
  Sparkles,
} from 'lucide-react';

interface ControlsPanelProps {
  beamParams: BeamParameters;
  onBeamParamsChange: (params: BeamParameters) => void;
  excitation: ExcitationParameters;
  onExcitationChange: (params: ExcitationParameters) => void;
  state: SimulationState;
  derived: PhysicalDerivedValues;
  onTogglePlay: () => void;
  onReset: () => void;
  onTimeScaleChange: (scale: number) => void;
  onTuneToResonance: () => void;
  onManualDisplace?: (uMeters: number) => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  beamParams,
  onBeamParamsChange,
  excitation,
  onExcitationChange,
  state,
  derived,
  onTogglePlay,
  onReset,
  onTimeScaleChange,
  onTuneToResonance,
  onManualDisplace,
}) => {
  // Manejo de cambio de material predefinido
  const handleMaterialSelect = (name: string) => {
    const preset = MATERIAL_PRESETS.find(p => p.name === name);
    if (preset) {
      onBeamParamsChange({
        ...beamParams,
        youngModulus: preset.youngModulus,
        density: preset.density,
        dampingRatio: preset.typicalZeta,
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col space-y-6 text-slate-200">
      {/* 1. Barra de Control de Ejecución Principal */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-lg border border-slate-800">
        <div className="flex items-center space-x-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-sm transition shadow-lg ${
              state.isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
            }`}
          >
            {state.isRunning ? (
              <>
                <Pause size={17} /> <span>Pausar</span>
              </>
            ) : (
              <>
                <Play size={17} /> <span>Iniciar</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition border border-slate-700"
            title="Reiniciar simulación"
          >
            <RotateCcw size={15} />
            <span>Reiniciar</span>
          </button>
        </div>

        {/* Velocidad de la simulación */}
        <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
          <span className="text-xs text-slate-400">Velocidad:</span>
          {[0.25, 0.5, 1.0, 2.0].map(s => (
            <button
              key={s}
              onClick={() => onTimeScaleChange(s)}
              className={`px-2 py-0.5 rounded text-xs transition ${
                state.timeScale === s
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Flexión manual rápida */}
        {onManualDisplace && (
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
            <span className="text-xs text-slate-400">Flexión inicial:</span>
            {[-0.03, -0.015, 0, 0.015, 0.03].map(v => (
              <button
                key={v}
                onClick={() => onManualDisplace(v)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition ${
                  Math.abs(state.u - v) < 0.002
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={`Desplazar masa a ${v * 1000} mm y soltar`}
              >
                {v === 0 ? '0' : (v > 0 ? '+' : '') + (v * 1000).toFixed(0)}
              </button>
            ))}
            <span className="text-[10px] text-slate-500">mm</span>
          </div>
        )}
      </div>

      {/* 2. Tarjetas de Parámetros Derivados del Sistema (Física y Resonancia) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[11px] text-slate-400">Frecuencia Natural (fn)</span>
          <span className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
            {derived.naturalFreqHz.toFixed(2)} <span className="text-xs font-normal">Hz</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-1">
            ωn = {derived.naturalFreqRad.toFixed(1)} rad/s
          </span>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[11px] text-slate-400">Rigidez Equiv. (k)</span>
          <span className="text-lg font-bold text-amber-400 font-mono mt-0.5">
            {derived.equivalentStiffness.toFixed(1)} <span className="text-xs font-normal">N/m</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-1">k = 3EI / L³</span>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[11px] text-slate-400">Masa Efectiva (meff)</span>
          <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
            {derived.effectiveMass.toFixed(3)} <span className="text-xs font-normal">kg</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-1">
            Masa viga: {derived.beamMass.toFixed(3)} kg
          </span>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[11px] text-slate-400">Factor de Calidad (Q)</span>
          <span className="text-lg font-bold text-purple-400 font-mono mt-0.5">
            {derived.qualityFactor.toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1">
            ζ = {(beamParams.dampingRatio * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 3. Pestañas / Bloques de Configuración */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna Izquierda: Viga y Masa */}
        <div className="flex flex-col space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Settings2 size={16} className="text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-200">Propiedades de la Viga y Masa</h3>
            </div>

            {/* Selector de material predefinido */}
            <select
              onChange={e => handleMaterialSelect(e.target.value)}
              aria-label="Material predefinido"
              className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Cargar Material...</option>
              {MATERIAL_PRESETS.map(p => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Longitud de la viga L */}
          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Longitud de la Viga (L)</span>
              <span className="font-mono text-cyan-400 font-medium">
                {(beamParams.length * 100).toFixed(1)} cm ({beamParams.length.toFixed(2)} m)
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.2"
              step="0.02"
              value={beamParams.length}
              onChange={e =>
                onBeamParamsChange({ ...beamParams, length: parseFloat(e.target.value) })
              }
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Masa en el extremo superior M */}
          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Masa en el Extremo (M_tip)</span>
              <span className="font-mono text-amber-400 font-medium">
                {beamParams.tipMass.toFixed(2)} kg ({(beamParams.tipMass * 1000).toFixed(0)} g)
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="3.0"
              step="0.05"
              value={beamParams.tipMass}
              onChange={e =>
                onBeamParamsChange({ ...beamParams, tipMass: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Sección Transversal: Circular vs Rectangular */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Sección Transversal</span>
            <div className="flex space-x-1 bg-slate-900 border border-slate-800 p-0.5 rounded">
              <button
                onClick={() => onBeamParamsChange({ ...beamParams, crossSection: 'circular' })}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  beamParams.crossSection === 'circular'
                    ? 'bg-cyan-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Varilla Circular
              </button>
              <button
                onClick={() => onBeamParamsChange({ ...beamParams, crossSection: 'rectangular' })}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  beamParams.crossSection === 'rectangular'
                    ? 'bg-cyan-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Platina Rectangular
              </button>
            </div>
          </div>

          {beamParams.crossSection === 'circular' ? (
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Diámetro de la Varilla (d)</span>
                <span className="font-mono text-cyan-400 font-medium">
                  {((beamParams.diameter || 0.012) * 1000).toFixed(1)} mm
                </span>
              </div>
              <input
                type="range"
                min="0.004"
                max="0.025"
                step="0.001"
                value={beamParams.diameter || 0.012}
                onChange={e =>
                  onBeamParamsChange({ ...beamParams, diameter: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Espesor (h)</span>
                  <span className="font-mono text-cyan-400">
                    {((beamParams.height || 0.005) * 1000).toFixed(1)} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="0.002"
                  max="0.015"
                  step="0.0005"
                  value={beamParams.height || 0.005}
                  onChange={e =>
                    onBeamParamsChange({ ...beamParams, height: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Ancho (b)</span>
                  <span className="font-mono text-cyan-400">
                    {((beamParams.width || 0.025) * 1000).toFixed(1)} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.05"
                  step="0.002"
                  value={beamParams.width || 0.025}
                  onChange={e =>
                    onBeamParamsChange({ ...beamParams, width: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Razón de Amortiguamiento zeta */}
          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Razón de Amortiguamiento (ζ)</span>
              <span className="font-mono text-emerald-400 font-medium">
                {(beamParams.dampingRatio * 100).toFixed(2)} % ({beamParams.dampingRatio.toFixed(3)})
              </span>
            </div>
            <input
              type="range"
              min="0.002"
              max="0.15"
              step="0.002"
              value={beamParams.dampingRatio}
              onChange={e =>
                onBeamParamsChange({ ...beamParams, dampingRatio: parseFloat(e.target.value) })
              }
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Columna Derecha: Excitación de la Base Móvil */}
        <div className="flex flex-col space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Activity size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-200">Excitación de la Base Móvil</h3>
            </div>

            {/* Botón de Sintonización Instantánea a Resonancia */}
            <button
              onClick={onTuneToResonance}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition shadow"
              title="Ajusta fb exactamente igual a fn para ver la máxima resonancia"
            >
              <Zap size={13} className="text-amber-400 animate-pulse" />
              <span>Sintonizar a Resonancia</span>
            </button>
          </div>

          {/* Selector de Tipo de Movimiento de la Base */}
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {[
              { type: 'harmonic', label: 'Armónica (Seno)' },
              { type: 'chirp', label: 'Barrido (Chirp)' },
              { type: 'seismic', label: 'Sísmica' },
              { type: 'whitenoise', label: 'Ruido Blanco' },
              { type: 'impulse', label: 'Impulso' },
              { type: 'free', label: 'Libre' },
            ].map(m => (
              <button
                key={m.type}
                onClick={() =>
                  onExcitationChange({ ...excitation, type: m.type as ExcitationType })
                }
                className={`py-1.5 px-2 rounded text-xs transition border text-center ${
                  excitation.type === m.type
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Amplitud de Excitación de la Base X0 */}
          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Amplitud de Movimiento de la Base (X₀)</span>
              <span className="font-mono text-cyan-400 font-medium">
                {(excitation.amplitude * 1000).toFixed(1)} mm
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.035"
              step="0.001"
              value={excitation.amplitude}
              onChange={e =>
                onExcitationChange({ ...excitation, amplitude: parseFloat(e.target.value) })
              }
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Si es Armónica: Frecuencia fb */}
          {excitation.type === 'harmonic' && (
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Frecuencia de Excitación (f_b)</span>
                <span className="font-mono text-amber-400 font-medium">
                  {excitation.frequency.toFixed(2)} Hz
                  <span className="text-slate-400 ml-1 font-normal">
                    (r = {(excitation.frequency / Math.max(0.01, derived.naturalFreqHz)).toFixed(2)})
                  </span>
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="12.0"
                step="0.05"
                value={excitation.frequency}
                onChange={e =>
                  onExcitationChange({ ...excitation, frequency: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Si es Chirp: Rango y duración */}
          {excitation.type === 'chirp' && (
            <div className="space-y-3 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Rango de Barrido de Frecuencia</span>
                <span className="font-mono text-cyan-400">
                  {excitation.chirpStartFreq} Hz → {excitation.chirpEndFreq} Hz
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400">f_inicial (Hz):</span>
                  <input
                    type="number"
                    min="0.2"
                    max="10"
                    step="0.5"
                    value={excitation.chirpStartFreq}
                    onChange={e =>
                      onExcitationChange({
                        ...excitation,
                        chirpStartFreq: Math.max(0.1, parseFloat(e.target.value)),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 mt-1"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">f_final (Hz):</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="0.5"
                    value={excitation.chirpEndFreq}
                    onChange={e =>
                      onExcitationChange({
                        ...excitation,
                        chirpEndFreq: Math.max(1, parseFloat(e.target.value)),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-slate-400">Duración del Barrido</span>
                <span className="font-mono text-amber-400">{excitation.chirpDuration} segundos</span>
              </div>
            </div>
          )}

          {/* Nota interactiva pedagógica */}
          <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded border border-slate-800/80 flex items-start space-x-2">
            <Sparkles size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Consejo de Laboratorio:</strong> En modo <em>Barrido (Chirp)</em> o <em>Ruido Blanco</em>,
              la Transformada de Fourier reconstruirá el pico de resonancia a los{' '}
              <strong className="text-cyan-300">{derived.naturalFreqHz.toFixed(2)} Hz</strong> en tiempo real.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
