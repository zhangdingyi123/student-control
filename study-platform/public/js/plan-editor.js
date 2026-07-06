/** 小班辅导 · 学习计划编辑器 */
const PlanEditor = {
  renderDay(day, di, tags, libraryItems, startDate, collapsed, defaultTag) {
    const dateStr = startDate ? PlanEditor.dayDateLabel(startDate, di) : '';
    const itemRows = day.items.map((item, ii) =>
      PlanEditor.renderItem(item, di, ii, tags, libraryItems, defaultTag)
    ).join('');

    return `
      <div class="editor-day ${collapsed ? 'collapsed' : ''}" data-day-idx="${di}">
        <div class="editor-day-head" data-action="toggle-collapse" data-di="${di}">
          <span class="day-num">D${di + 1}</span>
          ${dateStr ? `<span class="day-date">${dateStr}</span>` : ''}
          <input type="text" value="${escapeAttr(day.title)}" data-field="day-title" data-di="${di}"
            onclick="event.stopPropagation()">
          <div class="day-actions" onclick="event.stopPropagation()">
            <button type="button" class="btn btn-sm btn-icon" data-action="day-dup" data-di="${di}" title="复制这天">⧉</button>
            <button type="button" class="btn btn-sm btn-icon" data-action="day-up" data-di="${di}" title="上移">↑</button>
            <button type="button" class="btn btn-sm btn-icon" data-action="day-down" data-di="${di}" title="下移">↓</button>
            <button type="button" class="btn btn-sm btn-icon" data-action="day-del" data-di="${di}" title="删除">×</button>
          </div>
        </div>
        <div class="editor-day-body">
          ${itemRows || '<p style="font-size:12px;color:var(--muted);margin:4px 0">暂无任务，从右侧任务库添加或点击下方</p>'}
          <button type="button" class="btn btn-sm" data-action="item-add" data-di="${di}">+ 添加任务</button>
        </div>
      </div>`;
  },

  renderItem(item, di, ii, tags, libraryItems, defaultTag) {
    const refOpts = [
      '<option value="">— 资料 —</option>',
      ...(libraryItems || []).map(v =>
        `<option value="${escapeAttr(v.id)}" ${item.ref === v.id ? 'selected' : ''}>${escapeHtml(v.short || v.name)}</option>`
      )
    ].join('');
    const tag = item.tag || defaultTag || '学习';
    return `
      <div class="editor-item" data-di="${di}" data-ii="${ii}">
        <input type="text" value="${escapeAttr(item.text)}" placeholder="任务内容" data-field="item-text">
        <select data-field="item-tag">${tags.map(t =>
          `<option value="${t}" ${tag === t ? 'selected' : ''}>${t}</option>`
        ).join('')}</select>
        <select class="ref-select" data-field="item-ref" title="关联资料">${refOpts}</select>
        <input type="url" class="link-input" value="${escapeAttr(item.link || '')}" placeholder="外链（可选）" data-field="item-link" title="视频/文档/任意链接">
        <button type="button" class="btn btn-sm btn-icon" data-action="item-del">×</button>
      </div>`;
  },

  dayDateLabel(startDateStr, dayIndex) {
    const d = new Date(startDateStr + 'T12:00:00');
    d.setDate(d.getDate() + dayIndex);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return `${m}/${day} 周${wk}`;
  },

  weekIndex(di) { return Math.floor(di / 7); },

  bindDayEvents(container, draft, rerender, onDirty, libraryItems) {
    const markDirty = () => { if (onDirty) onDirty(); };

    container.querySelectorAll('[data-field="day-title"]').forEach(el => {
      el.oninput = () => { draft.days[+el.dataset.di].title = el.value; markDirty(); };
    });
    container.querySelectorAll('.editor-item').forEach(row => {
      const di = +row.dataset.di;
      const ii = +row.dataset.ii;
      row.querySelector('[data-field="item-text"]').oninput = e => {
        draft.days[di].items[ii].text = e.target.value;
        markDirty();
      };
      row.querySelector('[data-field="item-tag"]').onchange = e => {
        draft.days[di].items[ii].tag = e.target.value;
        markDirty();
      };
      const refEl = row.querySelector('[data-field="item-ref"]');
      if (refEl) {
        refEl.onchange = e => {
          draft.days[di].items[ii].ref = e.target.value;
          const lib = (libraryItems || []).find(v => v.id === e.target.value);
          if (lib) draft.days[di].items[ii].libraryId = lib.libraryId || '';
          markDirty();
        };
      }
      const linkEl = row.querySelector('[data-field="item-link"]');
      if (linkEl) {
        linkEl.oninput = e => {
          draft.days[di].items[ii].link = e.target.value.trim();
          markDirty();
        };
      }
    });
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.onclick = e => {
        if (btn.dataset.action === 'toggle-collapse') return;
        e.stopPropagation();
        const action = btn.dataset.action;
        const di = +btn.dataset.di;
        if (action === 'day-up' && di > 0) {
          [draft.days[di - 1], draft.days[di]] = [draft.days[di], draft.days[di - 1]];
          rerender();
        } else if (action === 'day-down' && di < draft.days.length - 1) {
          [draft.days[di], draft.days[di + 1]] = [draft.days[di + 1], draft.days[di]];
          rerender();
        } else if (action === 'day-del') {
          if (confirm('删除这一天及全部任务？')) { draft.days.splice(di, 1); rerender(); }
        } else if (action === 'day-dup') {
          const copy = JSON.parse(JSON.stringify(draft.days[di]));
          const n = draft.days.length + 1;
          copy.id = 'd' + n;
          copy.title = copy.title.replace(/^D\d+/, 'D' + n) || `D${n} · 复制`;
          copy.items = copy.items.map((it, j) => ({ ...it, id: `d${n}-${j + 1}` }));
          draft.days.splice(di + 1, 0, copy);
          rerender();
        } else if (action === 'item-add') {
          const day = draft.days[di];
          const id = `${day.id}-${day.items.length + 1}`;
          day.items.push({ id, text: '', tag: '学习', ref: '', link: '', libraryId: '' });
          rerender();
        } else if (action === 'item-del') {
          const row = btn.closest('.editor-item');
          draft.days[+row.dataset.di].items.splice(+row.dataset.ii, 1);
          rerender();
        }
        markDirty();
      };
    });
    container.querySelectorAll('[data-action="toggle-collapse"]').forEach(head => {
      head.onclick = () => {
        head.closest('.editor-day').classList.toggle('collapsed');
      };
    });
  },

  addPresetToDay(draft, dayIndex, preset) {
    const day = draft.days[dayIndex];
    if (!day) return;
    preset.tasks.forEach(t => {
      const id = `${day.id}-${day.items.length + 1}`;
      day.items.push({
        id,
        text: t.text,
        tag: t.tag,
        ref: preset.ref || ''
      });
    });
  },

  renderTagStats(days, tags) {
    const stats = {};
    tags.forEach(t => { stats[t] = 0; });
    days.forEach(d => d.items.forEach(i => { stats[i.tag] = (stats[i.tag] || 0) + 1; }));
    return Object.entries(stats)
      .filter(([, n]) => n > 0)
      .map(([t, n]) => `<span class="tag-stat">${t}<b>${n}</b></span>`)
      .join('');
  },

  renderMiniCalendar(startDateStr, totalDays) {
    if (!startDateStr || !totalDays) {
      return '<p style="font-size:12px;color:var(--muted)">设置开课日期后显示预览</p>';
    }
    const start = new Date(startDateStr + 'T12:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + totalDays - 1);
    const viewStart = new Date(start);
    viewStart.setDate(1);
    if (viewStart > start) viewStart.setMonth(viewStart.getMonth() - 1);

    let y = viewStart.getFullYear();
    let m = viewStart.getMonth();
    const lastMonth = end.getMonth();
    const lastYear = end.getFullYear();

    let html = '';
    while (y < lastYear || (y === lastYear && m <= lastMonth)) {
      html += `<div style="font-size:11px;font-weight:600;margin:8px 0 4px">${y}年${m + 1}月</div>`;
      html += '<div class="mini-cal-grid">';
      ['一', '二', '三', '四', '五', '六', '日'].forEach(w => { html += `<div class="hd">${w}</div>`; });
      const first = new Date(y, m, 1);
      let pad = first.getDay() - 1;
      if (pad < 0) pad = 6;
      for (let i = 0; i < pad; i++) html += '<div></div>';
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const cur = new Date(y, m, d);
        const diff = Math.floor((cur - start) / 86400000);
        const inPlan = diff >= 0 && diff < totalDays;
        const cls = inPlan ? 'mini-cal-cell has-plan' : 'mini-cal-cell';
        html += `<div class="${cls}"><span>${d}</span>${inPlan ? `<span class="d-label">D${diff + 1}</span>` : ''}</div>`;
      }
      html += '</div>';
      m++;
      if (m > 11) { m = 0; y++; }
    }
    return html;
  }
};

function escapeAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
