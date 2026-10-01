import React, { useState } from 'react';
import { TimePoint, FFTResult } from '../types/physics';
import { Download, Copy, Check, FileSpreadsheet, FileJson, X } from 'lucide-react';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeBuffer: TimePoint[];
  fftData: FFTResult | null;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({
  isOpen,
  onClose,
  timeBuffer,
  fftData,
}) => {
  const [exportType, setExportType] = useState<'time' | 'fft'>('time');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Generador de CSV de series temporales
  const generateTimeCSV = () => {
    let csv = 't_seconds,xb_m,u_m,xtip_m,xb_ddot_mps2\n';
    timeBuffer.forEach(p => {
      csv += `${p.t.toFixed(4)},${p.xb.toFixed(6)},${p.u.toFixed(6)},${p.xtip.toFixed(6)},${p.xb_ddot.toFixed(5)}\n`;
    });
    return csv;
  };

  // Generador de CSV de espectro FFT
  const generateFFTCSV = () => {
    if (!fftData) return '';
    let csv = 'freq_hz,magnitude_u_m,magnitude_xb_m,magnitude_xtip_m,frf_experimental\n';
    for (let i = 0; i < fftData.frequencies.length; i++) {
      csv += `${fftData.frequencies[i].toFixed(3)},${fftData.magnitudeU[i].toFixed(6)},${fftData.magnitudeXb[i].toFixed(6)},${fftData.magnitudeXtip[i].toFixed(6)},${(fftData.frfExperimental[i] || 0).toFixed(4)}\n`;
    }
    return csv;
  };

  const getExportData = () => {
    return exportType === 'time' ? generateTimeCSV() : generateFFTCSV();
  };

  const handleDownload = () => {
    const data = getExportData();
    const filename =
      exportType === 'time'
        ? `laboratorio_oscilaciones_tiempo_${Date.now()}.csv`
        : `laboratorio_oscilaciones_fft_${Date.now()}.csv`;
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    const data = getExportData();
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Exportar Datos de Laboratorio</h2>
              <p className="text-xs text-slate-400">
                Formato CSV compatible con MATLAB, Python (Pandas/NumPy), Origin y Excel
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

        {/* Opciones */}
        <div className="p-6 space-y-5">
          <div className="flex space-x-3">
            <button
              onClick={() => setExportType('time')}
              className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                exportType === 'time'
                  ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet size={16} />
              <span>Series Temporales t, xb, u, xtip ({timeBuffer.length} muestras)</span>
            </button>

            <button
              onClick={() => setExportType('fft')}
              className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                exportType === 'fft'
                  ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet size={16} />
              <span>Espectro FFT f, |U|, |Xb|, FRF ({fftData?.frequencies.length || 0} bins)</span>
            </button>
          </div>

          {/* Vista previa de datos */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400">Vista previa (primeras 8 filas):</span>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto whitespace-pre">
              {getExportData().split('\n').slice(0, 9).join('\n')}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              <span>{copied ? '¡Copiado!' : 'Copiar al Portapapeles'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-emerald-900/40"
            >
              <Download size={15} />
              <span>Descargar Archivo CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
