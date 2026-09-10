    const LOGIN_EMAIL = 'email@email.com';
    const LOGIN_PASSWORD = 'Test123!';
    const $ = (s, root=document) => root.querySelector(s);
    const $$ = (s, root=document) => [...root.querySelectorAll(s)];
    const store = {
      get(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } },
      set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
    };

    let selectedFiles = [];
    let receipts = store.get('smdi_receipts', []);
    let repairs = store.get('smdi_repairs', [
      {issue:'Replace water heater', property:'Valley Creek House', priority:'Urgent', vendor:'Owner + plumber', due:'2026-09-11', status:'Open'},
      {issue:'Bedroom window seal', property:'Mountain View Cabin', priority:'Normal', vendor:'Owner', due:'2026-09-18', status:'Open'},
      {issue:'Kitchen cabinet hardware', property:'Downtown Rental', priority:'Normal', vendor:'Owner', due:'2026-09-14', status:'Scheduled'}
    ]);
    let tasks = store.get('smdi_tasks', [
      {title:'Confirm countertop measurement', property:'Downtown Rental', due:'2026-09-12', done:false},
      {title:'Send August management statement to bookkeeper', property:'General business', due:'2026-09-13', done:false},
      {title:'Schedule fall HVAC service', property:'Mountain View Cabin', due:'2026-09-22', done:false}
    ]);
    let properties = store.get('smdi_properties', [
      {name:'Mountain View Cabin', address:'Andrews, NC', status:'Rented', rent:1850, repairs:1, project:'None'},
      {name:'Valley Creek House', address:'Murphy, NC', status:'Rented', rent:1650, repairs:1, project:'None'},
      {name:'Downtown Rental', address:'Andrews, NC', status:'Remodel', rent:0, repairs:1, project:'62%'}
    ]);

    function toast(msg) {
      const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
      clearTimeout(window.__toast); window.__toast = setTimeout(() => t.classList.add('hidden'), 3200);
    }
    function formatDate(v) { if (!v) return '—'; const d = new Date(v + 'T12:00:00'); return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}); }
    function formatMoney(v) { if (v === '' || v == null) return '—'; return Number(v).toLocaleString(undefined,{style:'currency',currency:'USD'}); }
    function escapeHtml(s='') { return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

    function showApp() {
      $('#loginScreen').classList.add('hidden'); $('#appShell').classList.remove('hidden');
      $('#todayText').textContent = new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
      $('#receiptDate').value ||= new Date().toISOString().slice(0,10);
      const bk = localStorage.getItem('smdi_bookkeeper') || '';
      $('#bookkeeperEmail').value = bk; $('#settingsBookkeeper').value = bk;
      $('#deliveryEndpoint').value = localStorage.getItem('smdi_endpoint') || '';
      renderAll();
    }
    if (sessionStorage.getItem('smdi_auth') === '1') showApp();

    $('#loginForm').addEventListener('submit', e => {
      e.preventDefault();
      if ($('#loginEmail').value.trim().toLowerCase() === LOGIN_EMAIL && $('#loginPassword').value === LOGIN_PASSWORD) {
        sessionStorage.setItem('smdi_auth','1'); $('#loginError').classList.add('hidden'); showApp();
      } else $('#loginError').classList.remove('hidden');
    });
    $('#togglePassword').addEventListener('click', () => {
      const p = $('#loginPassword'); p.type = p.type === 'password' ? 'text' : 'password'; $('#togglePassword').textContent = p.type === 'password' ? 'Show' : 'Hide';
    });
    function signOut() {
      sessionStorage.removeItem('smdi_auth');
      $('#appShell').classList.add('hidden');
      $('#loginScreen').classList.remove('hidden');
      $('#loginForm').reset();
      $('#loginError').classList.add('hidden');
      $('#togglePassword').textContent = 'Show';
      $('#loginPassword').type = 'password';
      goPage('dashboard');
      $('#loginEmail').focus();
    }
    $('#logoutBtn').addEventListener('click', signOut);

    const titles = {dashboard:'Welcome Joe',bookkeeping:'Bookkeeping',properties:'Properties',repairs:'Repairs',remodels:'Remodels',tasks:'Tasks',reports:'Reports',settings:'Settings'};
    function goPage(page) {
      $$('.page').forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
      $$('[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
      $('#topbarTitle').textContent = titles[page] || 'Dashboard'; window.scrollTo({top:0,behavior:'smooth'});
    }
    $$('[data-page]').forEach(b => b.addEventListener('click', () => goPage(b.dataset.page)));
    $$('[data-page-jump]').forEach(b => b.addEventListener('click', () => goPage(b.dataset.pageJump)));

    function jumpToReceipt() { goPage('dashboard'); setTimeout(() => $('#receiptCard').scrollIntoView({behavior:'smooth',block:'start'}),30); }
    $('#topReceiptBtn').addEventListener('click', jumpToReceipt); $('#quickReceipt').addEventListener('click', jumpToReceipt); $('#bookkeepingReceiptBtn').addEventListener('click', jumpToReceipt);

    function openModal(id) { $('#' + id)?.classList.remove('hidden'); }
    function closeModal(id) { $('#' + id)?.classList.add('hidden'); }
    $$('[data-open-modal]').forEach(b => b.addEventListener('click', () => openModal(b.dataset.openModal)));
    $$('[data-close-modal]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.closeModal)));
    $$('.modal-backdrop').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); }));

    const dz = $('#dropzone'), fi = $('#fileInput');
    dz.addEventListener('click', () => fi.click()); dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fi.click(); });
    ['dragenter','dragover'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.add('dragging'); }));
    ['dragleave','drop'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.remove('dragging'); }));
    dz.addEventListener('drop', e => addFiles(e.dataTransfer.files)); fi.addEventListener('change', e => addFiles(e.target.files));
    function addFiles(files) { selectedFiles.push(...files); renderFiles(); fi.value = ''; }
    function renderFiles() {
      $('#fileList').innerHTML = selectedFiles.map((f,i) => `<div class="file-item"><div class="file-meta"><div class="file-name">${escapeHtml(f.name)}</div><div class="file-size">${(f.size/1024/1024).toFixed(2)} MB</div></div><button class="file-remove" type="button" data-rmfile="${i}">×</button></div>`).join('');
      $$('[data-rmfile]').forEach(b => b.addEventListener('click', () => { selectedFiles.splice(+b.dataset.rmfile,1); renderFiles(); }));
    }

    function receiptPayload(status) {
      return {
        id: Date.now(), date: $('#receiptDate').value, property: $('#receiptProperty').value, category: $('#receiptCategory').value,
        amount: $('#receiptAmount').value, note: $('#receiptNote').value.trim(), email: $('#bookkeeperEmail').value.trim(),
        files: selectedFiles.map(f => ({name:f.name,size:f.size,type:f.type})), status
      };
    }
    $('#saveDraftBtn').addEventListener('click', () => {
      const p = receiptPayload('Draft'); if (!p.property || !p.category || !p.date) return toast('Choose a property, category, and date first.');
      receipts.unshift(p); store.set('smdi_receipts',receipts); renderAll(); toast('Receipt draft saved.'); resetReceipt(false);
    });
    $('#receiptForm').addEventListener('submit', async e => {
      e.preventDefault();
      if (!selectedFiles.length) return toast('Add at least one receipt file.');
      const endpoint = localStorage.getItem('smdi_endpoint') || '';
      let status = endpoint ? 'Sending…' : 'Demo sent';
      const p = receiptPayload(status); receipts.unshift(p); store.set('smdi_receipts',receipts); renderAll();
      if (endpoint) {
        try {
          const fd = new FormData();
          fd.append('property',p.property); fd.append('category',p.category); fd.append('date',p.date); fd.append('amount',p.amount); fd.append('note',p.note); fd.append('to',p.email);
          selectedFiles.forEach(file => fd.append('receipts', file, file.name));
          const res = await fetch(endpoint,{method:'POST',body:fd});
          if (!res.ok) throw new Error('Delivery failed');
          receipts[0].status='Sent'; toast('Receipt package sent to the bookkeeper.');
        } catch(err) { receipts[0].status='Delivery failed'; toast('Email delivery failed. The package remains in the bookkeeping log.'); }
        store.set('smdi_receipts',receipts); renderAll();
      } else toast('Demo mode: receipt package recorded as sent. Add a delivery endpoint in Settings for live email.');
      resetReceipt(true);
    });
    function resetReceipt(keepEmail=true) {
      const email = $('#bookkeeperEmail').value; $('#receiptForm').reset(); selectedFiles=[]; renderFiles(); $('#receiptDate').value = new Date().toISOString().slice(0,10); if (keepEmail) $('#bookkeeperEmail').value=email;
    }

    $('#repairForm').addEventListener('submit', e => {
      e.preventDefault(); repairs.unshift({issue:$('#repairIssue').value.trim(),property:$('#repairProperty').value,priority:$('#repairPriority').value,vendor:$('#repairVendor').value.trim() || 'Owner',due:$('#repairDue').value,status:'Open'});
      store.set('smdi_repairs',repairs); renderAll(); e.target.reset(); closeModal('repairModal'); toast('Repair added.');
    });
    $('#taskForm').addEventListener('submit', e => {
      e.preventDefault(); tasks.unshift({title:$('#taskTitle').value.trim(),property:$('#taskProperty').value,due:$('#taskDue').value,done:false}); store.set('smdi_tasks',tasks); renderAll(); e.target.reset(); closeModal('taskModal'); toast('Task added.');
    });
    $('#propertyForm').addEventListener('submit', e => {
      e.preventDefault(); properties.push({name:$('#newPropertyName').value.trim(),address:$('#newPropertyAddress').value.trim(),status:$('#newPropertyStatus').value,rent:+$('#newPropertyRent').value || 0,repairs:0,project:'None'}); store.set('smdi_properties',properties); renderAll(); e.target.reset(); closeModal('propertyModal'); toast('Property added.');
    });

    $('#saveSettings').addEventListener('click', () => { const v=$('#settingsBookkeeper').value.trim(); localStorage.setItem('smdi_bookkeeper',v); $('#bookkeeperEmail').value=v; toast('Bookkeeper settings saved.'); });
    $('#saveEndpoint').addEventListener('click', () => { localStorage.setItem('smdi_endpoint',$('#deliveryEndpoint').value.trim()); toast('Delivery endpoint saved.'); });

    $('#exportReceipts').addEventListener('click', () => {
      const header=['Date','Property','Category','Amount','Files','Status','Bookkeeper','Note'];
      const rows=receipts.map(r=>[r.date,r.property,r.category,r.amount,(r.files||[]).map(f=>f.name).join('; '),r.status,r.email,r.note]);
      const csv=[header,...rows].map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n');
      const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='smoky-mountains-dreams-receipts.csv'; a.click(); URL.revokeObjectURL(a.href);
    });

    function renderAll() { renderReceipts(); renderRepairs(); renderTasks(); renderProperties(); renderActivity(); }
    function renderReceipts() {
      $('#receiptCount').textContent = receipts.filter(r => r.status !== 'Draft').length;
      const body=$('#receiptHistoryBody'), empty=$('#receiptEmpty');
      body.innerHTML=receipts.map(r=>`<tr><td>${formatDate(r.date)}</td><td><strong>${escapeHtml(r.property)}</strong></td><td>${escapeHtml(r.category)}</td><td>${formatMoney(r.amount)}</td><td>${(r.files||[]).length}</td><td><span class="status ${r.status==='Sent'||r.status==='Demo sent'?'done':r.status==='Draft'?'scheduled':'open'}">${escapeHtml(r.status)}</span></td></tr>`).join('');
      empty.classList.toggle('hidden', receipts.length>0);
    }
    function renderRepairs() {
      $('#openRepairCount').textContent=repairs.filter(r=>r.status!=='Done').length;
      $('#repairTableBody').innerHTML=repairs.map((r,i)=>`<tr><td><strong>${escapeHtml(r.issue)}</strong></td><td>${escapeHtml(r.property)}</td><td>${escapeHtml(r.priority)}</td><td>${escapeHtml(r.vendor)}</td><td>${formatDate(r.due)}</td><td><button class="status ${r.status==='Done'?'done':r.status==='Scheduled'?'scheduled':'open'}" style="border:0" data-repair-toggle="${i}">${escapeHtml(r.status)}</button></td></tr>`).join('');
      $$('[data-repair-toggle]').forEach(b=>b.addEventListener('click',()=>{ const r=repairs[+b.dataset.repairToggle]; r.status=r.status==='Done'?'Open':'Done'; store.set('smdi_repairs',repairs); renderAll(); }));
    }
    function renderTasks() {
      $('#taskList').innerHTML=tasks.map((t,i)=>`<div class="list-row"><button data-task-toggle="${i}" style="width:28px;height:28px;border-radius:9px;border:1px solid var(--line);background:${t.done?'var(--brand)':'white'};color:white">${t.done?'✓':''}</button><div class="row-main"><div class="row-title" style="${t.done?'text-decoration:line-through;color:#829089':''}">${escapeHtml(t.title)}</div><div class="row-sub">${escapeHtml(t.property)} · Due ${formatDate(t.due)}</div></div></div>`).join('') || '<div class="empty-state">No tasks.</div>';
      $$('[data-task-toggle]').forEach(b=>b.addEventListener('click',()=>{tasks[+b.dataset.taskToggle].done=!tasks[+b.dataset.taskToggle].done;store.set('smdi_tasks',tasks);renderTasks();}));
    }
    function renderProperties() {
      $('#propertyGrid').innerHTML=properties.map(p=>`<article class="panel property-card"><div class="property-art"></div><div class="panel-body"><div class="property-title">${escapeHtml(p.name)}</div><div class="property-meta">${escapeHtml(p.address)} · ${escapeHtml(p.status)}</div><div class="property-kpis"><div class="mini-kpi"><strong>${p.rent?formatMoney(p.rent):'—'}</strong><span>Monthly rent</span></div><div class="mini-kpi"><strong>${p.repairs}</strong><span>Open repairs</span></div><div class="mini-kpi"><strong>${escapeHtml(p.project)}</strong><span>Remodel</span></div></div></div></article>`).join('');
    }
    function renderActivity() {
      const recentRepair=repairs[0]; const recentReceipt=receipts[0];
      const items=[
        recentRepair ? {icon:'⌁',title:recentRepair.issue,sub:`${recentRepair.property} · Repair`,right:recentRepair.status, cls:recentRepair.status==='Done'?'done':'open'} : null,
        recentReceipt ? {icon:'▣',title:`Receipt package · ${recentReceipt.category}`,sub:`${recentReceipt.property} · ${(recentReceipt.files||[]).length} file(s)`,right:recentReceipt.status,cls:recentReceipt.status==='Draft'?'scheduled':'done'} : {icon:'▣',title:'No receipt packages yet',sub:'Use the receipt workflow above to start.',right:'',cls:''},
        {icon:'◇',title:'Downtown Rental remodel',sub:'Next milestone: kitchen counters',right:'62%',cls:'scheduled'}
      ].filter(Boolean);
      $('#activityList').innerHTML=items.map(i=>`<div class="list-row"><div class="row-icon">${i.icon}</div><div class="row-main"><div class="row-title">${escapeHtml(i.title)}</div><div class="row-sub">${escapeHtml(i.sub)}</div></div><div class="row-right">${i.right?`<span class="status ${i.cls}">${escapeHtml(i.right)}</span>`:''}</div></div>`).join('');
    }
