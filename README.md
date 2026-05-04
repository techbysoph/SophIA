# SophIA — Asistente de IA Local (100% Gratis)

> Sin API key · Sin internet · Sin costos · Todo corre en tu computadora

---

## Instalación rápida (3 pasos)

### Paso 1 — Instala Ollama

Ve a **https://ollama.com** y descarga el instalador para tu sistema:

- **macOS**: descarga el `.dmg` e instala
- **Windows**: descarga el `.exe` e instala
- **Linux**:
  ```bash
  curl -fsSL https://ollama.com/install.sh | sh
  ```

### Paso 2 — Descarga un modelo de lenguaje

Abre una terminal y ejecuta uno de estos comandos:

```bash
# Recomendado: Llama 3.2 (2GB, rápido, muy capaz)
ollama pull llama3.2

# Alternativas:
ollama pull mistral          # 4GB, excelente calidad
ollama pull gemma2           # 5GB, Google Gemma
ollama pull phi3             # 2GB, Microsoft Phi-3
ollama pull qwen2.5          # 4GB, excelente en español
ollama pull deepseek-r1:7b   # 4GB, razonamiento avanzado
```

La descarga tarda unos minutos dependiendo de tu internet.

### Paso 3 — Abre SophIA

Abre el archivo `index.html` directamente en tu navegador.

> Si el navegador bloquea las peticiones locales, usa un servidor:
> ```bash
> # Con Python (viene preinstalado en macOS/Linux)
> cd sophia
> python -m http.server 8080
> # Luego abre: http://localhost:8080
>
> # Con Node.js
> npx serve .
> ```

---

## ¿Cómo funciona?

SophIA habla directamente con **Ollama**, un servidor que corre en tu computadora y que expone los modelos de IA localmente en `http://localhost:11434`.

```
Tu navegador → SophIA (HTML/JS) → Ollama (localhost) → Modelo IA
```

**Todo el procesamiento ocurre en tu máquina.** Ningún dato sale a internet.

---

## Modos de SophIA

| Modo | Temp | Uso ideal |
|------|------|-----------|
| 💬 General | 0.70 | Conversación cotidiana |
| 🧩 Razonamiento | 0.30 | Análisis, lógica, paso a paso |
| ✨ Creativo | 0.95 | Escritura, poesía, ideas |
| 💻 Código | 0.15 | Programación técnica |
| 📚 Factual | 0.10 | Datos precisos |

---

## Estructura del proyecto

```
sophia/
├── index.html        ← Abrir esto en el navegador
├── css/
│   └── style.css
├── js/
│   └── app.js        ← Lógica + conexión a Ollama
└── README.md
```

---

## Requisitos de hardware

| Modelo | RAM mínima | Disco |
|--------|-----------|-------|
| llama3.2 (3B) | 4 GB | 2 GB |
| mistral (7B) | 8 GB | 4 GB |
| llama3.1 (8B) | 8 GB | 5 GB |
| gemma2 (9B) | 10 GB | 6 GB |

Con GPU NVIDIA/AMD la generación es mucho más rápida, pero funciona solo con CPU.

---

## Solución de problemas

**SophIA dice "Ollama no encontrado"**
- Asegúrate de que Ollama esté instalado y corriendo. Ejecuta: `ollama serve`
- Verifica en tu navegador: http://localhost:11434 debe responder

**La respuesta es muy lenta**
- Usa un modelo más pequeño como `phi3` o `llama3.2`
- Si tienes GPU, Ollama la usará automáticamente

**El modelo no existe**
- Descárgalo primero: `ollama pull <nombre-del-modelo>`
- Luego haz clic en ↻ en SophIA para actualizar la lista

**Error de CORS en navegador**
- Usa el servidor Python: `python -m http.server 8080`

---

## Personalización

En `js/app.js` puedes:
- Cambiar los **prompts de sistema** de cada modo (objeto `MODES`)
- Agregar nuevos modos
- Cambiar la URL de Ollama (`OLLAMA_URL`) si corre en otro puerto

---

## Modelos recomendados según uso

- **Español / multilingüe**: `qwen2.5`, `mistral`
- **Código**: `deepseek-coder`, `codellama`
- **Razonamiento**: `deepseek-r1:7b`
- **Rápido y ligero**: `phi3`, `llama3.2`
- **Calidad máxima (si tienes RAM)**: `llama3.1:70b`
