/* ============================
   GAME OF THRONES — APP JS
   Supabase + ThronesAPI
   ============================ */

// ══════════════════════════════
//   CONFIGURACIÓN SUPABASE
// ══════════════════════════════

const SUPABASE_URL = 'https://ktjdfzuvopqrcesfjtxi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_gVrMVc2yg9wcfbwUA8yLsA_dC_rWSev';

// Cliente de Supabase
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// URL de la API de Game of Thrones
const GOT_API = 'https://thronesapi.com/api/v2/Characters';

// ── Estado global ──
let allCharacters  = [];
let currentUser    = null;

// ══════════════════════════════
//   UTILIDADES UI
// ══════════════════════════════

/**
 * Muestra una pantalla y oculta las demás.
 * @param {'login'|'register'|'dashboard'} name
 */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
}

/**
 * Muestra un mensaje de error en el elemento indicado.
 * @param {string} elId - ID del div de error.
 * @param {string} msg  - Texto del error.
 */
function showError(elId, msg) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.classList.remove('hidden');
}

/**
 * Oculta el mensaje de error de un formulario.
 * @param {string} elId
 */
function clearMsg(elId) {
  const el = document.getElementById(elId);
  if (el) { el.textContent = ''; el.classList.add('hidden'); }
}

// ══════════════════════════════
//   LOGIN
// ══════════════════════════════

/**
 * Maneja el inicio de sesión.
 * Busca el usuario en Supabase por username y password.
 */
async function handleLogin() {
  clearMsg('login-error');

  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;

  if (!username || !password) {
    showError('login-error', 'Por favor, completa todos los campos.');
    return;
  }

  // Deshabilitar botón mientras carga
  const btn = document.querySelector('#screen-login .btn-primary');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Verificando...';

  try {
    // Consulta a Supabase: buscar usuario con esas credenciales
    const { data, error } = await db
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      showError('login-error', 'Usuario o contraseña incorrectos.');
      return;
    }

    // Guardar sesión en localStorage
    currentUser = data;
    localStorage.setItem('got_session', JSON.stringify(data));

    // Limpiar campos
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';

    // Ir al dashboard
    loadDashboard(data);

  } catch (err) {
    console.error('Error en login:', err);
    showError('login-error', 'Error de conexión. Intenta de nuevo.');
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Entrar al Reino';
  }
}

// ══════════════════════════════
//   REGISTRO
// ══════════════════════════════

/**
 * Maneja el registro de un nuevo usuario.
 * Inserta el usuario en la tabla 'usuarios' de Supabase.
 */
async function handleRegister() {
  clearMsg('register-error');
  clearMsg('register-success');

  const nombre   = document.getElementById('reg-nombre').value.trim();
  const username = document.getElementById('reg-user').value.trim();
  const casa     = document.getElementById('reg-casa').value;
  const pass     = document.getElementById('reg-pass').value;
  const pass2    = document.getElementById('reg-pass2').value;

  // Validaciones locales
  if (!nombre || !username || !casa || !pass || !pass2) {
    showError('register-error', 'Todos los campos son obligatorios.');
    return;
  }
  if (username.length < 3) {
    showError('register-error', 'El nombre de usuario debe tener mínimo 3 caracteres.');
    return;
  }
  if (pass.length < 6) {
    showError('register-error', 'La contraseña debe tener mínimo 6 caracteres.');
    return;
  }
  if (pass !== pass2) {
    showError('register-error', 'Las contraseñas no coinciden.');
    return;
  }

  // Deshabilitar botón
  const btn = document.querySelector('#screen-register .btn-primary');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Registrando...';

  try {
    // Insertar en Supabase
    const { data, error } = await db
      .from('usuarios')
      .insert([{ nombre, username, casa, password: pass }])
      .select()
      .single();

    if (error) {
      // Error de username duplicado (unique constraint)
      if (error.code === '23505') {
        showError('register-error', `El usuario "${username}" ya existe. Elige otro.`);
      } else {
        showError('register-error', 'Error al registrar. Intenta de nuevo.');
        console.error(error);
      }
      return;
    }

    // Éxito
    const successEl = document.getElementById('register-success');
    successEl.textContent = `✅ ¡Bienvenido a la Casa ${casa}, ${nombre}! Ahora puedes iniciar sesión.`;
    successEl.classList.remove('hidden');

    // Limpiar campos
    ['reg-nombre', 'reg-user', 'reg-pass', 'reg-pass2'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('reg-casa').value = '';

    // Redirigir al login tras 2 segundos
    setTimeout(() => showScreen('login'), 2000);

  } catch (err) {
    console.error('Error en registro:', err);
    showError('register-error', 'Error de conexión. Intenta de nuevo.');
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Jurar Lealtad';
  }
}

// ══════════════════════════════
//   LOGOUT
// ══════════════════════════════

/**
 * Cierra la sesión del usuario actual.
 * Limpia el estado y redirige al login.
 */
function handleLogout() {
  currentUser   = null;
  allCharacters = [];
  localStorage.removeItem('got_session');
  showScreen('login');
}

// ══════════════════════════════
//   DASHBOARD
// ══════════════════════════════

/**
 * Carga y muestra el dashboard con los datos del usuario.
 * @param {Object} user - Objeto usuario desde Supabase.
 */
function loadDashboard(user) {
  const casaEmojis = {
    Stark: '⚔️', Lannister: '👑', Targaryen: '🐉',
    Baratheon: '🦌', Greyjoy: '🐙', Tyrell: '🌹', Martell: '🌞'
  };

  const emoji = casaEmojis[user.casa] || '⚔️';

  // Navbar
  document.getElementById('nav-username').textContent  = user.username;
  document.getElementById('nav-casa').textContent      = `Casa ${user.casa}`;
  document.getElementById('user-initial').textContent  = user.nombre.charAt(0).toUpperCase();

  // Banner
  document.getElementById('welcome-msg').textContent  = `Bienvenido, ${user.nombre} ${emoji}`;
  document.getElementById('welcome-sub').textContent  = `Miembro de la Casa ${user.casa} — Explorando los Siete Reinos`;

  showScreen('dashboard');
  loadCharacters();
}

// ══════════════════════════════
//   API GAME OF THRONES
// ══════════════════════════════

/**
 * Consume la ThronesAPI y muestra los personajes.
 * Endpoint: https://thronesapi.com/api/v2/Characters
 */
async function loadCharacters() {
  const gridEl    = document.getElementById('characters-grid');
  const loadingEl = document.getElementById('characters-loading');
  const errorEl   = document.getElementById('characters-error');

  gridEl.classList.add('hidden');
  errorEl.classList.add('hidden');
  loadingEl.style.display = 'flex';

  try {
    const res = await fetch(GOT_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    allCharacters = await res.json();

    renderCharacters(allCharacters);
    loadingEl.style.display = 'none';
    gridEl.classList.remove('hidden');

  } catch (err) {
    console.error('Error al cargar personajes:', err);
    loadingEl.style.display = 'none';
    errorEl.classList.remove('hidden');
  }
}

/**
 * Renderiza la grilla de personajes.
 * @param {Array} characters - Lista de personajes a mostrar.
 */
function renderCharacters(characters) {
  const grid = document.getElementById('characters-grid');
  grid.innerHTML = '';

  if (characters.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-secondary);font-style:italic;">
        🔍 No se encontraron personajes con ese nombre.
      </div>`;
    return;
  }

  characters.forEach((char, index) => {
    const card = document.createElement('div');
    card.className = 'char-card';
    card.style.animationDelay = `${Math.min(index * 0.05, 0.5)}s`;

    const hasImage = char.imageUrl && char.imageUrl.trim() !== '';

    card.innerHTML = `
      <div class="char-img-wrapper">
        ${hasImage
          ? `<img src="${char.imageUrl}" alt="${char.fullName || char.firstName}" loading="lazy"
                  onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"/>
             <div class="char-img-placeholder" style="display:none;">⚔️</div>`
          : `<div class="char-img-placeholder">⚔️</div>`
        }
      </div>
      <div class="char-info">
        <div class="char-name">${char.fullName || char.firstName || 'Desconocido'}</div>
        ${char.title
          ? `<div class="char-title">${char.title}</div>`
          : `<div class="char-title" style="color:var(--text-muted)">Sin título</div>`
        }
        ${char.family ? `<span class="char-family">${char.family}</span>` : ''}
      </div>`;

    grid.appendChild(card);
  });
}

/**
 * Filtra personajes en tiempo real por nombre, título o familia.
 */
function filterCharacters() {
  const q = document.getElementById('search-char').value.toLowerCase().trim();
  if (!q) { renderCharacters(allCharacters); return; }

  const filtered = allCharacters.filter(c =>
    (c.fullName  || '').toLowerCase().includes(q) ||
    (c.firstName || '').toLowerCase().includes(q) ||
    (c.title     || '').toLowerCase().includes(q) ||
    (c.family    || '').toLowerCase().includes(q)
  );
  renderCharacters(filtered);
}

// ══════════════════════════════
//   PARTÍCULAS DE FONDO
// ══════════════════════════════

/** Genera partículas flotantes decorativas. */
function initParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      --dur:${6+Math.random()*10}s;
      --delay:${Math.random()*8}s;
      width:${1+Math.random()*2}px;
      height:${1+Math.random()*2}px;`;
    container.appendChild(p);
  }
}

// ══════════════════════════════
//   INICIALIZACIÓN
// ══════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initParticles();

  // Verificar sesión guardada
  const session = localStorage.getItem('got_session');
  if (session) {
    currentUser = JSON.parse(session);
    loadDashboard(currentUser);
  } else {
    showScreen('login');
  }
});
