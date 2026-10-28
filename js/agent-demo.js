(() => {
  const demo = document.querySelector('.agent-demo');
  if (!demo) return;
  const byId = id => demo.querySelector('#' + id);
  const play = byId('agent-play');
  const change = byId('agent-change');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const names = ['Observe the environment', 'Update spatio-temporal memory', 'Reason about alternatives', 'Act on the plan', 'Read environmental feedback', 'Learn for the next task'];
  const scenes = {
    geo: {
      title: 'An evolving geographic space', labels: ['A','B','C','D','E','F'], unknown: 'New location',
      known: 'Known locations and spatial connections.', memory: 'established spatial relationships', learned: 'new location and its connections',
      standard: ['Read locations, motion, and relationships across space and time.', 'Connect the latest observations with past locations and movement patterns.', 'Compare possible routes using the current spatial memory.', 'Follow the selected route toward the task destination.', 'Compare the observed outcome with the expected route and conditions.', 'Retain useful relationships and refine the next plan from feedback.'],
      changed: ['A previously unseen location appears. Observe its connections before acting.', 'Record the new location as provisional knowledge; earlier spatial knowledge is retained.', 'Reconsider the route using the newly observed connection and remaining uncertainty.', 'Follow an updated route that includes the new location.', 'Check whether the observed connection supports the revised route.', 'Incorporate the new location and verified connection into memory for future tasks.'],
      plan: 'Compare a route from A to F.', revised: 'Revise the route through the new location.', feedback: 'Route feedback is available for the memory update.'
    },
    finance: {
      title: 'An evolving financial relational space', labels: ['Firm A','Firm B','Firm C','Asset D','Asset E','Asset F'], unknown: 'New relation',
      known: 'Known entities and financial dependencies.', memory: 'established entity dependencies', learned: 'new dependency and its observed effects',
      standard: ['Read entity states, events, and relationships as they evolve over time.', 'Connect current financial signals with past entity relationships.', 'Compare analysis priorities using dependencies and uncertainty.', 'Execute an information-gathering plan for the selected entities.', 'Read subsequent signals and compare them with the expected dependencies.', 'Retain useful relational knowledge and refine future analysis from feedback.'],
      changed: ['A previously unseen dependency appears between two entities.', 'Store the new dependency provisionally while preserving prior relational knowledge.', 'Reassess which entities need closer analysis under the changed dependency.', 'Revise the analysis plan to inspect the newly connected entities.', 'Use subsequent signals to assess the new dependency and revise uncertainty.', 'Incorporate the supported dependency into memory for future analysis tasks.'],
      plan: 'Prioritize connected entities for further analysis.', revised: 'Inspect the new dependency before updating the assessment.', feedback: 'Subsequent signals inform the relationship assessment.'
    }
  };
  let scene = 'geo', stage = 0, unknown = false, learned = false, timer = null;
  const points = [[35,60],[130,35],[247,65],[60,160],[165,180],[260,160]];
  const edges = [[0,1],[1,2],[0,3],[1,3],[1,4],[2,5],[3,4],[4,5]];
  const modules = [['perception'],['memory'],['reasoning'],['action'],['perception','memory'],['memory']];
  function pause() { clearInterval(timer); timer = null; demo.classList.remove('playing'); play.textContent = stage === 5 ? 'Replay cycle' : 'Play cycle'; play.setAttribute('aria-pressed','false'); }
  function render() {
    const s = scenes[scene];
    demo.dataset.scene = scene; demo.dataset.stage = String(stage);
    byId('environment-title').textContent = s.title;
    const event = unknown || learned;
    let svg = '<path d="M10 110H290M100 15V215M200 15V215" stroke="#e1e6ed" stroke-dasharray="3 6" fill="none"/>';
    edges.forEach(([a,b]) => { svg += `<path class="world-edge" d="M${points[a]} L${points[b]}"/>`; });
    if (event) svg += scene === 'geo' ? `<path class="event-edge" d="M130 35L150 105L260 160"/><circle cx="150" cy="105" r="12" class="${learned?'learned-node':'event-node'}"/><text x="150" y="132" text-anchor="middle">${learned?'Learned location':'Unknown location'}</text>` : `<path class="event-edge" d="M35 60 Q150 140 260 160"/><text x="150" y="108" text-anchor="middle">${learned?'Learned dependency':'Unknown dependency'}</text>`;
    points.forEach(([x,y],i) => { svg += `<circle class="world-node" cx="${x}" cy="${y}" r="${scene==='geo'?8:12}"/><text x="${x}" y="${y-18}" text-anchor="middle">${s.labels[i]}</text>`; });
    const target = stage >= 4 ? points[5] : stage === 3 ? (event ? [150,105] : points[4]) : points[0];
    if (stage >= 2) svg += `<path class="active-route" d="${scene==='finance'&&event?'M35 60 Q150 140 260 160':event?'M35 60L130 35L150 105L260 160':'M35 60L60 160L165 180L260 160'}"/>`;
    const animate = demo.classList.contains('playing') && !reducedMotion.matches && (stage === 3 || stage === 4);
    const motionPath = stage === 3 ? (event ? 'M35 60L130 35L150 105' : 'M35 60L60 160L165 180') : (event ? 'M150 105L260 160' : 'M165 180L260 160');
    svg += animate ? `<circle class="agent-dot" cx="0" cy="0" r="7"><animateMotion dur="1.2s" fill="freeze" path="${motionPath}"/></circle>` : `<circle class="agent-dot" cx="${target[0]}" cy="${target[1]}" r="7"/>`;
    byId('agent-world').innerHTML = svg;
    byId('agent-world').setAttribute('aria-label', s.title + '. ' + (event ? (learned?'New knowledge retained.':'Unknown change introduced.') : s.known));
    byId('environment-state').textContent = unknown ? 'Unknown change detected · knowledge is provisional.' : learned ? 'New knowledge retained · ready for the next task.' : s.known;
    byId('memory-state').textContent = 'Memory: ' + (learned ? s.memory + ' + ' + s.learned : unknown && stage >= 1 ? s.memory + ' + provisional observation' : s.memory) + '.';
    demo.querySelectorAll('[data-module]').forEach(el => el.classList.toggle('active',modules[stage].includes(el.dataset.module)));
    demo.querySelectorAll('.agent-timeline li').forEach((el,i) => { if(i===stage)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current'); });
    byId('agent-step-count').textContent = '0' + (stage+1) + ' / 06';
    byId('agent-step-title').textContent = names[stage];
    byId('agent-step-description').textContent = (event?s.changed:s.standard)[stage];
    byId('plan-title').textContent = event && stage >= 2 ? 'A revised plan' : 'A plan grounded in memory';
    byId('plan-description').textContent = stage < 2 ? 'Gather observations and update memory before choosing a plan.' : event ? s.revised : s.plan;
    byId('feedback-message').textContent = stage === 5 ? (learned?'New knowledge retained; earlier knowledge remains available.':'Feedback informs the next learning cycle.') : stage === 4 ? s.feedback : 'Environmental feedback closes the learning loop.';
    const labels = scene==='geo'?['Start','Route','Goal']:['Signals','Analysis','Feedback'];
    byId('agent-plan').innerHTML = `<path class="${stage>=3?'active-route':'world-edge'}" d="M32 55L130 ${event&&stage>=2?25:55}L228 55"/>` + [32,130,228].map((x,i)=>`<circle class="${event&&stage>=2&&i===1?'event-node':'world-node'}" cx="${x}" cy="${event&&stage>=2&&i===1?25:55}" r="9"/><text x="${x}" y="90" text-anchor="middle">${labels[i]}</text>`).join('');
    change.disabled = unknown;
    change.textContent = unknown ? 'Change introduced' : 'Introduce change';
    if (!demo.classList.contains('playing')) play.textContent = stage===5?'Replay cycle':'Play cycle';
  }
  function advance() { if(stage===5){stage=0;}else{stage++;if(stage===5){if(unknown){unknown=false;learned=true;}pause();}}render(); }
  play.addEventListener('click',()=>{ if(timer){pause();return;}if(stage===5)stage=0;demo.classList.add('playing');play.textContent='Pause';play.setAttribute('aria-pressed','true');render();timer=setInterval(advance,4000); });
  byId('agent-next').addEventListener('click',()=>{pause();advance();});
  change.addEventListener('click',()=>{pause();stage=0;unknown=true;learned=false;render();});
  function reset() { pause();stage=0;unknown=false;learned=false;render(); }
  byId('agent-reset').addEventListener('click',reset);
  demo.querySelectorAll('.scene-switch button').forEach(button=>button.addEventListener('click',()=>{scene=button.dataset.scene;demo.querySelectorAll('.scene-switch button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));reset();}));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  if ('IntersectionObserver' in window) new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)pause();},{threshold:0}).observe(demo);
  reducedMotion.addEventListener('change',()=>{pause();render();});
  render();
})();

