// ============================================================
//  SOPHIA — Asistente de IA Personal
//  app.js — Lógica principal
// ============================================================

// ── Configuración de modos ──────────────────────────────────

const MODES = {
  general: {
    label: '💬 Modo General',
    temp: 0.45,
    system: `Eres SophIA, una asistente de inteligencia artificial personal, inteligente, empática y muy capaz.
Respondes siempre en español (a menos que el usuario escriba en otro idioma).
Eres clara, precisa y adaptas tu respuesta al nivel y tono del usuario.
Cuando no sabes algo, lo dices explícitamente.
Cuando una pregunta es ambigua, pides aclaración antes de responder.
Usas formato Markdown cuando la respuesta se beneficia de estructura visual.
Eres cálida, directa y útil.`,
  },
  reasoning: {
    label: '🧩 Modo Razonamiento',
    temp: 0.2,
    system: `Eres SophIA en modo razonamiento profundo.
Piensas paso a paso, descomponiendo problemas complejos en partes manejables.
Muestras tu proceso de razonamiento de forma clara.
Eres rigurosa, lógica y cuidadosa con las conclusiones.
Si hay varias posibilidades, las evalúas antes de concluir.
Respondes siempre en español con rigor y estructura.`,
  },
  creative: {
    label: '✨ Modo Creativo',
    temp: 0.88,
    system: `Eres SophIA en modo creativo.
Eres imaginativa, expresiva y original.
Escribes con voz propia: usas metáforas, ritmo, juegos del lenguaje.
No te limitas a lo convencional — buscas la perspectiva inesperada.
Respondes en español con estilo, belleza y originalidad.`,
  },
  code: {
    label: '💻 Modo Código',
    temp: 0.1,
    system: `Eres SophIA en modo código — una experta programadora.
Das código limpio, comentado y funcionalmente correcto.
Explicas brevemente qué hace el código y por qué esa solución.
Siempre usas bloques de código Markdown con el lenguaje especificado.
Si hay un error en el código del usuario, lo señalas y corriges con detalle.
Respondes en español.`,
  },
  factual: {
    label: '📚 Modo Factual',
    temp: 0.1,
    system: `Eres SophIA en modo factual — precisa y honesta.
Citas fuentes cuando las conoces y distingues entre hechos confirmados y suposiciones.
Si no estás segura de algo, lo dices claramente en lugar de inventar.
Eres objetiva, equilibrada y no das opiniones a menos que se pidan.
Respondes en español con precisión y rigor.`,
  },
};

// ── Estado global ───────────────────────────────────────────

let currentMode = 'general';
let conversationHistory = [];
let isLoading = false;
let apiKey = '';

// ── Inicialización ──────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadApiKey();
  bindModeButtons();
  bindQuickButtons();
  bindInputEvents();
  updateModeUI('general');
});

// ── API Key ─────────────────────────────────────────────────

function loadApiKey() {
  const saved = localStorage.getItem('sophia_api_key');
  if (saved) {
    apiKey = saved;
    document.getElementById('apiKeyInput').value = saved;
    setStatus(true, 'API key cargada');
  }
}

function saveApiKey() {
  const val = document.getElementById('apiKeyInput').value.trim();
  if (!val) {
    alert('Por favor ingresa una API key válida.');
    return;
  }
  if (!val.startsWith('sk-ant-')) {
    alert('La API key de Anthropic debe comenzar con "sk-ant-"');
    return;
  }
  apiKey = val;
  localStorage.setItem('sophia_api_key', val);
  setStatus(true, 'API key guardada ✓');
}

function setStatus(active, text) {
  const dot = document.getElementById('statusDot');
  const label = document.getElementById('statusText');
  dot.className = 'status-dot' + (active ? ' active' : '');
  label.textContent = text;
}

// ── Modos ───────────────────────────────────────────────────

function bindModeButtons() {
  document.querySelectorAll('.mode-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      setMode(mode);
      document.querySelectorAll('.mode-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function setMode(mode) {
  currentMode = mode;
  updateModeUI(mode);
}

function updateModeUI(mode) {
  const cfg = MODES[mode];
  document.getElementById('currentModeLabel').textContent = cfg.label;
  document.getElementById('tempBadge').textContent = `temp: ${cfg.temp}`;
}

// ── Acciones rápidas ────────────────────────────────────────

function bindQuickButtons() {
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.dataset.prompt;
      if (prompt) {
        document.getElementById('userInput').value = prompt;
        sendMessage();
      }
    });
  });
}

// ── Input ───────────────────────────────────────────────────

function bindInputEvents() {
  const input = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  input.addEventListener('input', () => {
    autoResize(input);
    document.getElementById('charCount').textContent = input.value.length;
  });

  sendBtn.addEventListener('click', sendMessage);
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

// ── Limpiar chat ────────────────────────────────────────────

function clearChat() {
  conversationHistory = [];
  const msgs = document.getElementById('messages');
  msgs.innerHTML = '';
  appendSophiaMessage(`Chat reiniciado. ¿En qué te puedo ayudar?`);
}

// ── Enviar mensaje ──────────────────────────────────────────

async function sendMessage() {
  if (isLoading) return;

  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;

  if (!apiKey) {
    alert('⚠️ Ingresa tu API key de Anthropic en el panel izquierdo para usar SophIA.');
    return;
  }

  isLoading = true;
  toggleSendBtn(false);

  input.value = '';
  input.style.height = 'auto';
  document.getElementById('charCount').textContent = '0';

  appendUserMessage(text);
  conversationHistory.push({ role: 'user', content: text });

  const thinkingId = appendThinking();

  try {
    const cfg = MODES[currentMode];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: cfg.system,
        messages: conversationHistory,
        temperature: cfg.temp,
      }),
    });

    removeThinking(thinkingId);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || `Error HTTP ${response.status}`;
      appendSophiaMessage(`❌ **Error de API:** ${msg}`, true);
    } else {
      const data = await response.json();
      const reply = data?.content?.[0]?.text || '(Sin respuesta)';
      conversationHistory.push({ role: 'assistant', content: reply });
      appendSophiaMessage(reply);
    }

  } catch (err) {
    removeThinking(thinkingId);
    appendSophiaMessage(
      `❌ **Error de conexión:** No se pudo contactar la API.\n\nVerifica que tu API key sea correcta y que tengas conexión a internet.\n\n\`${err.message}\``,
      true
    );
  }

  isLoading = false;
  toggleSendBtn(true);
  document.getElementById('userInput').focus();
}

function toggleSendBtn(enabled) {
  document.getElementById('sendBtn').disabled = !enabled;
}

// ── Renderizar mensajes ──────────────────────────────────────

function appendUserMessage(text) {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg user';
  div.innerHTML = `
    <div class="avatar user-av">Tú</div>
    <div class="bubble-wrap">
      <div class="bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
      <div class="msg-time">${getTime()}</div>
    </div>
  `;
  msgs.appendChild(div);
  scrollToBottom();
}

function appendSophiaMessage(text, isError = false) {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg sophia';
  div.innerHTML = `
    <div class="avatar sophia-av">✦</div>
    <div class="bubble-wrap">
      <div class="bubble ${isError ? 'error-bubble' : ''}">${renderMarkdown(text)}</div>
      <div class="msg-time">SophIA · ${getTime()}</div>
    </div>
  `;
  msgs.appendChild(div);
  scrollToBottom();
}

function appendThinking() {
  const msgs = document.getElementById('messages');
  const id = 'thinking-' + Date.now();
  const div = document.createElement('div');
  div.className = 'msg sophia';
  div.id = id;
  div.innerHTML = `
    <div class="avatar sophia-av">✦</div>
    <div class="bubble-wrap">
      <div class="bubble">
        <div class="thinking-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    </div>
  `;
  msgs.appendChild(div);
  scrollToBottom();
  return id;
}

function removeThinking(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ── Utilidades ───────────────────────────────────────────────

function scrollToBottom() {
  const msgs = document.getElementById('messages');
  msgs.scrollTop = msgs.scrollHeight;
}

function getTime() {
  return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Markdown renderer (ligero) ───────────────────────────────

function renderMarkdown(text) {
  // Escapar HTML primero
  let out = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bloques de código con lenguaje
  out = out.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const langLabel = lang ? `<span style="font-size:10px;color:rgba(180,159,255,0.6);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.08em;">${lang}</span>` : '';
    return `<pre>${langLabel}<code>${code.trim()}</code></pre>`;
  });

  // Código inline
  out = out.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Encabezados
  out = out.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  out = out.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  out = out.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold e italic
  out = out.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');
  out = out.replace(/__(.+?)__/g, '<strong>$1</strong>');
  out = out.replace(/_(.+?)_/g, '<em>$1</em>');

  // Blockquote
  out = out.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Listas no ordenadas
  out = out.replace(/^[\*\-\+] (.+)$/gm, '<li>$1</li>');
  out = out.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

  // Listas ordenadas
  out = out.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // HR
  out = out.replace(/^---+$/gm, '<hr>');

  // Párrafos (doble salto de línea)
  out = out.replace(/\n\n+/g, '</p><p>');
  out = '<p>' + out + '</p>';

  // Saltos de línea simples dentro de párrafos
  out = out.replace(/\n/g, '<br>');

  // Limpiar <p> vacíos
  out = out.replace(/<p>\s*<\/p>/g, '');

  // Evitar párrafos dentro de bloques pre/ul/h1/h2/h3
  out = out.replace(/<p>(<(?:pre|ul|ol|h[123]|hr|blockquote))/g, '$1');
  out = out.replace(/(<\/(?:pre|ul|ol|h[123]|hr|blockquote)>)<\/p>/g, '$1');

  return out;
}
