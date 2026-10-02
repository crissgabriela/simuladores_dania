# Laboratorio Virtual de Oscilaciones Mecánicas & Transformada de Fourier
## Viga Vertical Empotrada con Masa en el Extremo y Base Móvil Horizontal

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcrissgabriela%2Fsimuladores_dania)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-cyan.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-teal.svg)

Una aplicación web interactiva de simulación física y pedagógica diseñada para que estudiantes y docentes exploren la dinámica estructural de un mecanismo viga-masa con excitación en la base, resonancia mecánica y el tratamiento de señales en el dominio del tiempo y de la frecuencia mediante la **Transformada Rápida de Fourier (FFT)**.

---

## 🎯 Características Principales

1. **Simulación Física a 60 FPS con Integrador Runge-Kutta 4to Orden (RK4)**:
   - Dinámica rigurosa basada en la teoría de vigas de Euler-Bernoulli.
   - Cálculo de rigidez elástica equivalente $k = \frac{3EI}{L^3}$.
   - Masa efectiva de Rayleigh-Ritz $m_{eff} = M + \frac{33}{140} m_{viga}$ considerando la inercia distribuida de la barra.
   - Ecuación del movimiento relativo bajo aceleración de base:
     $$m_{eff} \ddot{u}(t) + c \dot{u}(t) + k u(t) = -m_{eff} \ddot{x}_b(t)$$
   - Curvatura continua de deflexión $w(z, t) = u(t) \cdot \left[ \frac{3 z^2}{2 L^2} - \frac{z^3}{2 L^3} \right]$.

2. **Tipos de Excitación de la Base Móvil**:
   - **Armónica (Seno)**: Movimiento periódico para evaluar la amplificación dinámica en resonancia ($f_b \approx f_n$).
   - **Barrido Lineal de Frecuencia (Chirp)**: Excita un espectro continuo ($f_0 \to f_1$) para reconstruir la curva de transferencia en tiempo real.
   - **Onda Sísmica Sintética**: Simula movimientos del suelo multimodales de baja y media frecuencia.
   - **Ruido Blanco**: Excitación estocástica de banda ancha (Análisis Modal Operacional).
   - **Impulso / Dirac Suavizado**: Impacto repentino en la base.
   - **Vibración Libre**: Permite al usuario arrastrar interactivamente la masa superior con el ratón y soltarla.

3. **Tratamiento de Señales con Transformada de Fourier (FFT)**:
   - Algoritmo Cooley-Tukey Radix-2 implementado en TypeScript.
   - Funciones ventana para mitigar la fuga espectral (*spectral leakage*): **Hann (Hanning)**, **Hamming**, **Blackman**, **Flat-Top** y **Rectangular**.
   - Detección automática del pico de resonancia con interpolación parabólica sub-bin.
   - Comparación visual instantánea con la curva teórica analítica del **Factor de Amplificación Dinámica (DAF)**:
     $$DAF(r, \zeta) = \frac{1}{\sqrt{(1 - r^2)^2 + (2\zeta r)^2}}, \quad r = \frac{f}{f_n}$$

4. **Herramientas Pedagógicas**:
   - **5 Prácticas de Laboratorio Guiadas**: Con carga automática de parámetros y verificación experimental.
   - **Compendio Teórico Integrado**: Derivaciones matemáticas con renderizado $\KaTeX$.
   - **Exportación de Datos**: Descarga de series temporales y espectros FFT en formato CSV para MATLAB, Python (Pandas/NumPy) y Excel.

5. **Agente de Sincronización Automática con GitHub & Vercel**:
   - Herramienta y scripts dedicados para comprobar la integridad del código, verificar compilación TypeScript y desplegar en la nube con un solo comando.

> 👩‍🏫 **¿Eres docente o deseas continuar este proyecto de forma autónoma?**  
> Consulta la [**Guía Docente Paso a Paso (GUIA_PROFESORA.md)**](./GUIA_PROFESORA.md) con instaladores en 1 clic para Windows/Mac, instrucciones de despliegue en Vercel y el prompt maestro para trabajar con Inteligencia Artificial.


---

## 🚀 Despliegue en Vercel

El proyecto está 100% preparado para Vercel:

1. Ve a [Vercel](https://vercel.com/) e inicia sesión.
2. Haz clic en **Add New...** -> **Project**.
3. Importa el repositorio: `https://github.com/crissgabriela/simuladores_dania`.
4. Vercel detectará automáticamente la configuración definida en `vercel.json`:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Haz clic en **Deploy**. ¡Tu laboratorio estará publicado en la web en segundos!

---

## 💻 Desarrollo Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/crissgabriela/simuladores_dania.git
cd simuladores_dania

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor local de desarrollo
npm run dev

# 4. Compilar para producción
npm run build
```

---

## 🤖 Uso del Agente de Sincronización

Para verificar la compilación y sincronizar los cambios locales con GitHub:

```bash
node scripts/verify-and-sync.cjs "Mensaje del commit describiendo el cambio"
```

El script validará automáticamente que no existan errores de TypeScript, generará el empaquetado de producción, añadirá los archivos modificados y los enviará al repositorio remoto en GitHub.

---

## 📚 Estructura del Código

```
├── public/
├── scripts/
│   └── verify-and-sync.cjs        # Script del agente de despliegue
├── src/
│   ├── components/
│   │   ├── BeamCanvas.tsx         # Renderizado 2D de la viga, masa y carro móvil
│   │   ├── ControlsPanel.tsx      # Panel de parámetros físicos y excitación
│   │   ├── DataExportModal.tsx    # Exportación CSV para MATLAB/Python
│   │   ├── FourierSpectrumChart.tsx # Espectro FFT y curva DAF teórica
│   │   ├── GitVercelAgentModal.tsx# Panel informativo del agente GitHub/Vercel
│   │   ├── GuidedExperiments.tsx  # Prácticas guiadas de laboratorio
│   │   ├── Navbar.tsx             # Barra superior de navegación y herramientas
│   │   ├── OscilloscopeChart.tsx  # Osciloscopio multicanal en tiempo real
│   │   └── TheoryModal.tsx        # Fórmulas analíticas con KaTeX
│   ├── types/
│   │   └── physics.ts             # Definiciones e interfaces físicas
│   ├── utils/
│   │   ├── fourier.ts             # Algoritmo FFT Cooley-Tukey y ventanas
│   │   └── physicsEngine.ts       # Integrador RK4 y cinemática de la viga
│   ├── App.tsx                    # Orquestador del laboratorio
│   ├── index.css                  # Estilos Tailwind CSS
│   └── main.tsx                   # Entrada de React
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json                    # Configuración de despliegue en Vercel
└── vite.config.ts
```

---
Desarrollado con ❤️ para la enseñanza interactiva de la física y la ingeniería.
