(function () {
  "use strict";

  const DATA = window.CAZA_DATA;
  const optilabResults = window.OptiLabResults?.create('caza-el-pivote');
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const KEY_MUTE = "caza-el-pivote-muted";
  const KEY_BEST = "caza-el-pivote-best";
  const EPS = 1e-9;
  const steps = [
    { title: "Toca la columna pivote", detail: "En maximización, busca el valor más negativo en zⱼ − cⱼ.", kicker: "PASO 1 DE 3" },
    { title: "Toca el renglón pivote", detail: "Compara θ = Sol./y. Solo participan valores y positivos.", kicker: "PASO 2 DE 3" },
    { title: "Toca el elemento pivote", detail: "Elige el número en la intersección de la columna y el renglón.", kicker: "PASO 3 DE 3" },
    { title: "¡Pivote encontrado!", detail: "Revisa la selección y continúa a la siguiente tabla.", kicker: "TABLA COMPLETADA" }
  ];
  const hints = [
    "En la fila zⱼ − cⱼ, compara los coeficientes de x₁, x₂, s₁ y s₂. Para maximizar, entra la variable del valor más negativo.",
    "Divide cada Sol. entre el valor de esa columna en el renglón. Descarta y ≤ 0; gana la razón positiva más pequeña.",
    "El elemento pivote es el valor donde se cruzan la columna pivote y el renglón pivote."
  ];
  const state = {
    view: "home", active: false, paused: false, tables: [], index: 0, step: 0,
    answer: null, selectedCol: null, selectedRow: null, errors: 0,
    stepErrors: 0, hinted: false, tableHelped: false, firstTryHits: 0,
    attempts: 0, correctSelections: 0, totalErrors: 0, points: 0, streak: 0, bestStreak: 0,
    results: [], elapsedBeforePause: 0, clockStartedAt: 0, clockInterval: 0,
    muted: readStorage(KEY_MUTE, "false") === "true", lastInputAt: 0
  };

  function readStorage(key, fallback) {
    try { return localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; }
  }
  function writeStorage(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* almacenamiento opcional */ }
  }
  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function num(value) {
    const n = Math.abs(value) < EPS ? 0 : value;
    return String(n).replace("-", "−");
  }
  function spoken(value) { return value < 0 ? `menos ${Math.abs(value)}` : String(value); }
  function variableHTML(name) {
    const subscripts = "₀₁₂₃₄₅₆₇₈₉";
    return name.replace(/([xs])(\d)/, (_, letter, digit) => `${letter}${subscripts[Number(digit)]}`);
  }
  function variableText(name) {
    return name.replace(/([xs])(\d)/, "$1$2");
  }
  function formatRatio(ratio) {
    if (!ratio || ratio.value === null) return "—";
    return `${num(ratio.sol)}/${num(ratio.coef)}`;
  }
  function formatTimer(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
  }

  // Reglas: zj-cj mínimo único y razón mínima entre renglones con y > 0.
  function solve(table) {
    const values = table.zj_cj.slice(0, DATA.columnas.length);
    const min = Math.min(...values);
    const entering = values.map((value, index) => ({ value, index })).filter((item) => Math.abs(item.value - min) < EPS);
    if (min >= -EPS || entering.length !== 1) throw new Error(`Tabla ${table.id}: columna pivote no única.`);
    const col = entering[0].index;
    const candidates = table.filas.map((row, index) => ({
      row: index, coef: row[col], sol: row[4], value: row[col] > EPS ? row[4] / row[col] : null
    })).filter((item) => item.value !== null);
    if (!candidates.length) throw new Error(`Tabla ${table.id}: no hay renglón pivote válido.`);
    const minRatio = Math.min(...candidates.map((item) => item.value));
    const leaving = candidates.filter((item) => Math.abs(item.value - minRatio) < EPS);
    if (leaving.length !== 1) throw new Error(`Tabla ${table.id}: razón mínima no única.`);
    return { col, row: leaving[0].row, pivot: table.filas[leaving[0].row][col], ratio: leaving[0].value, ratios: table.filas.map((r, i) => ({ row: i, coef: r[col], sol: r[4], value: r[col] > EPS ? r[4] / r[col] : null })) };
  }

  const audio = {
    context: null,
    async resume() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!this.context) this.context = new AudioCtx();
        if (this.context.state === "suspended") await this.context.resume();
      } catch (_) { /* audio decorativo */ }
    },
    tone(frequency, start, duration, type, peak) {
      if (state.muted || !this.context || this.context.state !== "running") return;
      try {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = type || "sine";
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(.0001, start);
        gain.gain.exponentialRampToValueAtTime(peak || .07, start + .014);
        gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
        oscillator.connect(gain); gain.connect(this.context.destination);
        oscillator.start(start); oscillator.stop(start + duration + .02);
      } catch (_) { /* algunos navegadores pueden negar audio */ }
    },
    play(kind) {
      if (state.muted) return;
      if (!this.context) { this.resume(); return; }
      if (this.context.state !== "running") {
        this.resume().then(() => { if (this.context?.state === "running") this.play(kind); });
        return;
      }
      const now = this.context.currentTime;
      const sounds = {
        select: [[510, 0, .055, "sine", .025]],
        correct: [[640, 0, .11, "sine", .045], [860, .09, .14, "sine", .05]],
        error: [[220, 0, .17, "triangle", .055], [165, .10, .19, "triangle", .045]],
        pivot: [[520, 0, .12, "triangle", .06], [660, .10, .13, "triangle", .06], [880, .20, .23, "triangle", .07]],
        finish: [[660, 0, .14, "sine", .05], [830, .12, .14, "sine", .05], [990, .24, .27, "sine", .06]]
      };
      (sounds[kind] || []).forEach(([hz, delay, length, wave, volume]) => this.tone(hz, now + delay, length, wave, volume));
    }
  };

  function currentTable() { return state.tables[state.index]; }
  function currentSolution() { return currentTable().answer; }
  function view(name) {
    state.view = name;
    $("#screen-home").hidden = name !== "home";
    $("#screen-game").hidden = name !== "game";
    $("#screen-results").hidden = name !== "results";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function setBackgroundInert(inert) {
    $("#main").inert = inert;
    $(".site-header").inert = inert;
    $(".site-footer").inert = inert;
  }
  function setFeedback(message, type = "info") {
    const panel = $("#feedback");
    panel.className = `feedback${type === "info" ? "" : ` is-${type}`}`;
    $("#feedback-mark").textContent = type === "success" ? "✓" : type === "error" ? "!" : type === "hint" ? "⌁" : "i";
    $("#feedback-text").textContent = message;
  }
  function updateMuteButton() {
    const button = $("#sound-toggle");
    button.setAttribute("aria-pressed", String(state.muted));
    button.setAttribute("aria-label", state.muted ? "Activar sonido" : "Silenciar sonido");
    $(".sound-label", button).textContent = state.muted ? "Silenciado" : "Sonido";
  }
  function bestScore() {
    const best = Number(readStorage(KEY_BEST, "0")) || 0;
    $("#home-best").textContent = best ? `${best} pts` : "—";
    return best;
  }
  function makeMatch() {
    const chosen = [];
    for (const level of [1, 2, 3]) {
      const pool = shuffle(DATA.tablas.filter((item) => item.nivel === level));
      chosen.push(...pool.slice(0, DATA.mezclaPorNivel[level]));
    }
    return shuffleByLevelOrder(chosen);
  }
  function shuffleByLevelOrder(chosen) {
    const result = [];
    for (const level of [1, 2, 3]) result.push(...chosen.filter((item) => item.nivel === level));
    return result;
  }
  function startMatch() {
    if (!DATA || DATA.tablas.length < DATA.rondasPorPartida) return;
    optilabResults?.start();
    clearInterval(state.clockInterval);
    audio.resume();
    state.active = true; state.paused = false; state.tables = makeMatch().map((item) => ({ ...item, answer: solve(item) }));
    state.index = 0; state.step = 0; state.firstTryHits = 0; state.attempts = 0; state.correctSelections = 0; state.totalErrors = 0;
    state.points = 0; state.streak = 0; state.bestStreak = 0; state.results = [];
    state.elapsedBeforePause = 0; state.clockStartedAt = performance.now(); state.tableHelped = false;
    $("#pause-overlay").hidden = true; setBackgroundInert(false);
    view("game"); startTable(); updateHud(); tickClock();
    state.clockInterval = window.setInterval(tickClock, 200);
  }
  function startTable() {
    state.step = 0; state.selectedCol = null; state.selectedRow = null;
    state.errors = 0; state.stepErrors = 0; state.hinted = false; state.tableHelped = false;
    const table = currentTable();
    $("#round-number").textContent = String(state.index + 1);
    $("#round-total").textContent = `/ ${state.tables.length}`;
    $("#table-caption").textContent = table.iteracion === 0 ? "Tabla inicial" : `Iteración ${table.iteracion + 1}`;
    $("#level-badge").textContent = DATA.niveles[table.nivel].toUpperCase();
    renderTable();
    $("#summary-card").hidden = true;
    $("#hint-button").hidden = false;
    $("#reveal-button").hidden = true;
    $("#next-button").hidden = true;
    $("#next-button").textContent = state.index === state.tables.length - 1 ? "Ver resultados →" : "Siguiente tabla →";
    setFeedback("Elige la columna con el criterio correcto.");
    paint(); updateProgress(); updateHud();
    $("#prompt-title").focus({ preventScroll: true });
  }
  function renderTable() {
    const table = currentTable();
    const header = `<tr><th scope="col" class="base-col">Base</th>${DATA.columnas.map((name, col) => `<th scope="col" class="var-col"><button type="button" class="cell-button head-button choice" data-kind="column" data-c="${col}" aria-label="Seleccionar columna ${variableText(name)}">${variableHTML(name)}</button></th>`).join("")}<th scope="col" class="sol-col"><span aria-label="Solución">Sol.</span></th><th scope="col" class="theta-col"><span aria-label="Razón theta">θ</span></th></tr>`;
    const rows = table.filas.map((row, r) => `<tr class="constraint-row" data-row="${r}"><th scope="row" class="base-col"><button type="button" class="cell-button row-button choice" data-kind="row" data-r="${r}" aria-label="Seleccionar renglón de la variable básica ${variableText(table.base[r])}">${variableHTML(table.base[r])}</button></th>${DATA.columnas.map((name, c) => `<td><button type="button" class="cell-button choice" data-kind="cell" data-r="${r}" data-c="${c}" aria-label="Renglón ${variableText(table.base[r])}, columna ${variableText(name)}, valor ${spoken(row[c])}">${num(row[c])}</button></td>`).join("")}<td class="sol-col"><button type="button" class="cell-button choice sol-button" data-kind="sol" data-r="${r}" aria-label="Solución del renglón ${variableText(table.base[r])}: ${spoken(row[4])}">${num(row[4])}</button></td><td class="theta-col"><button type="button" class="cell-button choice theta-button" data-kind="ratio" data-r="${r}" aria-label="Razón del renglón ${variableText(table.base[r])}, se muestra después de seleccionar la columna pivote">·</button></td></tr>`).join("");
    const zrow = `<tr class="z-row"><th scope="row" class="base-col"><span>zⱼ−cⱼ</span></th>${table.zj_cj.slice(0, 4).map((value, c) => `<td><button type="button" class="cell-button choice" data-kind="zvalue" data-r="2" data-c="${c}" aria-label="Renglón z j menos c j, columna ${variableText(DATA.columnas[c])}, valor ${spoken(value)}">${num(value)}</button></td>`).join("")}<td class="sol-col"><span class="cell-button">${num(table.zj_cj[4])}</span></td><td class="theta-col"><span class="cell-button theta-button">—</span></td></tr>`;
    $("#table-head").innerHTML = header;
    $("#table-body").innerHTML = `${rows}${zrow}`;
  }
  function paint() {
    const table = currentTable();
    $$("#simplex-table .choice").forEach((button) => {
      button.classList.remove("is-col", "is-row", "is-pivot", "is-wrong");
      const kind = button.dataset.kind;
      const c = Number(button.dataset.c);
      const r = Number(button.dataset.r);
      if (state.selectedCol !== null && ((kind === "column" || kind === "cell" || kind === "zvalue") && c === state.selectedCol)) button.classList.add("is-col");
      if (state.selectedRow !== null && ((kind === "row" || kind === "cell" || kind === "sol" || kind === "ratio") && r === state.selectedRow)) button.classList.add("is-row");
      if (state.step === 3 && kind === "cell" && r === currentSolution().row && c === currentSolution().col) button.classList.add("is-pivot");
    });
    const ratioVisible = state.step >= 1;
    $$(".theta-button[data-kind=" + '"ratio"' + "]").forEach((button) => {
      const r = Number(button.dataset.r);
      const ratio = ratioVisible ? currentSolution().ratios[r] : null;
      if (!ratioVisible) {
        button.textContent = "·"; button.classList.remove("is-invalid");
        button.setAttribute("aria-label", "Razón todavía oculta; selecciona la columna pivote primero");
      } else if (ratio.value === null) {
        button.textContent = "no válida"; button.classList.add("is-invalid");
        button.setAttribute("aria-label", `Razón no válida para ${variableText(table.base[r])}: el valor de la columna es ${spoken(ratio.coef)}, no es positivo`);
      } else {
        button.textContent = formatRatio(ratio);
        button.classList.remove("is-invalid");
        button.setAttribute("aria-label", `Razón de ${variableText(table.base[r])}: ${spoken(ratio.sol)} entre ${spoken(ratio.coef)}, igual a ${ratio.value}`);
      }
    });
    $$(".step").forEach((item, index) => {
      item.classList.toggle("is-active", state.step === index);
      item.classList.toggle("is-done", state.step > index);
    });
    const prompt = steps[Math.min(state.step, 3)];
    $("#prompt-kicker").textContent = prompt.kicker;
    $("#prompt-title").textContent = prompt.title;
    $("#prompt-detail").textContent = prompt.detail;
    $("#hint-button").disabled = state.step > 2 || !state.active;
    $("#reveal-button").hidden = state.step > 2 || state.stepErrors < 2;
    $("#hint-button").hidden = state.step > 2;
    $("#next-button").hidden = state.step !== 3;
    updateProgress(); updateHud();
  }
  function updateProgress() {
    $("#round-progress").innerHTML = state.tables.map((_, i) => {
      const result = state.results[i];
      const cls = result ? result.status === "clean" ? "clean" : result.status === "revealed" ? "revealed" : result.status === "incomplete" ? "" : "helped" : i === state.index && state.active ? "current" : "";
      return `<span class="progress-dot ${cls}" aria-label="Tabla ${i + 1}: ${result ? result.status : i === state.index ? "actual" : "pendiente"}"></span>`;
    }).join("");
  }
  function elapsedMs() {
    return state.elapsedBeforePause + (state.active && !state.paused ? performance.now() - state.clockStartedAt : 0);
  }
  function tickClock() {
    if (!state.active || state.paused) return;
    const remaining = DATA.duracionSeg - elapsedMs() / 1000;
    $("#timer").textContent = formatTimer(remaining);
    $(".hud-time").classList.toggle("is-low", remaining <= 15);
    if (remaining <= 0) finishMatch("time");
  }
  function updateHud() {
    $("#hits").textContent = String(state.firstTryHits);
    $("#score").textContent = String(state.points);
    $("#streak").textContent = String(state.streak);
    if (state.tables.length) {
      $("#round-number").textContent = String(Math.min(state.index + 1, state.tables.length));
      $("#round-total").textContent = `/ ${state.tables.length}`;
    }
  }
  function startClockAgain() {
    state.clockStartedAt = performance.now();
    state.paused = false;
    $("#pause-overlay").hidden = true;
    setBackgroundInert(false);
    tickClock();
  }
  function pauseMatch() {
    if (!state.active || state.paused) return;
    state.elapsedBeforePause += performance.now() - state.clockStartedAt;
    state.paused = true;
    setBackgroundInert(true);
    $("#pause-overlay").hidden = false;
    $("#resume-button").focus({ preventScroll: true });
  }
  function quitToHome() {
    optilabResults?.cancel();
    clearInterval(state.clockInterval);
    state.active = false; state.paused = false;
    $("#pause-overlay").hidden = true; setBackgroundInert(false);
    view("home"); bestScore(); $("#play-button").focus({ preventScroll: true });
  }
  function registerError(button, message) {
    if (!state.active || state.paused) return;
    state.stepErrors++; state.errors++; state.totalErrors++; state.attempts++;
    state.tableHelped = true; state.streak = 0;
    audio.play("error"); setFeedback(message, "error"); paint();
    if (button) {
      button.classList.add("is-wrong");
      window.setTimeout(() => button.isConnected && button.classList.remove("is-wrong"), 380);
    }
  }
  function neutral(message) { audio.play("select"); setFeedback(message); }
  function handleColumn(target, button) {
    if (target.kind === "sol" || target.kind === "ratio" || target.kind === "row") {
      registerError(button, target.kind === "sol" ? "Sol. no es una variable: busca una columna de la tabla." : "Primero identifica la columna entre x₁, x₂, s₁ y s₂."); return;
    }
    if (!(["column", "cell", "zvalue"].includes(target.kind)) || target.c === undefined) {
      neutral("Elige una columna de variable; no el renglón zⱼ − cⱼ."); return;
    }
    const solution = currentSolution();
    if (target.c !== solution.col) {
      registerError(button, `No es esa: revisa cuál tiene el zⱼ − cⱼ más negativo. (${variableText(DATA.columnas[target.c])}: ${num(currentTable().zj_cj[target.c])}).`); return;
    }
    state.selectedCol = solution.col; state.step = 1;
    rewardCorrect(); state.stepErrors = 0; state.hinted = false; audio.play("correct");
    setFeedback(`Correcto: ${variableText(DATA.columnas[solution.col])} es la columna pivote (zⱼ − cⱼ = ${num(currentTable().zj_cj[solution.col])}).`, "success");
    paint();
  }
  function handleRow(target, button) {
    if (["column"].includes(target.kind)) { neutral("La columna ya está elegida. Ahora toca el renglón con la razón mínima."); return; }
    let row = null;
    if (target.kind === "row" || target.kind === "ratio" || target.kind === "sol" || (target.kind === "cell" && target.r < 2)) row = target.r;
    if (target.kind === "zvalue" || (target.kind === "cell" && target.r === 2)) {
      registerError(button, "El renglón zⱼ − cⱼ no es una restricción y no puede salir de la base."); return;
    }
    if (row === null || row < 0 || row > 1) { neutral("Elige uno de los dos renglones de restricción."); return; }
    const solution = currentSolution();
    const ratio = solution.ratios[row];
    if (row !== solution.row) {
      if (ratio.value === null) registerError(button, "Esa razón no es válida: el valor en la columna pivote debe ser positivo.");
      else registerError(button, "Esa razón es mayor. El renglón pivote tiene la razón positiva mínima.");
      return;
    }
    state.selectedRow = solution.row; state.step = 2;
    rewardCorrect(); state.stepErrors = 0; state.hinted = false; audio.play("correct");
    setFeedback(`Bien: θ = ${formatRatio(ratio)} = ${ratio.value}. Ese renglón cumple la razón mínima.`, "success");
    paint();
  }
  function handlePivot(target, button) {
    if (target.kind === "cell" && target.r < 2 && target.c < DATA.columnas.length) {
      const solution = currentSolution();
      if (target.r === solution.row && target.c === solution.col) {
        state.step = 3; state.selectedCol = solution.col; state.selectedRow = solution.row;
        rewardCorrect(); audio.play("pivot");
        const table = currentTable();
        setFeedback(`¡Excelente! El elemento pivote es ${num(solution.pivot)}: sale ${variableText(table.base[solution.row])} y entra ${variableText(DATA.columnas[solution.col])}.`, "success");
        finishTable(state.tableHelped ? "helped" : "clean"); return;
      }
      registerError(button, "Ese no es el cruce elegido. Busca la intersección del renglón y la columna pivote."); return;
    }
    neutral("Toca el número ubicado en la intersección; no el encabezado.");
  }
  function rewardCorrect() {
    state.attempts++;
    state.correctSelections++;
    const clean = state.stepErrors === 0 && !state.hinted;
    if (clean) {
      state.firstTryHits++; state.streak++; state.bestStreak = Math.max(state.bestStreak, state.streak); state.points += 100;
    } else {
      state.streak = 0; state.points += 50;
    }
    updateHud();
  }
  function onTableClick(event) {
    const button = event.target.closest("button.choice");
    if (!button || !state.active || state.paused || state.step > 2) return;
    audio.resume();
    audio.play("select");
    const target = { kind: button.dataset.kind, c: button.dataset.c === undefined ? undefined : Number(button.dataset.c), r: button.dataset.r === undefined ? undefined : Number(button.dataset.r) };
    if (state.step === 0) handleColumn(target, button);
    else if (state.step === 1) handleRow(target, button);
    else handlePivot(target, button);
  }
  function showHint() {
    if (!state.active || state.paused || state.step > 2) return;
    state.hinted = true; state.tableHelped = true; state.streak = 0;
    setFeedback(hints[state.step], "hint"); audio.play("select"); updateHud();
  }
  function showAnswer() {
    if (!state.active || state.paused || state.step > 2) return;
    const solution = currentSolution();
    state.selectedCol = solution.col; state.selectedRow = solution.row; state.step = 3;
    state.tableHelped = true; state.streak = 0;
    const table = currentTable();
    setFeedback(`Respuesta: entra ${variableText(DATA.columnas[solution.col])}, sale ${variableText(table.base[solution.row])}; el pivote es ${num(solution.pivot)}.`, "hint");
    finishTable("revealed"); audio.play("pivot");
  }
  function modelSummary(model) {
    const terms = model.c.map((coefficient, i) => `${i && coefficient >= 0 ? "+ " : i ? "− " : coefficient < 0 ? "−" : ""}${Math.abs(coefficient) === 1 ? "" : Math.abs(coefficient)}x${i + 1}`).join(" ");
    const constraints = model.a.map((row, r) => `${row.map((coefficient, i) => `${i && coefficient >= 0 ? "+ " : i ? "− " : coefficient < 0 ? "−" : ""}${Math.abs(coefficient) === 1 ? "" : Math.abs(coefficient)}x${i + 1}`).join(" ")} ≤ ${model.b[r]}`).join("; ");
    return `Modelo de origen: máx z = ${terms}; ${constraints}.`;
  }
  function renderSummary() {
    const table = currentTable(); const answer = currentSolution();
    $("#summary-card").innerHTML = `<h3>${state.results[state.index]?.status === "revealed" ? "Respuesta de la tabla" : "Movimiento completado"}</h3><div class="summary-pills"><span>Entra ${variableHTML(DATA.columnas[answer.col])}</span><span>Sale ${variableHTML(table.base[answer.row])}</span><span>Pivote ${num(answer.pivot)}</span><span>θ = ${formatRatio(answer.ratios[answer.row])}</span></div><p class="summary-model">${modelSummary(table.modelo)}</p>`;
    $("#summary-card").hidden = false;
  }
  function finishTable(status) {
    if (state.results[state.index]) return;
    const table = currentTable();
    state.results[state.index] = { status, id: table.id, level: table.nivel, col: currentSolution().col, row: currentSolution().row, pivot: currentSolution().pivot, errors: state.errors };
    state.step = 3; state.streak = status === "clean" ? state.streak : 0;
    renderSummary(); paint();
    $("#hint-button").hidden = true; $("#reveal-button").hidden = true; $("#next-button").hidden = false;
    updateProgress(); updateHud(); $("#next-button").focus({ preventScroll: true });
  }
  function advanceTable() {
    if (!state.active || state.step !== 3) return;
    if (state.index + 1 >= state.tables.length) { finishMatch("complete"); return; }
    state.index++; startTable();
  }
  function finishMatch(reason) {
    if (!state.active) return;
    const elapsedAtEnd = elapsedMs();
    state.active = false; state.paused = false; clearInterval(state.clockInterval);
    if (!state.results[state.index] && reason === "time") {
      state.results[state.index] = { status: "incomplete", id: currentTable().id, level: currentTable().nivel };
    }
    for (let i = 0; i < state.tables.length; i++) {
      if (!state.results[i]) state.results[i] = { status: "incomplete", id: state.tables[i].id, level: state.tables[i].nivel };
    }
    const elapsed = Math.min(DATA.duracionSeg, Math.floor(elapsedAtEnd / 1000));
    optilabResults?.complete({reason:reason==='time'?'time-limit':'completed',correct:state.firstTryHits,total:state.tables.length*3,attempts:state.attempts,errors:state.totalErrors,durationMs:elapsed*1000,score:state.points});
    const completed = state.results.filter((item) => item.status !== "incomplete").length;
    const clean = state.results.filter((item) => item.status === "clean").length;
    const accuracy = state.correctSelections ? Math.round(state.firstTryHits / state.correctSelections * 100) : 0;
    const previousBest = bestScore();
    const isRecord = state.points > previousBest;
    if (isRecord) writeStorage(KEY_BEST, String(state.points));
    $("#results-title").textContent = reason === "time" ? "¡Se acabó el tiempo!" : completed === state.tables.length ? "¡Pivote localizado!" : "Partida finalizada";
    $("#results-subtitle").textContent = reason === "time" ? "Revisa los movimientos y vuelve a intentarlo." : "Buen trabajo siguiendo el criterio simplex.";
    $("#final-score").textContent = String(state.points);
    $("#record-message").textContent = isRecord ? "¡Nuevo récord personal!" : previousBest ? `Récord personal: ${previousBest} pts` : "";
    const stats = [
      ["Tablas completadas", `${completed} / ${state.tables.length}`],
      ["Sin ayuda", `${clean} / ${completed || state.tables.length}`],
      ["Aciertos al primer intento", `${accuracy}%`],
      ["Errores", String(state.totalErrors)],
      ["Tiempo", formatTimer(elapsed)],
      ["Mejor racha", String(state.bestStreak)]
    ];
    $("#result-stats").innerHTML = stats.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("");
    $("#review-list").innerHTML = state.results.map((result, index) => {
      const answer = state.tables[index].answer;
      const table = state.tables[index];
      const status = result.status;
      const label = status === "clean" ? "LIMPIA" : status === "helped" ? "CON AYUDA" : status === "revealed" ? "RESPUESTA MOSTRADA" : "INCOMPLETA";
      const cls = status === "clean" ? "" : status === "incomplete" ? "incomplete" : status === "revealed" ? "reveal" : "help";
      return `<li class="review-item"><span class="review-index">${String(index + 1).padStart(2, "0")}</span><span class="review-copy"><strong>Nivel ${table.nivel} · ${variableText(DATA.columnas[answer.col])} entra / ${variableText(table.base[answer.row])} sale</strong><small>Elemento pivote: ${num(answer.pivot)}</small></span><span class="review-status ${cls}">${label}</span></li>`;
    }).join("");
    $("#pause-overlay").hidden = true; setBackgroundInert(false); view("results"); audio.play("finish"); $("#replay-button").focus({ preventScroll: true });
  }
  function moveTableFocus(event) {
    if (!event.key.startsWith("Arrow")) return;
    const current = event.target.closest(".choice");
    if (!current) return;
    const cell = current.closest("td, th"); const row = current.closest("tr");
    if (!cell || !row) return;
    const delta = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[event.key];
    const nextRow = $("#simplex-table").rows[row.rowIndex + delta[0]];
    const nextCell = nextRow?.cells[cell.cellIndex + delta[1]];
    const nextButton = nextCell?.querySelector("button.choice");
    if (nextButton) { event.preventDefault(); nextButton.focus(); }
  }
  function toggleMute() {
    state.muted = !state.muted; writeStorage(KEY_MUTE, String(state.muted)); updateMuteButton();
    if (!state.muted) { audio.resume(); audio.play("select"); }
  }
  function onGlobalKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (state.paused && event.key === "Tab") {
      const resume = $("#resume-button"); const quit = $("#quit-button");
      if (event.shiftKey && document.activeElement === resume) { event.preventDefault(); quit.focus(); }
      else if (!event.shiftKey && document.activeElement === quit) { event.preventDefault(); resume.focus(); }
      return;
    }
    if (event.key.toLowerCase() === "m") { toggleMute(); return; }
    if (event.key === "Escape" && state.active) {
      if (state.paused) { startClockAgain(); $("#pause-button").focus({ preventScroll: true }); }
      else pauseMatch();
    }
    if (event.key === "Enter" && state.active && state.step === 3 && event.target.closest("#simplex-table")) advanceTable();
  }
  function init() {
    if (!DATA || !Array.isArray(DATA.tablas) || DATA.tablas.length !== 15) {
      $("#play-button").disabled = true;
      setFeedback?.("No se pudo cargar el banco de tablas.");
      return;
    }
    // Verificación defensiva también en el navegador.
    DATA.tablas.forEach((table) => solve(table));
    updateMuteButton(); bestScore();
    $("#simplex-table").addEventListener("click", onTableClick);
    $("#simplex-table").addEventListener("keydown", moveTableFocus);
    $("#play-button").addEventListener("click", startMatch);
    $("#replay-button").addEventListener("click", startMatch);
    $("#home-button").addEventListener("click", quitToHome);
    $("#sound-toggle").addEventListener("click", toggleMute);
    $("#pause-button").addEventListener("click", () => pauseMatch());
    $("#resume-button").addEventListener("click", () => { startClockAgain(); $("#pause-button").focus({ preventScroll: true }); });
    $("#quit-button").addEventListener("click", quitToHome);
    $("#hint-button").addEventListener("click", showHint);
    $("#reveal-button").addEventListener("click", showAnswer);
    $("#next-button").addEventListener("click", advanceTable);
    document.addEventListener("keydown", onGlobalKey);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.active && !state.paused) pauseMatch();
    });
  }
  init();
})();
