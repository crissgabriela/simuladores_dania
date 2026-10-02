# 🎓 Guía Docente para Despliegue y Trabajo Autónomo
## Laboratorio Virtual de Oscilaciones Mecánicas & Transformada de Fourier

Esta guía está diseñada para que cualquier profesora, docente o investigadora pueda instalar, ejecutar, personalizar y desplegar esta aplicación web interactiva en la nube de forma **100% autónoma y gratuita**, sin necesidad de conocimientos avanzados en servidores o DevOps.

---

## 📋 1. Requisitos Previos en la Computadora

Solo se necesitan dos programas gratuitos instalados (una única vez):

1. **Node.js (versión 18 o superior)**:
   - Descargar e instalar la versión **LTS** desde [nodejs.org](https://nodejs.org/).
   - *(Al instalar, presionar "Siguiente" con las opciones predeterminadas)*.
2. **Git**:
   - Descargar e instalar desde [git-scm.com](https://git-scm.com/).
3. *(Opcional pero recomendado)* **Visual Studio Code**:
   - Editor de código gratuito disponible en [code.visualstudio.com](https://code.visualstudio.com/).

---

## 🚀 2. Cómo Descargar y Abrir el Proyecto

Abre la terminal o consola (o Git Bash) y escribe:

```bash
git clone https://github.com/crissgabriela/simuladores_dania.git
cd simuladores_dania
```

---

## 💻 3. Cómo Ejecutar el Simulador en tu Computadora (En 1 Clic)

Se han creado accesos directos automatizados para que no tengas que escribir comandos:

- **En Windows**: 
  - Simplemente haz doble clic sobre el archivo **`iniciar-laboratorio.bat`**.
  - Este archivo verificará que tengas Node.js, instalará los paquetes automáticamente si es la primera vez y **abrirá el laboratorio en tu navegador web predeterminado** (en `http://localhost:5173`).
- **En Mac o Linux**:
  - Abre una terminal en la carpeta y escribe: `./iniciar-laboratorio.sh`
- **Por consola / terminal**:
  ```bash
  npm install
  npm run dev
  ```

---

## 🌐 4. Cómo Desplegar la Aplicación en la Nube (Vercel)

El proyecto ya incluye el archivo `vercel.json` preconfigurado. Para tener tu propio enlace público en internet (ejemplo: `https://mi-laboratorio-oscilaciones.vercel.app`):

1. **Crear cuentas gratuitas**:
   - Crea una cuenta en [GitHub.com](https://github.com/) si aún no tienes una.
   - Crea una cuenta en [Vercel.com](https://vercel.com/) (recomendado: inicia sesión con tu misma cuenta de GitHub).
2. **Importar el proyecto**:
   - En el panel de Vercel, presiona el botón azul **"Add New..."** $\rightarrow$ **"Project"**.
   - Si hiciste un *Fork* o tienes el repositorio en tu cuenta de GitHub, selecciónalo de la lista.
   - O copia y pega directamente la URL: `https://github.com/crissgabriela/simuladores_dania`.
3. **Desplegar**:
   - Vercel reconocerá automáticamente que es un proyecto **Vite (React + TypeScript)**.
   - Haz clic en **"Deploy"**.
   - En 30 a 60 segundos tendrás un enlace web seguro (`https://...vercel.app`) para compartir con tus alumnos.

---

## 🤖 5. El Agente Revisor y de Sincronización Continua

Cuando hagas modificaciones en el proyecto (por ejemplo, cambiar textos, agregar una nueva práctica o alterar parámetros físicos), **no necesitas hacer comandos manuales de Git ni volver a entrar a Vercel**.

Hemos programado un **Agente Revisor de Calidad** que se encarga de todo el ciclo:

### ¿Qué hace el agente automáticamente?
1. **Revisa la calidad del código**: Ejecuta el compilador estricto (`npm run build`). Si hay algún error tipográfico, de sintaxis o de fórmulas que pueda romper la página web, te avisará y evitará que subas una versión dañada.
2. **Prepara los cambios**: Detecta qué archivos fueron editados o creados.
3. **Crea un registro (Commit)**: Te permite escribir qué cambios hiciste o genera una fecha automática.
4. **Sube a GitHub**: Envía la nueva versión a la rama principal de GitHub.
5. **Activa el despliegue en Vercel**: Vercel detecta la actualización en GitHub y reconstruye la página web en la nube de forma transparente.

### ¿Cómo usar el agente?
- **En Windows**: Haz doble clic en el archivo **`sincronizar-cambios.bat`**.
- **En Mac o Linux**: Ejecuta `./sincronizar-cambios.sh`.
- **Por consola**: Escribe en la terminal:
  ```bash
  npm run sync
  ```
  O indicando el mensaje directamente:
  ```bash
  npm run sync -- "Agregada nueva práctica de amortiguamiento crítico"
  ```

---

## 🧠 6. Cómo Continuar Desarrollando con Asistentes de IA (ChatGPT, Claude, Antigravity)

Si quieres pedirle a una Inteligencia Artificial que agregue nuevas características a este proyecto (por ejemplo: agregar un péndulo acoplado, cambiar los gráficos o agregar un nuevo tipo de material), puedes copiar y pegar el siguiente **Prompt Maestro** al inicio de tu conversación con la IA:

```text
Actúa como un desarrollador experto en física computacional y React + TypeScript.
Estoy trabajando en un Laboratorio Virtual de Oscilaciones disponible en https://github.com/crissgabriela/simuladores_dania.

Arquitectura del proyecto:
- Frontend: React 18, TypeScript, Tailwind CSS, Lucide React, KaTeX, Vite.
- Despliegue: Vercel (vercel.json) y GitHub.
- Física: Modelo de viga en voladizo (Euler-Bernoulli, k = 3EI/L^3), masa efectiva de Rayleigh-Ritz (m_eff = M + 0.2357*m_viga), excitación de base móvil y resolución por integración numérica Runge-Kutta 4to Orden (RK4).
- Señales: Transformada Rápida de Fourier (Cooley-Tukey Radix-2), ventanas (Hann, Hamming, Flat-Top) y función de respuesta en frecuencia (DAF teórico).
- Interacción: PointerCapture nativo en HTML5 Canvas con deflexión elástica en tiempo real.

Por favor, ayúdame a [ESCRIBE AQUÍ TU SOLICITUD, ej: agregar un nuevo experimento guiado sobre resonancia con amortiguamiento coulombiano].
Asegúrate de que el código compile sin errores de TypeScript (npm run build) y mantén la estructura existente de componentes en src/components.
```

---

## 📁 7. Mapa de Archivos para Modificaciones

Si deseas personalizar el simulador directamente en el código:

| Archivo | ¿Qué contiene y qué puedes modificar? |
|---|---|
| `src/components/GuidedExperiments.tsx` | Lista de las **5 prácticas guiadas**. Puedes agregar o cambiar preguntas, objetivos e instrucciones para tus alumnos. |
| `src/utils/physicsEngine.ts` | Valores de materiales predefinidos (Acero, Aluminio, Latón...) y ecuaciones del integrador RK4. |
| `src/components/TheoryModal.tsx` | Guía de **fórmulas teóricas con KaTeX**. Puedes redactar nuevas explicaciones pedagógicas o derivaciones. |
| `src/components/ControlsPanel.tsx` | Controles de sliders, botones de velocidad y modos de vibración de la base. |
| `src/components/BeamCanvas.tsx` | Dibujo del carro, las ruedas, la viga flexible y la masa superior. |
| `src/utils/fourier.ts` | Algoritmo FFT de Fourier, ventanas de ponderación y cálculo del factor de calidad $Q$. |

---

¡Mucho éxito en tus clases de física e ingeniería! 🚀
