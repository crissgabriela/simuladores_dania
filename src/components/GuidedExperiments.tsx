import React from 'react';
import { BeamParameters, ExcitationParameters, GuidedExperiment } from '../types/physics';
import { BookOpen, CheckCircle, ArrowRight, Sparkles, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GuidedExperimentsProps {
  onLoadExperiment: (beam: Partial<BeamParameters>, excitation: Partial<ExcitationParameters>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const EXPERIMENTS_LIST: GuidedExperiment[] = [
  {
    id: 'exp1',
    title: '1. Resonancia y Factor de Amplificación Dinámica (DAF)',
    badge: 'Fundamental',
    objective: 'Comprobar la catástrofe de resonancia cuando la frecuencia de excitación de la base coincide con la frecuencia natural del sistema viga-masa.',
    description: 'Ajustaremos la base con movimiento sinusoidal y sintonizaremos gradualmente la frecuencia fb hacia fn. Observarás cómo la amplitud relativa u(t) se multiplica por un factor de hasta 20 a 50 veces respecto al desplazamiento de la base.',
    instructions: [
      'Haz clic en "Cargar este Experimento". El simulador ajustará la base con vibración armónica.',
      'Inicia la simulación y observa la amplitud relativa en el osciloscopio.',
      'Compara la frecuencia del pico en la pestaña FFT con la frecuencia teórica fn.',
      'Calcula experimentalmente el Factor de Amplificación: DAF = U_max / X0.',
    ],
    recommendedParams: {
      beam: { length: 0.6, tipMass: 0.4, dampingRatio: 0.02 },
      excitation: { type: 'harmonic', amplitude: 0.005, frequency: 2.18 },
    },
    expectedObservation: 'La amplitud u(t) crece notablemente hasta estabilizarse en el régimen estacionario con DAF ≈ 1/(2ζ) = 25.',
    theoryNote: 'En resonancia pura r = 1, la inercia y la rigidez elástica se cancelan mutuamente, quedando el movimiento limitado únicamente por la fuerza disipativa del amortiguamiento.',
  },
  {
    id: 'exp2',
    title: '2. Reconstrucción Espectral por Barrido de Frecuencia (Chirp FFT)',
    badge: 'Avanzado',
    objective: 'Utilizar una señal modulada linealmente en frecuencia (chirp) para excitar todos los modos y reconstruir la curva de transferencia en la FFT.',
    description: 'En ingeniería estructural y aeroespacial, las pruebas de vibración utilizan barridos de frecuencia senoidal continua ("sine sweep"). Esto permite trazar el espectro completo y detectar el pico de resonancia automáticamente.',
    instructions: [
      'Carga el experimento. La base ejecutará un barrido de 0.5 Hz hasta 6.0 Hz durante 15 segundos.',
      'Observa cómo en el osciloscopio la oscilación comienza pequeña, se dispara al pasar por la frecuencia crítica, y luego disminuye.',
      'En la gráfica de la FFT, analiza cómo se concentra la energía exactamente en la frecuencia propia de la viga.',
    ],
    recommendedParams: {
      beam: { length: 0.5, tipMass: 0.35, dampingRatio: 0.025 },
      excitation: {
        type: 'chirp',
        amplitude: 0.008,
        chirpStartFreq: 0.5,
        chirpEndFreq: 6.0,
        chirpDuration: 14,
      },
    },
    expectedObservation: 'El espectro de Fourier muestra una envolvente que coincide con la curva teórica DAF(f) calculada analíticamente.',
    theoryNote: 'La transformada de Fourier descompone la respuesta transitoria y estacionaria en sus componentes espectrales fundamentales.',
  },
  {
    id: 'exp3',
    title: '3. Medición de Amortiguamiento y Decremento Logarítmico',
    badge: 'Experimental',
    objective: 'Determinar el coeficiente de amortiguamiento ζ analizando la vibración libre transitoria o el ancho de banda a -3dB en la FFT.',
    description: 'Al dar un desplazamiento inicial a la masa y soltarla (sin movimiento en la base), el sistema oscilará decayendo exponencialmente. Los estudiantes pueden medir el decremento logarítmico δ entre picos consecutivos.',
    instructions: [
      'Carga el experimento (vibración libre con masa desplazada).',
      'Observa el decaimiento de las ondas en el osciloscopio.',
      'Mide la relación de amplitudes entre dos crestas sucesivas: δ = ln(x_n / x_{n+1}).',
      'Calcula la razón de amortiguamiento: ζ = δ / (2π).',
    ],
    recommendedParams: {
      beam: { length: 0.55, tipMass: 0.5, dampingRatio: 0.035 },
      excitation: { type: 'free', amplitude: 0.0, frequency: 1.0 },
    },
    expectedObservation: 'Las oscilaciones libres se reducen en forma exponencial e^(-ζ ωn t), demostrando la disipación elasto-viscosa de la viga.',
    theoryNote: 'En el dominio de la frecuencia, el factor de calidad Q = 1/(2ζ) define el ancho a media potencia (Δf = fn / Q).',
  },
  {
    id: 'exp4',
    title: '4. Aislamiento de Vibraciones en Alta Frecuencia (r > √2)',
    badge: 'Diseño Mecánico',
    objective: 'Demostrar que a frecuencias de excitación mayores que √2 fn, la transmisibilidad de la vibración es menor que 1.',
    description: 'En el aislamiento pasivo de motores, edificios y sensores, la frecuencia natural de la estructura se diseña para que sea mucho menor que la frecuencia de vibración ambiental o de la maquinaria.',
    instructions: [
      'Carga el experimento con excitación de alta frecuencia (fb ≈ 3.5 fn).',
      'Observa el canal verde (posición absoluta de la masa xtip) versus el canal azul (movimiento de la base xb).',
      'Nota que la masa superior casi no se mueve en el espacio absoluto, a pesar de que la base se mueve intensamente.',
    ],
    recommendedParams: {
      beam: { length: 0.65, tipMass: 0.6, dampingRatio: 0.02 },
      excitation: { type: 'harmonic', amplitude: 0.012, frequency: 6.5 },
    },
    expectedObservation: 'La amplitud absoluta del extremo |xtip| es mucho menor que la amplitud de la base |xb|. La transmisibilidad TR < 1.',
    theoryNote: 'Cuando r > √2 ≈ 1.414, la aceleración de la base actúa en contrafase con el desplazamiento elástico, aislando el extremo superior.',
  },
  {
    id: 'exp5',
    title: '5. Análisis Modal Operacional bajo Ruido Blanco / Sísmico',
    badge: 'Ingeniería Civil',
    objective: 'Identificar las frecuencias naturales de una estructura usando únicamente vibración ambiental de banda ancha.',
    description: 'En puentes y rascacielos reales, no es posible sacudir la estructura con un motor sinusoidal gigante. Los ingenieros colocan acelerómetros y miden las vibraciones debidas al viento y tráfico (ruido blanco). Al aplicar la FFT, la frecuencia propia emerge inmediatamente como el pico dominante.',
    instructions: [
      'Carga el experimento con excitación de Ruido Blanco.',
      'Inicia la simulación y abre la pestaña del Espectro FFT.',
      'Observa cómo el ruido de entrada excita todas las frecuencias por igual, pero la viga actúa como un filtro pasabanda natural concentrando la energía en fn.',
    ],
    recommendedParams: {
      beam: { length: 0.45, tipMass: 0.25, dampingRatio: 0.015 },
      excitation: { type: 'whitenoise', amplitude: 0.006, noiseIntensity: 1.0, frequency: 1.0 },
    },
    expectedObservation: 'El espectro de entrada es plano (ruido), pero el espectro de respuesta u(t) muestra un pico afiladísimo en la frecuencia natural fn.',
    theoryNote: 'Demuestra el teorema de densidad espectral: S_yy(f) = |H(f)|² S_xx(f). Si S_xx(f) es constante, S_yy(f) revela directamente la forma de la función de transferencia del sistema.',
  },
];

export const GuidedExperimentsModal: React.FC<GuidedExperimentsProps> = ({
  onLoadExperiment,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleSelect = (exp: GuidedExperiment) => {
    onLoadExperiment(exp.recommendedParams.beam, exp.recommendedParams.excitation);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Guía de Prácticas de Laboratorio</h2>
              <p className="text-xs text-slate-400">
                Experimentos estructurados con configuración automática de parámetros y análisis FFT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm transition"
          >
            Cerrar
          </button>
        </div>

        {/* Lista de Experimentos */}
        <div className="p-6 overflow-y-auto space-y-4">
          {EXPERIMENTS_LIST.map((exp, index) => (
            <div
              key={exp.id}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition flex flex-col md:flex-row justify-between gap-4 items-start"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {exp.badge}
                  </span>
                  <h3 className="text-base font-bold text-slate-200">{exp.title}</h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{exp.description}</p>

                <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 text-xs space-y-1.5">
                  <span className="font-semibold text-cyan-300 block">Objetivo Pedagógico:</span>
                  <p className="text-slate-300">{exp.objective}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Pasos sugeridos:</span>
                  <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                    {exp.instructions.map((ins, i) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="w-full md:w-56 flex flex-col justify-between self-stretch bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 space-y-3">
                <div className="text-[11px] text-slate-400 space-y-1">
                  <span className="font-semibold text-slate-300 block">Resultado Esperado:</span>
                  <p className="italic text-slate-400">{exp.expectedObservation}</p>
                </div>

                <button
                  onClick={() => handleSelect(exp)}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-cyan-900/30"
                >
                  <span>Cargar en el Simulador</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
