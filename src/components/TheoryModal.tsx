import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import { BookOpen, X, Lightbulb, Calculator, GitBranch } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente simple para renderizar fórmulas matemáticas KaTeX
const MathBlock: React.FC<{ formula: string; display?: boolean }> = ({ formula, display = true }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      katex.render(formula, containerRef.current, {
        displayMode: display,
        throwOnError: false,
      });
    }
  }, [formula, display]);

  return <div ref={containerRef} className={display ? 'my-2 overflow-x-auto py-1 text-cyan-300' : 'inline text-cyan-300'} />;
};

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Calculator size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Fundamentos Físicos y Matemáticos</h2>
              <p className="text-xs text-slate-400">
                Modelo elástico de viga en voladizo, excitación de base y análisis espectral de Fourier
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido Teórico */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed">
          {/* Sección 1: Sistema Viga-Masa */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-cyan-400 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>1. Modelo Continuo y Rigidez Equivalente (Euler-Bernoulli)</span>
            </h3>
            <p>
              Una barra elástica vertical de longitud <span className="text-cyan-300 font-mono">L</span> empotrada
              en su base y libre en su extremo superior con una masa concentrada <span className="text-amber-300 font-mono">M</span>{' '}
              sometida a flexión horizontal se modela mediante la teoría de vigas de Euler-Bernoulli.
            </p>
            <p>
              La rigidez lateral equivalente <span className="font-mono text-cyan-300">k</span> en el extremo libre se obtiene a partir de la relación fuerza-deflexión estática:
            </p>
            <MathBlock formula="k = \frac{3EI}{L^3}" />
            <p className="text-xs text-slate-400">
              Donde <span className="font-mono text-slate-200">E</span> es el módulo de elasticidad (Young) y <span className="font-mono text-slate-200">I</span> es el segundo momento de inercia del área de la sección transversal.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block mb-1">Sección Circular (Varilla de diámetro d):</span>
                <MathBlock formula="I = \frac{\pi d^4}{64}, \quad A = \frac{\pi d^2}{4}" />
              </div>
              <div>
                <span className="font-semibold text-slate-200 block mb-1">Sección Rectangular (Ancho b, espesor h):</span>
                <MathBlock formula="I = \frac{b h^3}{12}, \quad A = b \cdot h" />
              </div>
            </div>
          </div>

          {/* Sección 2: Masa Efectiva de Rayleigh */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-amber-400 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>2. Masa Efectiva Distribuida (Método de Rayleigh-Ritz)</span>
            </h3>
            <p>
              La barra no carece de masa; su masa total es <MathBlock formula="m_{viga} = \rho \cdot A \cdot L" display={false} />.
              Aplicando la conservación de energía cinética con la función de forma del primer modo de una viga en voladizo:
            </p>
            <MathBlock formula="\psi(z) = \frac{3}{2}\left(\frac{z}{L}\right)^2 - \frac{1}{2}\left(\frac{z}{L}\right)^3" />
            <p>
              La energía cinética equivalente conduce a una masa efectiva concentrada en el extremo superior de:
            </p>
            <MathBlock formula="m_{eff} = M + \frac{33}{140} m_{viga} \approx M + 0.2357 \cdot m_{viga}" />
            <p>
              La frecuencia angular natural no amortiguada <MathBlock formula="\omega_n" display={false} /> y la frecuencia cíclica <MathBlock formula="f_n" display={false} /> son:
            </p>
            <MathBlock formula="\omega_n = \sqrt{\frac{k}{m_{eff}}} \quad \text{[rad/s]}, \qquad f_n = \frac{\omega_n}{2\pi} \quad \text{[Hz]}" />
          </div>

          {/* Sección 3: Dinámica con Excitación de Base */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-emerald-400 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>3. Ecuación Diferencial del Movimiento bajo Excitación de Base</span>
            </h3>
            <p>
              Sea <MathBlock formula="x_b(t)" display={false} /> la posición horizontal de la base móvil y <MathBlock formula="x_{tip}(t) = x_b(t) + u(t)" display={false} />{' '}
              la posición absoluta de la masa en el extremo superior. La coordenada relativa <MathBlock formula="u(t)" display={false} /> describe la deflexión de la viga.
            </p>
            <p>
              Por la Segunda Ley de Newton en el marco inercial:
            </p>
            <MathBlock formula="m_{eff} \ddot{x}_{tip} + c \dot{u} + k u = 0" />
            <p>
              Sustituyendo <MathBlock formula="\ddot{x}_{tip} = \ddot{x}_b + \ddot{u}" display={false} /> y ordenando:
            </p>
            <MathBlock formula="m_{eff} \ddot{u}(t) + c \dot{u}(t) + k u(t) = -m_{eff} \ddot{x}_b(t)" />
            <p>
              Dividiendo por <MathBlock formula="m_{eff}" display={false} /> y definiendo la razón de amortiguamiento <MathBlock formula="\zeta = \frac{c}{2 m_{eff} \omega_n}" display={false} />:
            </p>
            <MathBlock formula="\ddot{u}(t) + 2 \zeta \omega_n \dot{u}(t) + \omega_n^2 u(t) = -\ddot{x}_b(t)" />
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-xs text-emerald-200">
              <strong>Principio Físico Clave:</strong> La aceleración de la base <MathBlock formula="\ddot{x}_b(t)" display={false} /> actúa como una fuerza inercial ficticia <MathBlock formula="F_{inercia} = -m_{eff} \ddot{x}_b" display={false} /> que excita el sistema elástico.
            </div>
          </div>

          {/* Sección 4: Factor de Amplificación Dinámica y Resonancia */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-purple-400 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              <span>4. Resonancia y Factor de Amplificación Dinámica (DAF)</span>
            </h3>
            <p>
              Para una excitación armónica <MathBlock formula="x_b(t) = X_0 \sin(\omega t)" display={false} />, la amplitud estacionaria de deflexión relativa <MathBlock formula="U_0" display={false} /> cumple:
            </p>
            <MathBlock formula="DAF(r, \zeta) = \frac{U_0}{X_0 \cdot r^2} = \frac{1}{\sqrt{(1 - r^2)^2 + (2\zeta r)^2}}, \quad \text{donde } r = \frac{\omega}{\omega_n}" />
            <p>
              En resonancia exacta (<MathBlock formula="r = 1" display={false} />):
            </p>
            <MathBlock formula="DAF_{max} \approx \frac{1}{2\zeta} = Q \quad \text{(Factor de Calidad)}" />
            <p className="text-xs text-slate-400">
              Para un amortiguamiento estructural de <MathBlock formula="\zeta = 0.02" display={false} /> (2%), la amplificación es <MathBlock formula="Q = 25" display={false} />. Es decir, ¡la viga oscila con 25 veces la amplitud impuesta por la base!
            </p>
          </div>

          {/* Sección 5: Transformada Rápida de Fourier (FFT) */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-sky-400 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span>5. Transformada Rápida de Fourier (FFT) y Fuga Espectral</span>
            </h3>
            <p>
              La Transformada Discreta de Fourier (DFT) transforma una secuencia temporal muestreada <MathBlock formula="x[n]" display={false} /> en su espectro de frecuencias <MathBlock formula="X[k]" display={false} />:
            </p>
            <MathBlock formula="X[k] = \sum_{n=0}^{N-1} x[n] \cdot e^{-j \frac{2\pi}{N} k n}, \quad k = 0, 1, \dots, N-1" />
            <p>
              Para señales continuas acotadas en el tiempo, las discontinuidades en los bordes generan <em>fuga espectral (spectral leakage)</em>. Para suprimirla, multiplicamos la señal por una función ventana <MathBlock formula="w[n]" display={false} /> antes de computar la FFT:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block mb-1">Ventana de Hann:</span>
                <MathBlock formula="w[n] = 0.5 \left(1 - \cos\left(\frac{2\pi n}{N-1}\right)\right)" />
                <span className="text-slate-400">Excelente equilibrio entre resolución en frecuencia y atenuación de lóbulos laterales.</span>
              </div>
              <div>
                <span className="font-semibold text-slate-200 block mb-1">Ventana Flat-Top:</span>
                <MathBlock formula="w[n] = a_0 - a_1 \cos\theta + a_2 \cos 2\theta - \dots" />
                <span className="text-slate-400">Máxima precisión de amplitud en el pico de resonancia.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
