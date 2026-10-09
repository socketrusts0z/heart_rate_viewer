const SUPABASE_URL = 'https://kmhrcqposrxjeogadlht.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-yvM6oC9nyggjmelvZ851w_QnK_vk1h';
const endpoint = `${SUPABASE_URL}/rest/v1/rpc/latest_dashboard_readings`;
const grid = document.getElementById('readings');
const status = document.getElementById('status');
const refresh = document.getElementById('refresh');
const search = document.getElementById('search');
let data = [];
let busy = false;
let lastSuccess = null;
const fresh = r => Date.now() - Date.parse(r.measured_at) <= 2 * 60 * 60 * 1000;
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
function age(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
}
function render() {
  document.getElementById('total').textContent = data.length;
  document.getElementById('recent').textContent = data.filter(fresh).length;
  document.getElementById('stale').textContent = data.filter(r => !fresh(r)).length;
  const visible = data.filter(r => r.username.toLowerCase().includes(search.value.trim().toLowerCase()));
  document.getElementById('count').textContent = `${visible.length} ${visible.length === 1 ? 'person' : 'people'}`;
  grid.replaceChildren();
  if (!visible.length) {
    grid.append(element('div', 'empty', search.value ? 'No usernames match your search.' : 'No shared readings yet. Sync from the iPhone app to appear here.'));
    return;
  }
  visible.forEach((r, index) => {
    const isFresh = fresh(r);
    const card = element('article', 'reading');
    card.style.setProperty('--delay', `${Math.min(index, 8) * 40}ms`);
    const head = element('div', 'card-head');
    const identity = element('div', 'identity');
    identity.append(element('div', 'avatar', r.username.slice(0, 2).toUpperCase()), element('h3', 'name', `@${r.username}`));
    head.append(identity, element('span', `badge ${isFresh ? 'recent' : 'stale'}`, isFresh ? 'Recent' : 'Stale'));
    const value = element('div', 'value');
    value.append(element('span', 'bpm', Math.round(Number(r.bpm))), element('span', 'unit', 'BPM'), element('span', `heart ${isFresh ? 'pulse' : ''}`, '♥'));
    const time = element('time', 'age', age(r.measured_at));
    time.dateTime = r.measured_at;
    time.title = new Date(r.measured_at).toLocaleString();
    const foot = element('div', 'card-foot');
    foot.append(time, element('span', 'timestamp', new Date(r.measured_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })));
    card.append(head, value, foot);
    grid.append(card);
  });
}
async function load() {
  if (busy) return;
  busy = true;
  refresh.disabled = true;
  refresh.setAttribute('aria-busy', 'true');
  status.textContent = 'Checking for new readings…';
  try {
    const response = await fetch(endpoint, {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' }, body: '{}'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload)) throw new Error('Unexpected response');
    data = payload.filter(r => typeof r.username === 'string' && Number.isFinite(Number(r.bpm)) && Number.isFinite(Date.parse(r.measured_at)))
      .sort((a, b) => Date.parse(b.measured_at) - Date.parse(a.measured_at) || a.username.localeCompare(b.username));
    lastSuccess = new Date();
    status.textContent = `Checked at ${lastSuccess.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · Refreshes every 2 minutes`;
    render();
  } catch (error) {
    status.textContent = lastSuccess ? `Couldn’t refresh. Showing readings from the last successful check (${lastSuccess.toLocaleTimeString()}).` : 'Couldn’t load readings. Try refreshing in a moment.';
    if (!lastSuccess) grid.replaceChildren(element('div', 'empty', 'Readings are temporarily unavailable.'));
  } finally {
    busy = false; refresh.disabled = false; refresh.setAttribute('aria-busy', 'false');
  }
}
refresh.addEventListener('click', load);
search.addEventListener('input', render);
document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
setInterval(() => { if (!document.hidden) load(); }, 120000);
load();
