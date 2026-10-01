import React, { useState } from 'react';
import { GitBranch, Globe, CheckCircle2, AlertCircle, RefreshCw, Terminal, ExternalLink, X, ShieldCheck } from 'lucide-react';

interface GitVercelAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitVercelAgentModal: React.FC<GitVercelAgentModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Agente de Despliegue y Control: GitHub & Vercel</h2>
              <p className="text-xs text-slate-400">
                Verificación automatizada de compilación, control de versiones y estado en la nube
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

        {/* Contenido */}
        <div className="p-6 space-y-5 text-xs text-slate-300">
          {/* Tarjeta de GitHub */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GitBranch size={16} className="text-purple-400" />
                <span className="font-bold text-sm text-slate-200">Repositorio Oficial en GitHub</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] flex items-center space-x-1">
                <CheckCircle2 size={12} />
                <span>Vinculado</span>
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between font-mono text-[11px] text-cyan-300">
              <span className="truncate">https://github.com/crissgabriela/simuladores_dania.git</span>
              <a
                href="https://github.com/crissgabriela/simuladores_dania"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white flex items-center space-x-1 ml-2 underline text-[10px]"
              >
                <span>Ver en GitHub</span>
                <ExternalLink size={10} />
              </a>
            </div>

            <p className="text-slate-400 text-[11px]">
              Cada modificación realizada en el código pasa por una fase de precompilación TypeScript y verificación de paquetes antes de ser sincronizada en el branch principal.
            </p>
          </div>

          {/* Tarjeta de Vercel */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe size={16} className="text-cyan-400" />
                <span className="font-bold text-sm text-slate-200">Despliegue Continuo en Vercel (CI/CD)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[11px] flex items-center space-x-1">
                <CheckCircle2 size={12} />
                <span>Configurado con vercel.json</span>
              </span>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              El proyecto incluye la configuración nativa de <code className="text-cyan-300 font-mono">vercel.json</code> para Vite SPA, asegurando:
            </p>

            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pl-1">
              <li>Compilación estática optimizada (<code className="text-amber-300 font-mono">npm run build</code> → <code className="text-amber-300 font-mono">dist/</code>).</li>
              <li>Reescritura de rutas para Single Page Application (SPA).</li>
              <li>Despliegue automático con cada <code className="text-cyan-300 font-mono">git push</code> al repositorio de GitHub conectado en la consola de Vercel.</li>
            </ul>
          </div>

          {/* Instrucciones del Agente */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs">
              <Terminal size={14} />
              <span>Comandos de sincronización automática disponibles:</span>
            </div>
            <div className="bg-slate-900 p-3 rounded font-mono text-[11px] text-slate-300 space-y-1">
              <p className="text-cyan-400"># Ejecutar script del agente para probar build y sincronizar con GitHub:</p>
              <p className="text-emerald-400">node scripts/verify-and-sync.cjs</p>
              <p className="text-slate-500 mt-2"># O pedirle directamente a Antigravity en el chat:</p>
              <p className="text-amber-300">"Sincroniza y verifica las modificaciones en GitHub y Vercel"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
