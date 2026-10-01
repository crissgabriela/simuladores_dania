import React from 'react';
import {
  Activity,
  BookOpen,
  Calculator,
  Download,
  Github,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  onOpenExperiments: () => void;
  onOpenTheory: () => void;
  onOpenExport: () => void;
  onOpenAgent: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenExperiments,
  onOpenTheory,
  onOpenExport,
  onOpenAgent,
}) => {
  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo y Título */}
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-amber-500 shadow-lg shadow-cyan-950/50 flex items-center justify-center text-white">
            <Activity size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center space-x-2">
              <span>OscilaLab</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
                Viga-Masa & FFT
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Laboratorio Virtual de Oscilaciones Mecánicas con Excitación de Base y Transformada de Fourier
            </p>
          </div>
        </div>

        {/* Botones de Navegación y Herramientas */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
          <button
            onClick={onOpenExperiments}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 transition shadow-sm"
          >
            <BookOpen size={14} />
            <span className="font-semibold">Prácticas Guiadas</span>
          </button>

          <button
            onClick={onOpenTheory}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
          >
            <Calculator size={14} className="text-amber-400" />
            <span className="font-semibold">Teoría & Fórmulas</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
          >
            <Download size={14} className="text-emerald-400" />
            <span className="font-semibold hidden sm:inline">Exportar Datos</span>
          </button>

          <button
            onClick={onOpenAgent}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
            title="Agente GitHub & Vercel"
          >
            <ShieldCheck size={14} className="text-purple-400" />
            <span className="font-semibold hidden md:inline">GitHub / Vercel</span>
          </button>

          <a
            href="https://github.com/crissgabriela/simuladores_dania"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Ver repositorio en GitHub"
          >
            <Github size={16} />
          </a>
        </div>
      </div>
    </header>
  );
};
