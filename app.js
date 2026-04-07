// JCI Debating Duel - app logic
(() => {
  const $ = (id) => document.getElementById(id);
  const screens = document.querySelectorAll('.screen');

  function go(id) {
    screens.forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
    if (id === 'leaderboard') renderLeaderboard();
    if (id === 'settings') loadSettings();
  }
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

  // --- Toast ---
  function toast(msg, ms = 2200) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), ms);
  }

  // --- Random motions ---
  const randomMotion = () => window.JCI_MOTIONS[Math.floor(Math.random() * window.JCI_MOTIONS.length)];
  $('s-random').addEventListener('click', () => { $('s-topic').value = randomMotion(); });
  $('d-random').addEventListener('click', () => { $('d-topic').value = randomMotion(); });

  // --- Settings ---
  function loadSettings() {
    $('api-key').value = localStorage.getItem('jci_api_key') || '';
    const m = localStorage.getItem('jci_model');
    if (m) $('model').value = m;
    $('api-test-result').textContent = '';
  }
  $('save-settings').addEventListener('click', () => {
    const k = $('api-key').value.trim();
    localStorage.setItem('jci_api_key', k);
    localStorage.setItem('jci_model', $('model').value);
    toast(k ? 'Settings saved' : 'Saved (no key set)');
  });

  $('test-api').addEventListener('click', async () => {
    const result = $('api-test-result');
    result.style.color = 'var(--muted)';
    result.textContent = 'Testing...';
    const k = $('api-key').value.trim() || localStorage.getItem('jci_api_key');
    if (!k) { result.style.color = '#E63946'; result.textContent = 'No key entered.'; return; }
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': k,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: $('model').value,
          max_tokens: 20,
          messages: [{ role: 'user', content: 'Reply with just OK' }]
        })
      });
      const data = await res.json();
      if (!res.ok) {
        result.style.color = '#E63946';
        result.textContent = `Failed: ${data.error?.message || res.status}`;
        return;
      }
      result.style.color = '#4ADE80';
      result.textContent = '✓ API key works!';
      localStorage.setItem('jci_api_key', k);
    } catch (e) {
      result.style.color = '#E63946';
      result.textContent = 'Network error: ' + e.message;
    }
  });

  // --- Leaderboard (localStorage) ---
  function getLB() { return JSON.parse(localStorage.getItem('jci_lb') || '[]'); }
  function saveLB(entry) {
    const lb = getLB();
    lb.push(entry);
    lb.sort((a, b) => b.score - a.score);
    localStorage.setItem('jci_lb', JSON.stringify(lb.slice(0, 100)));
  }
  function renderLeaderboard() {
    const tbody = document.querySelector('#lb-table tbody');
    const lb = getLB();
    tbody.innerHTML = lb.length
      ? lb.slice(0, 20).map((e, i) => `<tr><td>${i + 1}</td><td>${esc(e.name)}</td><td><b>${e.score}</b></td><td>${esc((e.topic || '').slice(0, 40))}</td></tr>`).join('')
      : '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:30px">No scores yet</td></tr>';
  }
  $('clear-lb').addEventListener('click', () => {
    if (confirm('Clear all leaderboard entries?')) { localStorage.removeItem('jci_lb'); renderLeaderboard(); }
  });
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // --- Game state ---
  let game = null;

  $('start-single').addEventListener('click', () => {
    const name = $('s-name').value.trim() || 'Player';
    const topic = $('s-topic').value.trim();
    if (!topic) return toast('Enter or roll a motion.');
    const side = $('s-side').value;
    const rounds = parseInt($('s-rounds').value, 10);
    game = {
      mode: 'single', topic, rounds, currentRound: 1, currentTurn: 0,
      players: [
        { name, side, speeches: [] },
        { name: 'AI Opponent', side: side === 'FOR' ? 'AGAINST' : 'FOR', speeches: [], ai: true }
      ]
    };
    startGame();
  });

  $('start-duel').addEventListener('click', () => {
    const p1 = $('d-p1').value.trim() || 'Player 1';
    const p2 = $('d-p2').value.trim() || 'Player 2';
    const topic = $('d-topic').value.trim();
    if (!topic) return toast('Enter or roll a motion.');
    const rounds = parseInt($('d-rounds').value, 10);
    game = {
      mode: 'duel', topic, rounds, currentRound: 1, currentTurn: 0,
      players: [
        { name: p1, side: 'FOR', speeches: [] },
        { name: p2, side: 'AGAINST', speeches: [] }
      ]
    };
    startGame();
  });

  function startGame() {
    go('game');
    $('topic-info').textContent = game.topic;
    nextTurn();
  }

  function nextTurn() {
    if (game.currentTurn >= game.players.length) {
      game.currentTurn = 0;
      game.currentRound++;
    }
    if (game.currentRound > game.rounds) { return finishGame(); }
    const p = game.players[game.currentTurn];
    $('round-info').textContent = `Round ${game.currentRound} / ${game.rounds}`;

    if (p.ai) {
      p.speeches.push(aiArgument(p, game));
      game.currentTurn++;
      nextTurn();
      return;
    }

    $('turn-card').classList.remove('hidden');
    $('speak-card').classList.add('hidden');
    $('turn-player').textContent = p.name;
    $('turn-side').textContent = p.side;
  }

  $('ready-btn').addEventListener('click', () => {
    const p = game.players[game.currentTurn];
    $('turn-card').classList.add('hidden');
    $('speak-card').classList.remove('hidden');
    $('speak-player').textContent = p.name;
    $('speak-side').textContent = p.side;
    $('speech').value = '';
    $('mic-status').textContent = '';
    $('speech').focus();
    startTimer(120);
  });

  let timerInt = null;
  function startTimer(sec) {
    clearInterval(timerInt);
    let t = sec;
    const fmt = () => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    $('timer').textContent = fmt();
    timerInt = setInterval(() => {
      t--;
      $('timer').textContent = fmt();
      if (t <= 0) { clearInterval(timerInt); submitSpeech(); }
    }, 1000);
  }

  function submitSpeech() {
    clearInterval(timerInt);
    stopRecognition();
    const p = game.players[game.currentTurn];
    const text = $('speech').value.trim() || '(no argument given)';
    p.speeches.push(text);
    game.currentTurn++;
    nextTurn();
  }
  $('submit-speech').addEventListener('click', submitSpeech);

  // --- Speech recognition (dictation) ---
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let recognizing = false;
  let baseSpeechText = '';

  function setupRecognition() {
    if (!SR) return null;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = navigator.language || 'en-US';
    r.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += tr + ' ';
        else interim += tr;
      }
      if (final) baseSpeechText += final;
      $('speech').value = (baseSpeechText + interim).trimStart();
    };
    r.onerror = (e) => {
      $('mic-status').textContent = 'Mic error: ' + e.error;
      stopRecognition();
    };
    r.onend = () => {
      if (recognizing) {
        try { r.start(); } catch (_) { recognizing = false; updateMicUI(); }
      }
    };
    return r;
  }

  function updateMicUI() {
    const btn = $('mic-btn');
    if (recognizing) { btn.classList.add('recording'); $('mic-status').textContent = '● Listening... tap mic to stop'; }
    else { btn.classList.remove('recording'); }
  }

  function stopRecognition() {
    if (recognition && recognizing) {
      recognizing = false;
      try { recognition.stop(); } catch (_) {}
    }
    updateMicUI();
  }

  $('mic-btn').addEventListener('click', () => {
    if (!SR) { toast('Voice dictation not supported on this browser.'); return; }
    if (!recognition) recognition = setupRecognition();
    if (recognizing) { stopRecognition(); return; }
    baseSpeechText = $('speech').value ? $('speech').value + ' ' : '';
    recognizing = true;
    try {
      recognition.start();
      updateMicUI();
    } catch (e) {
      recognizing = false;
      toast('Could not start mic: ' + e.message);
    }
  });

  function aiArgument(p, g) {
    return `[AI stance — ${p.side}] On "${g.topic}": evidence suggests this side holds because of clarity, precedent, and measurable impact.`;
  }

  // --- Results / Claude judging ---
  async function finishGame() {
    go('results');
    $('verdict-loading').classList.remove('hidden');
    $('verdict-content').classList.add('hidden');
    try {
      const verdict = await judgeWithClaude(game);
      renderVerdict(verdict);
      verdict.scores.forEach(s => {
        saveLB({ name: s.player, score: s.total, topic: game.topic, date: Date.now() });
      });
    } catch (e) {
      renderVerdict(fallbackJudge(game, e.message));
    }
  }

  function renderVerdict(v) {
    $('verdict-loading').classList.add('hidden');
    $('verdict-content').classList.remove('hidden');
    $('winner-banner').textContent = `Winner: ${v.winner}`;
    $('scores').innerHTML = v.scores.map(s => `
      <div class="score-row">
        <b>${esc(s.player)}</b> — Total: <b>${s.total}/100</b><br>
        Argument: ${s.argument} · Evidence: ${s.evidence} · Rebuttal: ${s.rebuttal} · Delivery: ${s.delivery}
      </div>`).join('');
    $('feedback').textContent = v.feedback || '';
  }

  function fallbackJudge(g, err) {
    const scores = g.players.map(p => {
      const all = p.speeches.join(' ');
      const len = all.length;
      const base = Math.min(25, Math.round(len / 40));
      const variance = () => Math.max(5, Math.min(25, base + Math.floor(Math.random() * 6) - 3));
      const a = variance(), ev = variance(), r = variance(), d = variance();
      return { player: p.name, argument: a, evidence: ev, rebuttal: r, delivery: d, total: a + ev + r + d };
    });
    scores.sort((a, b) => b.total - a.total);
    return {
      winner: scores[0].player,
      scores,
      feedback: `(Local fallback judge — Claude API unavailable${err ? ': ' + err : ''}.)\nSet your Claude API key in Settings and tap "Test API Key" to verify.`
    };
  }

  async function judgeWithClaude(g) {
    const key = localStorage.getItem('jci_api_key');
    const model = localStorage.getItem('jci_model') || 'claude-sonnet-4-6';
    if (!key) throw new Error('No API key set');

    const transcript = g.players.map(p =>
      `${p.name} (${p.side}):\n` + p.speeches.map((s, i) => `  Round ${i + 1}: ${s}`).join('\n')
    ).join('\n\n');

    const system = `You are an impartial debating judge applying JCI (Junior Chamber International) debating guidelines.
Judge each debater on 4 criteria (each 0-25):
1. Argument strength
2. Evidence & examples
3. Rebuttal & engagement
4. Delivery & structure
Total = sum (0-100). Respect the JCI spirit: fairness, respect, growth.
Return ONLY valid JSON in this exact schema:
{"winner":"name","scores":[{"player":"name","argument":0,"evidence":0,"rebuttal":0,"delivery":0,"total":0}],"feedback":"2-4 sentences of constructive feedback citing the rules"}`;

    const user = `Motion: ${g.topic}\nRounds: ${g.rounds}\n\nTranscript:\n${transcript}\n\nJudge now. JSON only.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: user }]
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error?.message || ('API ' + res.status));
    const text = data.content?.[0]?.text || '';
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Malformed judge response');
    return JSON.parse(m[0]);
  }
})();
