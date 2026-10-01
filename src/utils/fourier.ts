import { TimePoint, WindowFunction, FFTResult } from '../types/physics';
import { getTheoreticalFRF } from './physicsEngine';

/**
 * Aplica una función ventana al array de datos para reducir la fuga espectral (spectral leakage)
 */
export function applyWindow(data: number[], windowType: WindowFunction): { windowed: number[]; coherentGain: number } {
  const N = data.length;
  if (N === 0) return { windowed: [], coherentGain: 1 };

  const windowed = new Array<number>(N);
  let sumWeight = 0;

  for (let n = 0; n < N; n++) {
    let w = 1.0;
    const factor = (2 * Math.PI * n) / (N - 1);

    switch (windowType) {
      case 'hann':
        w = 0.5 * (1 - Math.cos(factor));
        break;
      case 'hamming':
        w = 0.54 - 0.46 * Math.cos(factor);
        break;
      case 'blackman':
        w = 0.42 - 0.5 * Math.cos(factor) + 0.08 * Math.cos(2 * factor);
        break;
      case 'flattop':
        w = 0.21557895 
          - 0.41663158 * Math.cos(factor) 
          + 0.277263158 * Math.cos(2 * factor) 
          - 0.083578947 * Math.cos(3 * factor) 
          + 0.006947368 * Math.cos(4 * factor);
        break;
      case 'rect':
      default:
        w = 1.0;
        break;
    }

    windowed[n] = data[n] * w;
    sumWeight += w;
  }

  // Coherent gain para normalización de amplitud
  const coherentGain = sumWeight / N;
  return { windowed, coherentGain: coherentGain > 0 ? coherentGain : 1 };
}

/**
 * Encuentra la siguiente potencia de 2 para el algoritmo Cooley-Tukey
 */
function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/**
 * Algoritmo Cooley-Tukey Radix-2 FFT (Decimation-in-Time)
 * Devuelve partes real e imaginaria del espectro
 */
export function fft(realInput: number[]): { real: number[]; imag: number[] } {
  const n = realInput.length;
  const N = nextPowerOf2(n);

  const real = new Float64Array(N);
  const imag = new Float64Array(N);

  // Copia con zero-padding si es necesario
  for (let i = 0; i < n; i++) {
    real[i] = realInput[i];
  }

  // Bit reversal permutation
  let j = 0;
  for (let i = 0; i < N - 1; i++) {
    if (i < j) {
      const tempR = real[i];
      real[i] = real[j];
      real[j] = tempR;

      const tempI = imag[i];
      imag[i] = imag[j];
      imag[j] = tempI;
    }
    let k = N >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  // Mariposas de Cooley-Tukey
  for (let len = 2; len <= N; len <<= 1) {
    const halfLen = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wStepR = Math.cos(angle);
    const wStepI = Math.sin(angle);

    for (let i = 0; i < N; i += len) {
      let wR = 1.0;
      let wI = 0.0;

      for (let k = 0; k < halfLen; k++) {
        const uR = real[i + k];
        const uI = imag[i + k];

        const vR = real[i + k + halfLen] * wR - imag[i + k + halfLen] * wI;
        const vI = real[i + k + halfLen] * wI + imag[i + k + halfLen] * wR;

        real[i + k] = uR + vR;
        imag[i + k] = uI + vI;

        real[i + k + halfLen] = uR - vR;
        imag[i + k + halfLen] = uI - vI;

        const nextWR = wR * wStepR - wI * wStepI;
        const nextWI = wR * wStepI + wI * wStepR;
        wR = nextWR;
        wI = nextWI;
      }
    }
  }

  return {
    real: Array.from(real),
    imag: Array.from(imag),
  };
}

/**
 * Calcula el espectro de amplitud unilateral (Single-Sided Amplitude Spectrum)
 */
export function computeSingleSidedSpectrum(
  signal: number[],
  sampleRate: number,
  windowType: WindowFunction
): { frequencies: number[]; magnitudes: number[] } {
  const N = signal.length;
  if (N < 4) {
    return { frequencies: [], magnitudes: [] };
  }

  // Quitar componente DC (media de la señal)
  const mean = signal.reduce((a, b) => a + b, 0) / N;
  const zeroMean = signal.map(s => s - mean);

  // Aplicar ventana
  const { windowed, coherentGain } = applyWindow(zeroMean, windowType);

  // Ejecutar FFT
  const { real, imag } = fft(windowed);
  const fftSize = real.length;
  const numBins = Math.floor(fftSize / 2);

  const frequencies = new Array<number>(numBins);
  const magnitudes = new Array<number>(numBins);

  // Normalización para espectro unilateral:
  // Para bin 0: factor = 1 / (N * coherentGain)
  // Para bin k > 0: factor = 2 / (N * coherentGain)
  const normFactor = 2 / (N * coherentGain);

  for (let k = 0; k < numBins; k++) {
    frequencies[k] = (k * sampleRate) / fftSize;
    const mag = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]) * normFactor;
    magnitudes[k] = k === 0 ? mag / 2 : mag;
  }

  return { frequencies, magnitudes };
}

/**
 * Procesa la serie de tiempo del laboratorio y produce el conjunto completo de análisis FFT
 */
export function analyzeOscillationsFFT(
  buffer: TimePoint[],
  windowType: WindowFunction = 'hann',
  fnTheoretical: number = 2.0,
  zetaTheoretical: number = 0.02
): FFTResult | null {
  if (buffer.length < 16) return null;

  // Estimar tasa de muestreo efectiva Fs
  const tTotal = buffer[buffer.length - 1].t - buffer[0].t;
  if (tTotal <= 0.001) return null;

  const sampleRate = (buffer.length - 1) / tTotal;

  // Extraer series
  const signalU = buffer.map(p => p.u);
  const signalXb = buffer.map(p => p.xb);
  const signalXtip = buffer.map(p => p.xtip);

  // Espectro de amplitud
  const specU = computeSingleSidedSpectrum(signalU, sampleRate, windowType);
  const specXb = computeSingleSidedSpectrum(signalXb, sampleRate, windowType);
  const specXtip = computeSingleSidedSpectrum(signalXtip, sampleRate, windowType);

  const frequencies = specU.frequencies;
  const magnitudeU = specU.magnitudes;
  const magnitudeXb = specXb.magnitudes;
  const magnitudeXtip = specXtip.magnitudes;

  // Encontrar pico de mayor amplitud en U (ignorando DC bin 0)
  let peakFrequencyU = 0;
  let peakMagnitudeU = 0;
  let peakIndex = 1;

  for (let i = 1; i < frequencies.length; i++) {
    if (magnitudeU[i] > peakMagnitudeU) {
      peakMagnitudeU = magnitudeU[i];
      peakFrequencyU = frequencies[i];
      peakIndex = i;
    }
  }

  // Refinamiento parabólico sub-bin para máxima precisión de frecuencia
  if (peakIndex > 1 && peakIndex < frequencies.length - 1 && peakMagnitudeU > 1e-6) {
    const y1 = magnitudeU[peakIndex - 1];
    const y2 = magnitudeU[peakIndex];
    const y3 = magnitudeU[peakIndex + 1];
    const denom = 2 * (2 * y2 - y1 - y3);
    if (Math.abs(denom) > 1e-9) {
      const deltaBin = (y1 - y3) / denom;
      const binFreqStep = frequencies[1] - frequencies[0];
      peakFrequencyU = frequencies[peakIndex] - deltaBin * binFreqStep;
    }
  }

  // Función de Respuesta en Frecuencia Experimental estimada |H_exp(f)| = |U(f)| / |Xb(f)|
  const frfExperimental = new Array<number>(frequencies.length);
  for (let i = 0; i < frequencies.length; i++) {
    const xbMag = magnitudeXb[i];
    // Umbral de regularización para evitar divisiones espurias por ruido
    if (xbMag > 1e-4) {
      frfExperimental[i] = magnitudeU[i] / xbMag;
    } else {
      frfExperimental[i] = 0;
    }
  }

  // Curva teórica FRF
  const theoreticalFRF = getTheoreticalFRF(frequencies, fnTheoretical, zetaTheoretical);

  return {
    frequencies,
    magnitudeU,
    magnitudeXb,
    magnitudeXtip,
    frfExperimental,
    peakFrequencyU,
    peakMagnitudeU,
    theoreticalFRF,
  };
}
