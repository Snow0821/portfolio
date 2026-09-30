import { API_URL, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'mint-session-v1';
let session = null, todos = [], signup = false, generation = 0, refreshing = null;

function message(id, text = '', error = false) {
  $(id).textContent = text;
  $(id).classList.toggle('error', error);
}

async function jsonRequest(url, options = {}, timeout = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
    let data = null;
    if (response.status !== 204) data = await response.json().catch(() => null);
    if (!response.ok) {
      const text = typeof data?.detail === 'string' ? data.detail : data?.msg || data?.error_description || data?.message;
      const error = new Error(text || '요청을 처리하지 못했어요. 다시 시도해 주세요.');
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('연결이 오래 걸리고 있어요. 잠시 후 다시 시도해 주세요.');
    if (error instanceof TypeError) throw new Error('서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.');
    throw error;
  } finally { clearTimeout(timer); }
}

function authRequest(path, body, token) {
  return jsonRequest(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'apikey': SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function saveSession(data) {
  session = { access_token: data.access_token, refresh_token: data.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + data.expires_in,
    user: data.user };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch { /* Private storage may be unavailable. */ }
}

function clearSession(persist = true) {
  generation += 1;
  session = null;
  todos = [];
  if (persist) {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* The in-memory session is still cleared. */ }
  }
  $('todo-list').replaceChildren();
  $('account-email').textContent = '';
  $('todo-title-input').value = '';
  $('password').value = '';
  $('todo-panel').hidden = true;
  $('auth-panel').hidden = false;
}

async function accessToken() {
  if (!session) throw new Error('로그인이 필요해요.');
  if (session.expires_at > Date.now() / 1000 + 60) return session.access_token;
  if (!refreshing) {
    const ticket = generation, previousToken = session.refresh_token;
    refreshing = authRequest('token?grant_type=refresh_token', { refresh_token: previousToken })
      .then((data) => {
        if (ticket !== generation || !session) throw new Error('다시 로그인해 주세요.');
        saveSession(data);
        return session.access_token;
      }).catch((error) => {
        if (ticket === generation && error.status && error.status < 500) {
          clearSession();
          message('auth-message', '다시 로그인해 주세요.', true);
        }
        throw error;
      }).finally(() => { refreshing = null; });
  }
  return refreshing;
}

async function apiRequest(path = '', method = 'GET', body) {
  const token = await accessToken();
  try {
    return await jsonRequest(`${API_URL}/api/todos${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }, 90000);
  } catch (error) {
    if (error.status === 401 && session?.access_token === token) {
      clearSession();
      message('auth-message', '다시 로그인해 주세요.', true);
    }
    throw error;
  }
}

function showTodos() {
  $('auth-panel').hidden = true;
  $('todo-panel').hidden = false;
  $('account-email').textContent = session?.user?.email || '나의 계정';
  $('password').value = '';
  message('auth-message');
}

function renderTodos() {
  $('todo-list').replaceChildren();
  $('remaining').textContent = `${todos.filter((todo) => !todo.completed).length}개 남음`;
  $('empty-state').hidden = todos.length > 0;
  for (const todo of [...todos].sort((a, b) => Number(a.completed) - Number(b.completed))) {
    const item = document.createElement('li');
    item.className = `todo-item${todo.completed ? ' completed' : ''}`;
    const check = document.createElement('input');
    check.type = 'checkbox'; check.className = 'todo-check'; check.checked = todo.completed;
    check.setAttribute('aria-label', `${todo.title}: ${todo.completed ? '완료 취소' : '완료 표시'}`);
    const text = document.createElement('span'); text.className = 'todo-text'; text.textContent = todo.title;
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'delete-button'; remove.textContent = '×';
    remove.setAttribute('aria-label', `${todo.title} 삭제`);
    check.addEventListener('change', () => changeTodo(item, todo, 'PATCH', { completed: check.checked }));
    remove.addEventListener('click', () => changeTodo(item, todo, 'DELETE'));
    item.append(check, text, remove); $('todo-list').append(item);
  }
}

async function loadTodos() {
  const ticket = generation;
  $('reload-button').disabled = true;
  message('todo-message', '할 일을 불러오는 중이에요.');
  const waking = setTimeout(() => {
    if (ticket === generation && session) message('todo-message', '서버에 연결하는 중이에요. 첫 연결은 잠시 걸릴 수 있어요.');
  }, 6000);
  try {
    const result = await apiRequest();
    if (ticket !== generation || !session) return;
    todos = result; renderTodos(); message('todo-message');
  } catch (error) {
    if (ticket === generation && session) message('todo-message', error.message, true);
  } finally {
    clearTimeout(waking); $('reload-button').disabled = false;
  }
}

async function changeTodo(item, todo, method, body) {
  const ticket = generation;
  for (const control of item.querySelectorAll('button,input')) control.disabled = true;
  message('todo-message');
  try {
    const result = await apiRequest(`/${encodeURIComponent(todo.id)}`, method, body);
    if (ticket !== generation || !session) return;
    todos = method === 'DELETE' ? todos.filter((entry) => entry.id !== todo.id) : todos.map((entry) => entry.id === todo.id ? result : entry);
    renderTodos();
  } catch (error) {
    if (ticket === generation && session) { renderTodos(); message('todo-message', error.message, true); }
  }
}

$('auth-switch').addEventListener('click', () => {
  signup = !signup;
  $('auth-title').textContent = signup ? '나의 계정 만들기' : '나의 목록에 로그인';
  $('auth-submit').textContent = signup ? '계정 만들기' : '로그인';
  $('auth-switch').textContent = signup ? '로그인' : '계정 만들기';
  $('switch-copy').textContent = signup ? '이미 계정이 있나요?' : '처음 방문했나요?';
  $('password').autocomplete = signup ? 'new-password' : 'current-password';
  message('auth-message');
});

$('auth-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('auth-submit').disabled = true; $('auth-switch').disabled = true;
  message('auth-message', signup ? '계정을 만드는 중이에요.' : '로그인하는 중이에요.');
  try {
    const data = await authRequest(signup ? 'signup' : 'token?grant_type=password', { email: $('email').value.trim(), password: $('password').value });
    if (!data?.access_token) {
      $('password').value = '';
      message('auth-message', '이메일에서 가입 확인 링크를 눌러주세요. 확인 후 이 화면으로 돌아와 로그인하면 돼요.');
      if (signup) { signup = false; $('auth-title').textContent = '나의 목록에 로그인'; $('auth-submit').textContent = '로그인'; $('auth-switch').textContent = '계정 만들기'; $('switch-copy').textContent = '처음 방문했나요?'; $('password').autocomplete = 'current-password'; }
      return;
    }
    generation += 1; saveSession(data); showTodos(); await loadTodos();
  } catch (error) { message('auth-message', error.status === 400 ? '이메일·비밀번호 또는 이메일 확인 상태를 확인해 주세요.' : error.message, true); }
  finally { $('auth-submit').disabled = false; $('auth-switch').disabled = false; }
});

$('todo-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = $('todo-title-input').value.trim();
  if (!title) return;
  const ticket = generation;
  $('add-button').disabled = true; message('todo-message', '저장하는 중이에요.');
  try {
    const todo = await apiRequest('', 'POST', { title });
    if (ticket !== generation || !session) return;
    todos.unshift(todo); $('todo-title-input').value = ''; renderTodos(); message('todo-message'); $('todo-title-input').focus();
  } catch (error) { if (ticket === generation && session) message('todo-message', error.message, true); }
  finally { $('add-button').disabled = false; }
});

$('reload-button').addEventListener('click', loadTodos);
$('logout-button').addEventListener('click', async () => {
  const token = session?.access_token;
  clearSession(); message('auth-message');
  if (token) await authRequest('logout', {}, token).catch(() => {});
});

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) { clearSession(false); restoreSession(); }
});

async function restoreSession() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return; }
  if (!saved?.access_token || !saved?.refresh_token) return;
  session = saved;
  const ticket = generation;
  message('auth-message', '로그인 상태를 확인하는 중이에요.');
  try {
    const token = await accessToken();
    const user = await authRequest('user', null, token);
    if (ticket !== generation || !session) return;
    session.user = user; showTodos(); await loadTodos();
  } catch (error) {
    if (ticket !== generation) return;
    clearSession(); message('auth-message', '다시 로그인해 주세요.', true);
  }
}

restoreSession();
