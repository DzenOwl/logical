let mode = 'and';
let switchA = false;
let switchB = false;

const descriptions = {
  and: 'Выключатели соединены <b>последовательно</b>. Ток течёт по единственному пути через оба выключателя. Лампочка загорится, только если <b>A И B</b> включены одновременно — если хотя бы один разомкнут, цепь разорвана.',
  or:  'Выключатели соединены <b>параллельно</b> — это два независимых пути от батареи к лампочке. Лампочка загорится, если <b>A ИЛИ B</b> включены (достаточно любого одного), и погаснет только если оба выключены.',
  not: 'Один выключатель работает как инвертор. Пока кнопка <b>выключена</b>, цепь замкнута и лампочка <b>горит</b>. Стоит нажать кнопку — цепь размыкается, и лампочка <b>гаснет</b>. Результат всегда противоположен состоянию входа.'
};

function computeLit(a, b, m){
  if(m === 'and') return a && b;
  if(m === 'or') return a || b;
  return !a; // not
}

function setMode(m){
  mode = m;
  document.querySelectorAll('.mode-btn').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.mode === m);
  });
  document.getElementById('and-group').style.display = m === 'and' ? '' : 'none';
  document.getElementById('or-group').style.display = m === 'or' ? '' : 'none';
  document.getElementById('not-group').style.display = m === 'not' ? '' : 'none';
  document.getElementById('description').innerHTML = descriptions[m];
  render();
}

function toggleSwitch(letter){
  if(letter === 'A') switchA = !switchA;
  if(letter === 'B') switchB = !switchB;
  render();
}

function applySwitchVisual(el, on){
  if(!el) return;
  el.classList.toggle('on', on);
  const knob = el.querySelector('.knob');
  knob.setAttribute('cx', on ? 17 : -17);
  const label = el.querySelector('.switch-state');
  label.textContent = on ? 'ВКЛ' : 'ВЫКЛ';
}

function render(){
  const lit = computeLit(switchA, switchB, mode);

  // sync every switch instance (A appears in and/or/not groups, B in and/or)
  document.querySelectorAll('[data-switch="A"]').forEach(el => applySwitchVisual(el, switchA));
  document.querySelectorAll('[data-switch="B"]').forEach(el => applySwitchVisual(el, switchB));

  // common wires + bulb: energised only when the lamp is actually lit
  const commonIds = ['wireBattTop','wireBattBottom','wireLeftStub','wireRightStub','wireBottom','wireBulbTop','wireBulbBottom'];
  commonIds.forEach(id=>{
    const el = document.getElementById(id);
    el.classList.toggle('on', lit);
    el.classList.toggle('flow', lit);
  });

  document.getElementById('bulbGlass').classList.toggle('on', lit);
  document.getElementById('bulbFilament').classList.toggle('on', lit);

  // AND / NOT internal wires follow the same overall state (series circuit)
  document.querySelectorAll('.and-wire, .not-wire').forEach(el=>{
    el.classList.toggle('on', lit);
    el.classList.toggle('flow', lit);
  });

  // OR branches: each branch lights independently based on its own switch
  document.querySelectorAll('.or-wire').forEach((el, i)=>{
    // first two paths belong to branch A (top), last two to branch B (bottom)
    const isBranchA = i < 2;
    const on = isBranchA ? switchA : switchB;
    el.classList.toggle('on', on);
    el.classList.toggle('flow', on);
  });

  renderStatus(lit);
  renderTruthTable(lit);
}

function renderStatus(lit){
  const row = document.getElementById('statusRow');
  const items = [
    { label: 'A', on: switchA },
  ];
  if(mode !== 'not') items.push({ label: 'B', on: switchB });
  items.push({ label: 'Лампочка', on: lit });

  row.innerHTML = items.map(it => `
    <div class="chip"><span class="dot ${it.on ? 'on' : ''}"></span>${it.label}: ${it.on ? (it.label==='Лампочка' ? 'ГОРИТ' : 'ВКЛ') : (it.label==='Лампочка' ? 'НЕ ГОРИТ' : 'ВЫКЛ')}</div>
  `).join('');
}

function renderTruthTable(lit){
  const table = document.getElementById('truthTable');
  let rows;
  if(mode === 'not'){
    rows = [[false],[true]];
  } else {
    rows = [[false,false],[false,true],[true,false],[true,true]];
  }

  const header = mode === 'not'
    ? '<tr><th>A</th><th>Лампочка</th></tr>'
    : '<tr><th>A</th><th>B</th><th>Лампочка</th></tr>';

  const body = rows.map(r=>{
    const a = r[0];
    const b = mode === 'not' ? null : r[1];
    const result = computeLit(a, b, mode);
    const isActive = mode === 'not'
      ? a === switchA
      : a === switchA && b === switchB;
    const cells = mode === 'not'
      ? `<td>${a ? '1':'0'}</td><td class="${result ? 'result-on':''}">${result ? '1 (горит)':'0'}</td>`
      : `<td>${a ? '1':'0'}</td><td>${b ? '1':'0'}</td><td class="${result ? 'result-on':''}">${result ? '1 (горит)':'0'}</td>`;
    return `<tr class="${isActive ? 'active-row' : ''}">${cells}</tr>`;
  }).join('');

  table.innerHTML = header + body;
}

// event wiring
document.querySelectorAll('.mode-btn').forEach(btn=>{
  btn.addEventListener('click', ()=> setMode(btn.dataset.mode));
});
document.querySelectorAll('.switch').forEach(sw=>{
  sw.addEventListener('click', ()=> toggleSwitch(sw.dataset.switch));
});

setMode('and');