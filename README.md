# SophIA — Tu Asistente de IA Personal

## ¿Qué es SophIA?

SophIA es una interfaz web completa para interactuar con inteligencia artificial usando la API de Anthropic. Tiene 5 modos de comportamiento, soporte para Markdown, historial de conversación y es completamente local.

---

## Instalación y uso

### Opción A — Abrir directo (recomendado para prueba rápida)

1. Abre el archivo `index.html` directamente en tu navegador.
2. En el panel izquierdo (parte inferior), ingresa tu **API key de Anthropic**.
3. Haz clic en **Guardar**.
4. ¡Empieza a chatear!

> **Nota:** Algunos navegadores bloquean fetch hacia APIs externas desde `file://`. Si no funciona, usa la Opción B.

---

### Opción B — Servidor local (recomendado)

Necesitas tener instalado **Node.js** o **Python**.

#### Con Python:
```bash
cd sophia
python -m http.server 8080
```
Luego abre: `http://localhost:8080`

#### Con Node.js (npx):
```bash
cd sophia
npx serve .
```
Luego abre la URL que te indique la terminal.

---

## Obtener tu API key de Anthropic

1. Ve a [https://console.anthropic.com](https://console.anthropic.com)
2. Crea una cuenta o inicia sesión.
3. Ve a **API Keys** → **Create Key**.
4. Copia la clave (empieza con `sk-ant-...`).
5. Pégala en SophIA y haz clic en Guardar.

> La clave se guarda solo en tu navegador (`localStorage`). Nunca se envía a ningún servidor excepto a Anthropic.

---

## Modos disponibles

| Modo | Temperatura | Uso ideal |
|------|-------------|-----------|
| General | 0.45 | Conversación cotidiana |
| Razonamiento | 0.20 | Análisis, lógica, paso a paso |
| Creativo | 0.88 | Escritura, poesía, ideas |
| Código | 0.10 | Programación técnica |
| Factual | 0.10 | Datos precisos, sin alucinaciones |

---

## Estructura del proyecto

```
sophia/
├── index.html        # Interfaz principal
├── css/
│   └── style.css     # Estilos completos
├── js/
│   └── app.js        # Lógica: API, modos, Markdown
└── README.md         # Este archivo
```

---

## Tecnologías

- HTML5, CSS3, JavaScript puro (sin frameworks)
- API Anthropic Messages v1
- Modelo: `claude-sonnet-4-20250514`
- Fuentes: DM Sans, DM Serif Display, JetBrains Mono (Google Fonts)

---

## Preguntas frecuentes

**¿Por qué no responde?**
Verifica que tu API key esté guardada correctamente y tengas créditos disponibles en tu cuenta de Anthropic.

**¿Es seguro guardar la API key?**
La clave se guarda en `localStorage` de tu navegador, solo en tu dispositivo. No se comparte con nadie más que Anthropic al hacer las llamadas a la API.

**¿Puedo cambiar el modelo?**
Sí. En `js/app.js` busca `claude-sonnet-4-20250514` y cámbialo por el modelo que prefieras (p.ej. `claude-opus-4-5`).

---

## Costos aproximados

El uso de la API de Anthropic tiene costo por tokens. Claude Sonnet cuesta aproximadamente:
- Input: $3 / millón de tokens
- Output: $15 / millón de tokens

Una conversación típica cuesta fracciones de centavo.
