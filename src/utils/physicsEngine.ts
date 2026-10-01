import { BeamParameters, ExcitationParameters, PhysicalDerivedValues, SimulationState } from '../types/physics';

// Materiales predefinidos con propiedades reales
export const MATERIAL_PRESETS = [
  { name: 'Acero Estructural (A36)', youngModulus: 200e9, density: 7850, typicalZeta: 0.015 },
  { name: 'Aluminio 6061-T6', youngModulus: 69e9, density: 2700, typicalZeta: 0.02 },
  { name: 'Latón Comercial', youngModulus: 105e9, density: 8500, typicalZeta: 0.025 },
  { name: 'Fibra de Carbono', youngModulus: 150e9, density: 1600, typicalZeta: 0.008 },
  { name: 'Titanio Grado 5', youngModulus: 114e9, density: 4430, typicalZeta: 0.012 },
  { name: 'Personalizado', youngModulus: 100e9, density: 5000, typicalZeta: 0.02 },
];

/**
 * Calcula las propiedades derivadas del sistema viga-masa con base móvil
 */
export function calculateDerivedValues(params: BeamParameters): PhysicalDerivedValues {
  const { length, crossSection, diameter = 0.012, width = 0.025, height = 0.005, youngModulus, density, tipMass, dampingRatio } = params;

  let area: number;
  let inertia: number;

  if (crossSection === 'circular') {
    const r = diameter / 2;
    area = Math.PI * r * r;
    inertia = (Math.PI * Math.pow(diameter, 4)) / 64;
  } else {
    area = width * height;
    // Bending occurs along the height dimension (h in deflection direction)
    inertia = (width * Math.pow(height, 3)) / 12;
  }

  // Masa distribuida de la viga
  const beamMass = density * area * length;

  // Rigidez equivalente en el extremo de una viga en voladizo (Euler-Bernoulli: k = 3EI / L^3)
  const equivalentStiffness = (3 * youngModulus * inertia) / Math.pow(length, 3);

  // Masa efectiva usando el método de Rayleigh-Ritz para viga en voladizo con masa puntual
  // meff = M_tip + (33/140) * m_viga  (~0.2357 * m_viga)
  const effectiveMass = tipMass + (33 / 140) * beamMass;

  // Frecuencia angular natural omega_n = sqrt(k / meff)
  const naturalFreqRad = Math.sqrt(equivalentStiffness / effectiveMass);
  const naturalFreqHz = naturalFreqRad / (2 * Math.PI);

  // Amortiguamiento
  const criticalDamping = 2 * effectiveMass * naturalFreqRad;
  const actualDamping = 2 * dampingRatio * effectiveMass * naturalFreqRad;

  // Frecuencia amortiguada
  const dampedRad = naturalFreqRad * Math.sqrt(Math.max(0, 1 - dampingRatio * dampingRatio));
  const dampedFreqHz = dampedRad / (2 * Math.PI);

  // Factor de calidad Q = 1 / (2 * zeta)
  const qualityFactor = dampingRatio > 0 ? 1 / (2 * dampingRatio) : Infinity;
  const period = naturalFreqHz > 0 ? 1 / naturalFreqHz : 0;

  return {
    area,
    inertia,
    beamMass,
    equivalentStiffness,
    effectiveMass,
    naturalFreqRad,
    naturalFreqHz,
    dampedFreqHz,
    criticalDamping,
    actualDamping,
    qualityFactor,
    period,
  };
}

/**
 * Calcula la posición, velocidad y aceleración de la base en el tiempo t
 */
export function getBaseKinematics(
  t: number,
  params: ExcitationParameters
): { xb: number; xb_dot: number; xb_ddot: number } {
  const { type, amplitude, frequency, chirpStartFreq, chirpEndFreq, chirpDuration, noiseIntensity, pulseTime } = params;

  switch (type) {
    case 'harmonic': {
      const omega = 2 * Math.PI * frequency;
      const xb = amplitude * Math.sin(omega * t);
      const xb_dot = amplitude * omega * Math.cos(omega * t);
      const xb_ddot = -amplitude * omega * omega * Math.sin(omega * t);
      return { xb, xb_dot, xb_ddot };
    }

    case 'chirp': {
      // Barrido lineal en frecuencia: f(t) = f0 + (f1 - f0) * (t / T)
      // Fase: phi(t) = 2*pi * (f0 * t + 0.5 * (f1 - f0)/T * t^2)
      const T = Math.max(1, chirpDuration);
      const tMod = t % (T + 2); // Recicla periódicamente con pausa
      if (tMod > T) {
        return { xb: 0, xb_dot: 0, xb_ddot: 0 };
      }
      const beta = (chirpEndFreq - chirpStartFreq) / T;
      const phase = 2 * Math.PI * (chirpStartFreq * tMod + 0.5 * beta * tMod * tMod);
      const instOmega = 2 * Math.PI * (chirpStartFreq + beta * tMod);

      const xb = amplitude * Math.sin(phase);
      const xb_dot = amplitude * instOmega * Math.cos(phase);
      const xb_ddot = -amplitude * instOmega * instOmega * Math.sin(phase) + amplitude * (2 * Math.PI * beta) * Math.cos(phase);
      return { xb, xb_dot, xb_ddot };
    }

    case 'seismic': {
      // Síntesis de ondas sísmicas con múltiples armónicos pseudo-aleatorios (onda tipo terremoto)
      // Componentes de baja y media frecuencia típicas de sismos
      const c1 = { w: 2 * Math.PI * 1.5, a: 0.6 * amplitude, phi: 0.2 };
      const c2 = { w: 2 * Math.PI * 3.2, a: 0.8 * amplitude, phi: 1.1 };
      const c3 = { w: 2 * Math.PI * 5.8, a: 0.5 * amplitude, phi: 2.3 };
      const c4 = { w: 2 * Math.PI * 8.4, a: 0.3 * amplitude, phi: 0.7 };

      // Envolvente de duración tipo sismo (crece rápido y decae suavemente)
      const tCycle = t % 15;
      const envelope = Math.max(0, Math.sin((Math.PI * tCycle) / 15) * Math.exp(-0.08 * tCycle));

      let xb = 0;
      let xb_ddot = 0;

      [c1, c2, c3, c4].forEach(c => {
        const sinVal = Math.sin(c.w * t + c.phi);
        xb += c.a * sinVal;
        xb_ddot += -c.a * c.w * c.w * sinVal;
      });

      xb *= envelope;
      xb_ddot *= envelope;
      const xb_dot = 0; // aproximado
      return { xb, xb_dot, xb_ddot };
    }

    case 'whitenoise': {
      // Aproximación de ruido blanco con filtrado suave
      // Generador pseudo-aleatorio determinista para evitar derivas numéricas
      const seed = Math.sin(t * 1337.42) * 43758.5453;
      const rand1 = (seed - Math.floor(seed)) * 2 - 1;
      const noise = rand1 * amplitude * (noiseIntensity || 1.0);
      const omegaEst = 2 * Math.PI * 20; // corte de ancho de banda
      return {
        xb: noise,
        xb_dot: 0,
        xb_ddot: -noise * omegaEst * omegaEst * 0.1,
      };
    }

    case 'impulse': {
      // Impulso de aceleración tipo Dirac suavizado en t ~ 0.5s
      const tImpulse = 0.5;
      const dt = t - tImpulse;
      const width = pulseTime || 0.05;
      if (Math.abs(dt) < width) {
        const pulse = amplitude * Math.cos((Math.PI * dt) / (2 * width));
        const accel = (pulse / (width * width)) * 4;
        return { xb: pulse, xb_dot: 0, xb_ddot: accel };
      }
      return { xb: 0, xb_dot: 0, xb_ddot: 0 };
    }

    case 'free':
    default:
      return { xb: 0, xb_dot: 0, xb_ddot: 0 };
  }
}

/**
 * Derivada del estado relativo de la masa [u, u_dot]
 * Ecuación gobernante del movimiento relativo de la masa con respecto a la base móvil:
 *   m_eff * u_ddot + c * u_dot + k * u = - m_eff * xb_ddot
 *   => u_ddot = - xb_ddot - 2*zeta*omega_n * u_dot - omega_n^2 * u
 */
function stateDerivative(
  _t: number,
  u: number,
  u_dot: number,
  xb_ddot: number,
  omega_n: number,
  zeta: number
): { du: number; du_dot: number } {
  const du = u_dot;
  const du_dot = -xb_ddot - 2 * zeta * omega_n * u_dot - omega_n * omega_n * u;
  return { du, du_dot };
}

/**
 * Integrador numérico Runge-Kutta de 4to Orden (RK4)
 * Realiza un paso de tiempo dt de alta precisión y estabilidad numérica.
 */
export function rk4Step(
  state: SimulationState,
  derived: PhysicalDerivedValues,
  excitation: ExcitationParameters,
  dt: number
): SimulationState {
  const { t, u, u_dot } = state;
  const { naturalFreqRad: omega_n } = derived;
  const zeta = derived.actualDamping / (2 * derived.effectiveMass * derived.naturalFreqRad);

  // Cinemática de base en t, t + dt/2, y t + dt
  const base0 = getBaseKinematics(t, excitation);
  const baseMid = getBaseKinematics(t + 0.5 * dt, excitation);
  const baseEnd = getBaseKinematics(t + dt, excitation);

  // k1
  const k1 = stateDerivative(t, u, u_dot, base0.xb_ddot, omega_n, zeta);

  // k2
  const u_k2 = u + 0.5 * dt * k1.du;
  const u_dot_k2 = u_dot + 0.5 * dt * k1.du_dot;
  const k2 = stateDerivative(t + 0.5 * dt, u_k2, u_dot_k2, baseMid.xb_ddot, omega_n, zeta);

  // k3
  const u_k3 = u + 0.5 * dt * k2.du;
  const u_dot_k3 = u_dot + 0.5 * dt * k2.du_dot;
  const k3 = stateDerivative(t + 0.5 * dt, u_k3, u_dot_k3, baseMid.xb_ddot, omega_n, zeta);

  // k4
  const u_k4 = u + dt * k3.du;
  const u_dot_k4 = u_dot + dt * k3.du_dot;
  const k4 = stateDerivative(t + dt, u_k4, u_dot_k4, baseEnd.xb_ddot, omega_n, zeta);

  // Actualización de estado
  const next_u = u + (dt / 6) * (k1.du + 2 * k2.du + 2 * k3.du + k4.du);
  const next_u_dot = u_dot + (dt / 6) * (k1.du_dot + 2 * k2.du_dot + 2 * k3.du_dot + k4.du_dot);
  const next_u_ddot = -baseEnd.xb_ddot - 2 * zeta * omega_n * next_u_dot - omega_n * omega_n * next_u;

  const next_xb = baseEnd.xb;
  const next_xb_dot = baseEnd.xb_dot;
  const next_xb_ddot = baseEnd.xb_ddot;
  const next_x_tip = next_xb + next_u;

  return {
    t: t + dt,
    xb: next_xb,
    xb_dot: next_xb_dot,
    xb_ddot: next_xb_ddot,
    u: next_u,
    u_dot: next_u_dot,
    u_ddot: next_u_ddot,
    x_tip: next_x_tip,
    isRunning: state.isRunning,
    timeScale: state.timeScale,
  };
}

/**
 * Función de curvatura elástica de viga empotrada:
 * Para una viga en voladizo con desplazamiento de extremo u(t):
 * w(z) = u * [ (3/2)*(z/L)^2 - (1/2)*(z/L)^3 ]
 * Cumple w(0)=0 (empotramiento), w'(0)=0 (tangente vertical), w(L)=u (extremo).
 */
export function getBeamDeflectionAtHeight(z: number, L: number, uTip: number): number {
  if (L <= 0) return 0;
  const xi = Math.min(1, Math.max(0, z / L));
  return uTip * (1.5 * xi * xi - 0.5 * xi * xi * xi);
}

/**
 * Función analítica de Respuesta en Frecuencia (DAF - Factor de Amplificación Dinámica)
 * DAF(r, zeta) = 1 / sqrt( (1 - r^2)^2 + (2*zeta*r)^2 )
 * donde r = f / f_n
 */
export function getTheoreticalFRF(freqs: number[], fn: number, zeta: number) {
  return freqs.map(f => {
    const r = fn > 0 ? f / fn : 0;
    const denom = Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * zeta * r, 2));
    const mag = denom > 1e-6 ? 1 / denom : 1000;
    return { freq: f, magnitude: mag };
  });
}
