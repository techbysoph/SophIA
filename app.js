// ============================================================
//  SOPHIA — app.js
//  Backend: Ollama (local, gratis, sin internet)
//  API: http://localhost:11434
// ============================================================

const OLLAMA_URL = 'http://localhost:11434';

// ── Configuración de modos ──────────────────────────────────

const MODES = {
  general: {
    label: '💬 Modo General', temp: 0.7,
    system: `Eres SophIA, una asistente de inteligencia artificial personal, inteligente y empática.
Respondes siempre en español (a menos que el usuario escriba en otro idioma).
Eres clara, precisa y adaptas tu respuesta al nivel del usuario.
Cuando no sabes algo, lo dices. Cuando algo es ambiguo, pides aclaración.
Usas Markdown cuando la respuesta se beneficia de estructura.
Eres cálida, directa y útil.`
  },
  reasoning: {
    label: '🧩 Modo Razonamiento', temp: 0.3,
    system: `Eres SophIA en modo razonamiento.
Piensas paso a paso antes de responder.
Descompones problemas complejos en partes claras y manejables.
Muestras tu proceso de razonamiento explícitamente.
Eres rigurosa, lógica y cuidadosa con las conclusiones.
Respondes en español.`
  },
  creative: {
    label: '✨ Modo Creativo', temp: 0.95,
    system: `Eres SophIA en modo creativo.
Eres imaginativa, expresiva y original.
Escribes con voz propia, usas metáforas, ritmo y juegos del lenguaje.
No te limitas a lo convencional — buscas la perspectiva inesperada.
Respondes en español con estilo y belleza.`
  },
  code: {
    label: '💻 Modo Código', temp: 0.15,
    system: `Eres SophIA en modo código — experta programadora.
Das código limpio, comentado y funcionalmente correcto.
Explicas brevemente qué hace el código y por qué esa solución.
Usas bloques de código Markdown con el lenguaje especificado.
Si hay errores en el código del usuario, los señalas y corriges.
Respondes en español.`
  },
  factual: {
    label: '📚 Modo Factual', temp: 0.1,
    system: `Eres SophIA en modo factual.
Eres precisa y honesta. Distingues entre hechos confirmados y suposiciones.
Si no estás segura de algo, lo dices en lugar de inventar.
Eres objetiva y no das opiniones a menos que se pidan.
Respondes en español con rigor.`
  },
};

// ── Estado ──────────────────────────────────────────────────

let currentMode    = 'general';
let currentModel   = 'llama3.2';
let conversationHistory = [];
let isLoading      = false;
let abortController = null;
let chatStarted    = false;

// ── Init ────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  bindModes();
  bindQuickBtns();
  bindInput();
  bindModelSelect();
  checkOllama();
});

// ── Ollama health check ─────────────────────────────────────

async function checkOllama() {
  setStatus('loading', 'Conectando con Ollama...');
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('No OK');
    const data = await res.json();
    const models = (data.models || []).map(m => m.name);
    if (models.length > 0) {
      populateModels(models);
      setStatus('ok', `Ollama activo · ${models.length} modelo${models.length !== 1 ? 's' : ''}`);
      markStep(1, true);
      markStep(2, true);
      markStep(3, true);
    } else {
      setStatus('error', 'Ollama activo · sin modelos');
      markStep(1, true);
    }
  } catch {
    setStatus('error', 'Ollama no encontrado · ver instrucciones');
  }
}

function populateModels(models) {
  const sel = document.getElementById('modelSelect');
  sel.innerHTML = '';
  models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    sel.appendChild(opt);
  });
  currentModel = models[0];
  document.getElementById('modelBadge').textContent = currentModel;
}

function setStatus(state, text) {
  const dot = document.getElementById('statusDot');
  const label = document.getElementById('statusText');
  dot.className = 'status-dot ' + state;
  label.textContent = text;
}

function markStep(n, done) {
  const el = document.getElementById('step' + n);
  if (el && done) el.classList.add('done');
}

// ── Selector de modelo ──────────────────────────────────────

function bindModelSelect() {
  document.getElementById('modelSelect').addEventListener('change', e => {
    currentModel = e.target.value;
    document.getElementById('modelBadge').textContent = currentModel;
  });
}

// ── Modos ───────────────────────────────────────────────────

function bindModes() {
  document.querySelectorAll('.mode-item').forEach(btn => {
    btn.addEventListener('click', () => {
      currentMode = btn.dataset.mode;
      document.querySelectorAll('.mode-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cfg = MODES[currentMode];
      document.getElementById('currentModeLabel').textContent = cfg.label;
      document.getElementById('tempBadge').textContent = `temp: ${cfg.temp}`;
    });
  });
}

// ── Acciones rápidas ────────────────────────────────────────

function bindQuickBtns() {
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.prompt;
      if (p) { document.getElementById('userInput').value = p; sendMessage(); }
    });
  });
}

// ── Input ───────────────────────────────────────────────────

function bindInput() {
  const input   = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  input.addEventListener('input', () => autoResize(input));
  sendBtn.addEventListener('click', sendMessage);
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

// ── Limpiar chat ────────────────────────────────────────────

function clearChat() {
  conversationHistory = [];
  chatStarted = false;
  document.getElementById('messages').innerHTML = '';
  document.getElementById('messages').style.display = 'none';
  document.getElementById('welcomePanel').style.display = 'flex';
}

// ── Enviar mensaje ──────────────────────────────────────────

async function sendMessage() {
  if (isLoading) {
    // Si ya carga, abortar
    if (abortController) abortController.abort();
    return;
  }

  const input = document.getElementById('userInput');
  const text  = input.value.trim();
  if (!text) return;

  // Mostrar chat por primera vez
  if (!chatStarted) {
    chatStarted = true;
    document.getElementById('welcomePanel').style.display = 'none';
    document.getElementById('messages').style.display = 'flex';
  }

  isLoading = true;
  setSendBtn('stop');

  input.value = '';
  input.style.height = 'auto';

  addUserMsg(text);
  conversationHistory.push({ role: 'user', content: text });

  // Crear burbuja de SophIA vacía (para streaming)
  const sophiaDiv = createSophiaBubble();

  abortController = new AbortController();

  try {
    const cfg = MODES[currentMode];

    const messages = [
      { role: 'system', content: cfg.system },
      ...conversationHistory,
    ];

    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: abortController.signal,
      body: JSON.stringify({
        model: currentModel,
        messages,
        options: { temperature: cfg.temp },
        stream: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      setBubbleContent(sophiaDiv, `❌ **Error:** ${err}`, true);
      conversationHistory.pop();
    } else {
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj.message?.content) {
              fullText += obj.message.content;
              setBubbleContent(sophiaDiv, fullText);
              scrollToBottom();
            }
          } catch { /* línea incompleta */ }
        }
      }

      conversationHistory.push({ role: 'assistant', content: fullText });
    }

  } catch (err) {
    if (err.name === 'AbortError') {
      setBubbleContent(sophiaDiv, getBubbleText(sophiaDiv) + '\n\n*[Generación detenida]*');
    } else {
      setBubbleContent(sophiaDiv,
        `❌ **No se pudo conectar con Ollama.**\n\nAsegúrate de que Ollama esté corriendo:\n\`\`\`\nollama serve\n\`\`\`\n\nY de haber descargado un modelo:\n\`\`\`\nollama pull llama3.2\n\`\`\``,
        true
      );
      conversationHistory.pop();
    }
  }

  isLoading = false;
  abortController = null;
  setSendBtn('send');
  document.getElementById('userInput').focus();
}

function setSendBtn(state) {
  const btn = document.getElementById('sendBtn');
  if (state === 'stop') {
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`;
    btn.title = 'Detener generación';
    btn.style.background = '#c05050';
  } else {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
    btn.title = 'Enviar';
    btn.style.background = '';
  }
}

// ── Renderizar mensajes ──────────────────────────────────────

function addUserMsg(text) {
  const msgs = document.getElementById('messages');
  const div  = document.createElement('div');
  div.className = 'msg user';
  div.innerHTML = `
    <div class="avatar user-av">Tú</div>
    <div class="bubble-wrap">
      <div class="bubble">${escHtml(text).replace(/\n/g, '<br>')}</div>
      <div class="msg-time">${now()}</div>
    </div>`;
  msgs.appendChild(div);
  scrollToBottom();
}

function createSophiaBubble() {
  const msgs = document.getElementById('messages');
  const div  = document.createElement('div');
  div.className = 'msg sophia';
  div.innerHTML = `
    <div class="avatar sophia-av">✦</div>
    <div class="bubble-wrap">
      <div class="bubble" id="liveBubble">
        <div class="thinking-dots">
          <div class="dot"></div><div class="dot"></div><div class="dot"></div>
        </div>
      </div>
      <div class="msg-time">SophIA · ${now()}</div>
    </div>`;
  msgs.appendChild(div);
  scrollToBottom();
  return div;
}

function setBubbleContent(div, text, isError = false) {
  const bubble = div.querySelector('.bubble');
  bubble.className = 'bubble' + (isError ? ' error-bub' : '');
  bubble.innerHTML = renderMarkdown(text);
}

function getBubbleText(div) {
  return div.querySelector('.bubble')?.innerText || '';
}

function scrollToBottom() {
  const msgs = document.getElementById('messages');
  msgs.scrollTop = msgs.scrollHeight;
}

function now() {
  return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Markdown renderer ────────────────────────────────────────

function renderMarkdown(text) {
  let t = text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  // Bloques de código
  t = t.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const lbl = lang
      ? `<span class="lang-label">${escHtml(lang)}</span>`
      : '';
    return `<pre>${lbl}<code>${code.trim()}</code></pre>`;
  });

  // Código inline
  t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Encabezados
  t = t.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  t = t.replace(/^## (.+)$/gm,  '<h2>$1</h2>');
  t = t.replace(/^# (.+)$/gm,   '<h1>$1</h1>');

  // Bold / italic
  t = t.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  t = t.replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>');
  t = t.replace(/\*(.+?)\*/g,         '<em>$1</em>');
  t = t.replace(/__(.+?)__/g,         '<strong>$1</strong>');
  t = t.replace(/_([^_\n]+)_/g,       '<em>$1</em>');

  // Blockquote
  t = t.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // HR
  t = t.replace(/^---+$/gm, '<hr>');

  // Listas
  t = t.replace(/^[\*\-\+] (.+)$/gm, '<li>$1</li>');
  t = t.replace(/(<li>[\s\S]*?<\/li>)(?![\s\S]*<li>)/g, s => '<ul>' + s + '</ul>');
  t = t.replace(/^\d+\. (.+)$/gm, '<oli>$1</oli>');
  t = t.replace(/(<oli>[\s\S]*?<\/oli>)(?![\s\S]*<oli>)/g, s =>
    '<ol>' + s.replace(/<\/?oli>/g, m => m === '<oli>' ? '<li>' : '</li>') + '</ol>');

  // Párrafos
  t = t.replace(/\n\n+/g, '\n\n');
  const parts = t.split('\n\n');
  t = parts.map(p => {
    p = p.trim();
    if (!p) return '';
    if (/^<(h[123]|ul|ol|pre|hr|blockquote)/.test(p)) return p;
    return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
  }).join('\n');

  return t;
}
