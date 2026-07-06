/** 学习中心：外链资料库 */
const Learn = {
  resources: [],

  async loadLibrary(container, searchInput) {
    const data = await API.request('/api/student/resources', { headers: API.studentAuth() });
    Learn.resources = data.resources || [];
    const hot100 = data.hot100Count || 100;

    const render = (filter) => {
      const q = (filter || '').trim().toLowerCase();
      const list = Learn.resources.filter(r =>
        !q || r.name.toLowerCase().includes(q) || (r.desc || '').toLowerCase().includes(q)
      );
      const rows = list.map(r => `
        <tr>
          <td class="res-name">${escapeHtml(r.name)}</td>
          <td class="res-link"><a href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.url)}</a></td>
          <td class="res-desc">${escapeHtml(r.desc || '')}</td>
        </tr>
      `).join('');

      container.innerHTML = `
        <section class="res-section">
          <h2>小林 coding 系列</h2>
          <p class="res-hint">八股与系统设计请在小林 coding 专题页学习；算法题在力扣 Hot 100 完成（课表已排满 ${hot100} 题）。</p>
          <div class="res-table-wrap">
            <table class="res-table">
              <thead><tr><th>资源</th><th>链接</th><th>说明</th></tr></thead>
              <tbody>${rows || '<tr><td colspan="3" style="color:var(--muted)">没有匹配的资料</td></tr>'}</tbody>
            </table>
          </div>
        </section>
        <section class="res-section res-hot100">
          <h2>算法 · LeetCode Hot 100</h2>
          <p class="res-hint">学习计划每日 5 题，21 天内覆盖全部 Hot 100。点击日历任务可直接跳转对应题目。</p>
          <a class="res-hot100-btn" href="https://leetcode.cn/studyplan/top-100-liked/" target="_blank" rel="noopener">
            打开 Hot 100 题单 →
          </a>
        </section>
      `;
    };

    render('');
    if (searchInput) searchInput.oninput = () => render(searchInput.value);
  }
};

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
