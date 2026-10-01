// Tipos y definiciones para el laboratorio virtual de oscilaciones

export type ExcitationType = 'harmonic' | 'chirp' | 'seismic' | 'whitenoise' | 'impulse' | 'free';

export type CrossSectionType = 'circular' | 'rectangular';

export type WindowFunction = 'rect' | 'hann' | 'hamming' | 'blackman' | 'flattop';

export interface MaterialProperty {
  name: string;
  youngModulus: number; // in Pa (e.g. 200e9 for steel)
  density: number;      // in kg/m^3 (e.g. 7850 for steel)
  typicalZeta: number;  // damping ratio
}

export interface BeamParameters {
  length: number;           // L in meters (e.g. 0.5 m)
  crossSection: CrossSectionType;
  diameter?: number;        // d in meters (if circular)
  width?: number;           // b in meters (if rectangular)
  height?: number;          // h in meters (if rectangular, in direction of bending)
  youngModulus: number;     // E in Pa
  density: number;          // rho in kg/m^3
  tipMass: number;          // M in kg
  dampingRatio: number;     // zeta (dimensionless, e.g. 0.02)
}

export interface ExcitationParameters {
  type: ExcitationType;
  amplitude: number;        // X0 in meters (e.g. 0.01 m = 10 mm)
  frequency: number;        // f_b in Hz (for harmonic)
  chirpStartFreq: number;   // f0 in Hz
  chirpEndFreq: number;     // f1 in Hz
  chirpDuration: number;    // T_chirp in seconds
  noiseIntensity: number;   // standard deviation for white noise
  pulseTime: number;        // duration of impulse
}

export interface SimulationState {
  t: number;                // current time in seconds
  xb: number;               // base displacement (m)
  xb_dot: number;           // base velocity (m/s)
  xb_ddot: number;          // base acceleration (m/s^2)
  u: number;                // relative tip displacement (m)
  u_dot: number;            // relative tip velocity (m/s)
  u_ddot: number;           // relative tip acceleration (m/s^2)
  x_tip: number;            // absolute tip displacement xb + u (m)
  isRunning: boolean;
  timeScale: number;        // 0.1x to 2x
}

export interface PhysicalDerivedValues {
  area: number;             // A (m^2)
  inertia: number;          // I (m^4)
  beamMass: number;         // mb (kg)
  equivalentStiffness: number; // k = 3EI / L^3 (N/m)
  effectiveMass: number;    // meff = M + (33/140)*mb (kg)
  naturalFreqRad: number;   // omega_n (rad/s)
  naturalFreqHz: number;    // f_n (Hz)
  dampedFreqHz: number;     // f_d (Hz)
  criticalDamping: number;  // c_crit = 2*meff*omega_n (N*s/m)
  actualDamping: number;    // c = 2*zeta*meff*omega_n (N*s/m)
  qualityFactor: number;    // Q = 1 / (2*zeta)
  period: number;           // T_n = 1 / f_n (s)
}

export interface TimePoint {
  t: number;
  xb: number;      // Base disp (m)
  u: number;       // Relative tip disp (m)
  xtip: number;    // Absolute tip disp (m)
  xb_ddot: number; // Base accel (m/s^2)
}

export interface FFTResult {
  frequencies: number[];    // in Hz
  magnitudeU: number[];     // Relative displacement spectrum
  magnitudeXb: number[];    // Base displacement spectrum
  magnitudeXtip: number[];  // Absolute tip displacement spectrum
  frfExperimental: number[];// |U| / |Xb| or |Xtip| / |Xb|
  peakFrequencyU: number;   // Frequency with peak amplitude in U
  peakMagnitudeU: number;   // Peak amplitude
  theoreticalFRF: { freq: number; magnitude: number }[];
}

export interface GuidedExperiment {
  id: string;
  title: string;
  badge: string;
  objective: string;
  description: string;
  instructions: string[];
  recommendedParams: {
    beam: Partial<BeamParameters>;
    excitation: Partial<ExcitationParameters>;
  };
  expectedObservation: string;
  theoryNote: string;
}
