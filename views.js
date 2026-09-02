const TIENDAS = ['Cd. Victoria','Tampico','Saltillo','Satélite','Durango','Mérida','Acapulco','Calera'];
let TIENDA_ACTUAL = '';

function allPeople() {
  try { return Object.values(JSON.parse(localStorage.getItem('induccion_cesantoni_registros') || '{}')); }
  catch(e) { return []; }
}
async function syncAndRender(name) {
  try {
    if (typeof refreshPeopleFromCloud === 'function') await refreshPeopleFromCloud();
  } catch (e) {}
  if (name === 'dash' && typeof renderDash === 'function') renderDash();
  if (name === 'tiendas' && typeof renderTiendas === 'function') renderTiendas();
  if (name === 'colabs' && typeof renderColabs === 'function') renderColabs(TIENDA_ACTUAL);
}
function pctOf(p) { return Number(p.pct || 0); }
function stats() {
  const people = allPeople();
  const n = people.length;
  const done = people.filter(p => pctOf(p) >= 100).length;
  const mid = people.filter(p => pctOf(p) > 0 && pctOf(p) < 100).length;
  const avg = n ? Math.round(people.reduce((a,p)=>a+pctOf(p),0)/n) : 0;
  return { n, done, mid, avg, people };
}
function storeStats(name) {
  const people = allPeople().filter(p => (p.area || '') === name);
  const n = people.length;
  const done = people.filter(p => pctOf(p) >= 100).length;
  const mid = n - done;
  const avg = n ? Math.round(people.reduce((a,p)=>a+pctOf(p),0)/n) : 0;
  return { n, done, mid, avg, people };
}
function cerrarMenu() {
  var side = document.getElementById('appSide');
  if (side) side.classList.remove('open');
}
function irVista(name, tienda) {
  if (typeof requireAuth === 'function' && !requireAuth()) {
    document.body.classList.remove('app-on', 'form-on');
    document.body.classList.add('landing-on');
    return;
  }
  cerrarMenu();
  document.querySelectorAll('.app-nav button[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  var vIn = document.getElementById('viewInicio');
  var vD = document.getElementById('viewDash');
  var vT = document.getElementById('viewTiendas');
  var vC = document.getElementById('viewColabs');
  if (vIn) vIn.style.display = name === 'inicio' ? 'block' : 'none';
  if (vD) vD.style.display = name === 'dash' ? 'block' : 'none';
  if (vT) vT.style.display = name === 'tiendas' ? 'block' : 'none';
  if (vC) vC.style.display = name === 'colabs' ? 'block' : 'none';
  var top = document.querySelector('.app-top');
  if (top) top.style.display = name === 'inicio' ? 'none' : 'flex';
  if (tienda) TIENDA_ACTUAL = tienda;
  if (name === 'inicio') {
    document.getElementById('appTitle').textContent = '';
    document.getElementById('appHint').textContent = '';
    document.querySelector('.app-top').style.display = 'none';
    renderInicio();
  } else if (name === 'dash') {
    document.getElementById('appTitle').textContent = 'Dashboard';
    document.getElementById('appHint').textContent = 'Resumen general · misma nube en laptop y celular';
    renderDash();
    syncAndRender('dash');
  } else if (name === 'tiendas') {
    document.getElementById('appTitle').textContent = 'Selecciona una tienda';
    document.getElementById('appHint').textContent = 'Entra para ver colaboradores de esa sucursal';
    renderTiendas();
    syncAndRender('tiendas');
  } else {
    const tt = TIENDA_ACTUAL || 'Todas';
    document.getElementById('appTitle').textContent = tt === 'Todas' ? 'Colaboradores' : ('Tienda ' + tt);
    document.getElementById('appHint').textContent = 'Inducciones en curso y completadas';
    renderColabs(TIENDA_ACTUAL);
    syncAndRender('colabs');
  }
}
function renderInicio() {
  var el = document.getElementById('viewInicio');
  if (!el) return;
  el.innerHTML = `<div class="welcome-hero"><div class="welcome-copy"><h2>PROGRAMA DE INDUCCIÓN AL PUESTO</h2><p>VENDEDOR TIENDA BOUTIQUE</p><div class="welcome-actions"><button type="button" class="btn-dark" onclick="irVista('tiendas')">SELECCIONAR TIENDA</button><button type="button" class="btn-dark" onclick="irVista('dash')">DASHBOARD</button></div></div></div>`;
}
function renderDash() {
  const s = stats();
  const bars = TIENDAS.map(name => {
    const st = storeStats(name);
    return `<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;font-size:0.8rem;"><span>${name}</span><span>${st.avg}%</span></div><div class="bar"><i style="width:${st.avg}%"></i></div></div>`;
  }).join('');
  document.getElementById('viewDash').innerHTML = `<div class="kpi-row"><div class="kpi"><b>${s.n}</b><span>colaboradores</span></div><div class="kpi"><b>${s.mid}</b><span>en curso</span></div><div class="kpi"><b>${s.done}</b><span>completadas</span></div><div class="kpi"><b>${s.avg}%</b><span>avance promedio</span></div></div><div class="panel"><h2>Avance por tienda</h2>${bars}</div><div class="panel"><h2>Pendientes</h2><div class="people">${s.people.filter(p=>pctOf(p)<100).slice(0,8).map(rowHtml).join('') || '<p style="color:#888">No hay pendientes guardados todavía.</p>'}</div></div>`;
}
function renderTiendas() {
  document.getElementById('viewTiendas').innerHTML = `<div class="store-grid">${TIENDAS.map(name => {
    const st = storeStats(name);
    return `<div class="store-card" onclick="irVista('colabs','${name}')"><h3>${name}</h3><p>${st.mid} en curso · ${st.done} completadas</p><div class="bar"><i style="width:${st.avg}%"></i></div></div>`;
  }).join('')}</div>`;
}
function rowHtml(p) {
  const key = String(p.key || p.clave || p.nombre || '').replace(/['"\\]/g,'');
  const pct = pctOf(p);
  return `<div class="person-row"><div class="person-meta" onclick="abrirDesdeApp('${key}')"><strong>${p.nombre || 'Sin nombre'}</strong><div style="color:#aaa;font-size:0.78rem;">${p.area || 'Sin tienda'} · ${p.clave || ''}</div></div><div class="person-line" onclick="abrirDesdeApp('${key}')"><i style="width:${pct}%"></i></div><div class="pill" onclick="abrirDesdeApp('${key}')">${pct}%</div><button type="button" class="btn-del-row" onclick="event.stopPropagation(); borrarColaborador('${key}')">Borrar</button></div>`;
}
function borrarColaborador(key) {
  if (!confirm('¿Borrar este colaborador y su avance?')) return;
  persistEnabled = false;
  try { if (typeof logMovimiento === 'function') logMovimiento('borrar', 'Colaborador: ' + key); } catch (e0) {}
  try {
    if (typeof dropRegistryKey === 'function') dropRegistryKey(key);
    else {
      const reg = JSON.parse(localStorage.getItem('induccion_cesantoni_registros') || '{}');
      const k = String(key || '');
      delete reg[k]; delete reg[k.toUpperCase()];
      localStorage.setItem('induccion_cesantoni_registros', JSON.stringify(reg));
    }
  } catch (e) {}
  persistEnabled = true;
  try { if (typeof cloudBorrar === 'function') cloudBorrar(key); } catch (e1) {}
  try { renderColabs(TIENDA_ACTUAL); } catch (e) {}
  try { renderDash(); } catch (e) {}
  try { renderTiendas(); } catch (e) {}
  try { renderHome(); } catch (e) {}
}
function renderColabs(tienda) {
  let people = allPeople();
  if (tienda) people = people.filter(p => (p.area || '') === tienda);
  people.sort((a,b) => String(a.nombre||'').localeCompare(String(b.nombre||'')));
  document.getElementById('viewColabs').innerHTML = `<div style="display:flex;gap:8px;margin-bottom:12px;"><button class="btn-dark" onclick="irVista('tiendas')">Cambiar tienda</button><button class="btn-red" onclick="nuevaDesdeApp('${tienda || ''}')">+ Nueva inducción</button></div><div class="people">${people.map(rowHtml).join('') || '<p style="color:#888">Aún no hay colaboradores en esta tienda. Crea una nueva inducción.</p>'}</div>`;
}
function nuevaDesdeApp(tienda) {
  cerrarMenu();
  document.body.classList.add('form-on');
  try { clearForm(); } catch(e) {}
  if (tienda && document.getElementById('area')) document.getElementById('area').value = tienda;
  try { if (typeof logMovimiento === 'function') logMovimiento('nueva', tienda || 'sin tienda'); } catch (e) {}
  try { updateProgress(); } catch (e) {}
  window.scrollTo(0,0);
}
function abrirDesdeApp(key) {
  cerrarMenu();
  document.body.classList.add('form-on');
  if (typeof abrirPersona === 'function') abrirPersona(key);
  window.scrollTo(0,0);
}
function volverApp() {
  document.body.classList.remove('form-on');
  irVista(TIENDA_ACTUAL ? 'colabs' : 'dash');
  window.scrollTo(0,0);
}
document.addEventListener('DOMContentLoaded', function(){
  if (!document.body.classList.contains('landing-on') && typeof requireAuth === 'function' && requireAuth()) irVista('inicio');
  else if (!document.body.classList.contains('landing-on') && typeof getSession === 'function' && getSession()) irVista('inicio');
});
