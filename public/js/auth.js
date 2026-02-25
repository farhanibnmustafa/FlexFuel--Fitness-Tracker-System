// Simple client-side auth and registration using localStorage/sessionStorage
// Not for production use.

const STORAGE_KEYS = {
  users: 'ff_users',
  step1: 'ff_reg_step1'
};

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function saveStep1(data) {
  sessionStorage.setItem(STORAGE_KEYS.step1, JSON.stringify(data));
}

function loadStep1() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.step1);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearStep1() { sessionStorage.removeItem(STORAGE_KEYS.step1); }

function usernameFromName(name) {
  return String(name || '').trim().replace(/\s+/g, '').toLowerCase();
}

// Expose minimal API on window
window.FFAuth = {
  saveStep1,
  loadStep1,
  clearStep1,
  register: function(step2) {
    const s1 = loadStep1();
    if (!s1) throw new Error('First step missing');
    const username = usernameFromName(s1.name);
    const users = loadUsers();
    if (users.some(u => u.username === username)) {
      throw new Error('Username already exists');
    }
    const height = parseFloat(step2.height_cm || 0);
    const weight = parseFloat(step2.weight_kg || 0);
    const m = height > 0 ? height / 100 : 0;
    const bmi = m > 0 && weight > 0 ? +(weight / (m * m)).toFixed(1) : null;

    const user = {
      username, // derived from name
      name: s1.name,
      email: s1.email,
      age: s1.age,
      gender: s1.gender,
      password: s1.password, // plaintext in demo only
      height_cm: step2.height_cm,
      weight_kg: step2.weight_kg,
      bmi,
      goal: step2.goal || '',
      target_weight: step2.target_weight || ''
    };
    users.push(user);
    saveUsers(users);
    clearStep1();
    // store active user session
    sessionStorage.setItem('ff_current_user', JSON.stringify({ username: user.username, name: user.name }));
    return user;
  },
  login: function(username, password) {
    const users = loadUsers();
    const ukey = usernameFromName(username);
    const user = users.find(u => u.username === ukey);
    if (!user || user.password !== password) return null;
    sessionStorage.setItem('ff_current_user', JSON.stringify({ username: user.username, name: user.name }));
    return user;
  }
};

