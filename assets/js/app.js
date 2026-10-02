(() => {
  const prompts = Array.isArray(window.PROMPT_LIBRARY) ? window.PROMPT_LIBRARY : [];
  const grid = document.querySelector('#promptGrid');
  const search = document.querySelector('#promptSearch');
  const count = document.querySelector('#resultsCount');
  const empty = document.querySelector('#emptyState');
  const reset = document.querySelector('#resetSearch');
  const toast = document.querySelector('#toast');
  const toastText = document.querySelector('#toastText');
  const themeToggle = document.querySelector('.theme-toggle');
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('#mainNav');
  const progress = document.querySelector('#readingProgress');
  let activeFilter = 'all';
  let toastTimer;

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);
  const formatPrompt = (value) => escapeHtml(value).replace(/\n/g, '<br>');
  const arabicCount = (value) => `${value} ${value === 1 ? 'برومبت' : 'برومبتًا'}`;

  const cardTemplate = (item, index) => `
    <article class="prompt-card accent-${escapeHtml(item.accent)}" style="--delay:${index * 45}ms">
      <div class="card-top">
        <span class="card-index">${String(item.id).padStart(2, '0')}</span>
        <span class="card-category">${escapeHtml(item.category)}</span>
        <button class="copy-button" type="button" data-copy="${Number(item.id)}" aria-label="نسخ برومبت: ${escapeHtml(item.title)}"><span aria-hidden="true">⧉</span> نسخ</button>
      </div>
      <div class="card-body">
        <p class="card-tone">${escapeHtml(item.tone)}</p>
        <h3>${escapeHtml(item.title)}</h3>
        <p class="card-description">${escapeHtml(item.description)}</p>
        <details>
          <summary>عرض البرومبت <span aria-hidden="true">↘</span></summary>
          <div class="prompt-text">${formatPrompt(item.prompt)}</div>
        </details>
      </div>
    </article>`;

  const getVisible = () => {
    const term = (search?.value || '').trim().toLocaleLowerCase('ar');
    return prompts.filter((item) => {
      const matchesFilter = activeFilter === 'all' || item.category === activeFilter;
      const haystack = `${item.title} ${item.description} ${item.prompt} ${item.category} ${item.tone}`.toLocaleLowerCase('ar');
      return matchesFilter && (!term || haystack.includes(term));
    });
  };

  const updateFilterCounts = () => {
    document.querySelectorAll('.filter-chip').forEach((chip) => {
      const filter = chip.dataset.filter;
      const value = filter === 'all' ? prompts.length : prompts.filter((item) => item.category === filter).length;
      const badge = chip.querySelector('span');
      if (badge) badge.textContent = value;
    });
  };

  const render = () => {
    const visible = getVisible();
    if (grid) grid.innerHTML = visible.map(cardTemplate).join('');
    if (count) count.textContent = arabicCount(visible.length);
    if (empty) empty.hidden = visible.length !== 0;
    if (grid) grid.hidden = visible.length === 0;
  };

  const showToast = (message) => {
    if (!toast || !toastText) return;
    toastText.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  };

  const fallbackCopy = (text) => {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand('copy');
    helper.remove();
    return copied;
  };

  const copyPrompt = async (id, button) => {
    const item = prompts.find((prompt) => prompt.id === id);
    if (!item || !button) return;
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(item.prompt);
        copied = true;
      } else {
        copied = fallbackCopy(item.prompt);
      }
    } catch {
      copied = fallbackCopy(item.prompt);
    }
    if (!copied) {
      showToast('افتح نص البرومبت وانسخه يدويًا');
      return;
    }
    button.classList.add('is-copied');
    button.innerHTML = '<span aria-hidden="true">✓</span> تم النسخ';
    showToast('تم نسخ البرومبت إلى الحافظة');
    window.setTimeout(() => {
      button.classList.remove('is-copied');
      button.innerHTML = '<span aria-hidden="true">⧉</span> نسخ';
    }, 2200);
  };

  document.querySelectorAll('.filter-chip').forEach((chip) => chip.addEventListener('click', () => {
    activeFilter = chip.dataset.filter || 'all';
    document.querySelectorAll('.filter-chip').forEach((item) => {
      const selected = item === chip;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    render();
  }));

  search?.addEventListener('input', render);
  reset?.addEventListener('click', () => {
    if (search) search.value = '';
    document.querySelector('[data-filter="all"]')?.click();
    search?.focus();
  });

  grid?.addEventListener('click', (event) => {
    const button = event.target.closest('.copy-button');
    if (button) copyPrompt(Number(button.dataset.copy), button);
  });

  const syncThemeButton = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    themeToggle?.setAttribute('aria-pressed', String(dark));
    if (themeToggle) {
      const label = themeToggle.querySelector('.theme-label');
      if (label) label.textContent = dark ? 'الوضع الفاتح' : 'الوضع الداكن';
      themeToggle.setAttribute('aria-label', dark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن');
    }
  };

  themeToggle?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('prompt-pulse-theme', next); } catch { /* التخزين غير متاح في بعض البيئات */ }
    syncThemeButton();
  });

  const closeMenu = () => {
    mainNav?.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'فتح القائمة');
  };
  menuToggle?.addEventListener('click', () => {
    const open = !mainNav?.classList.contains('is-open');
    mainNav?.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
  });
  mainNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (event) => {
    const tag = document.activeElement?.tagName;
    if (event.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      search?.focus();
    }
    if (event.key === 'Escape') closeMenu();
  });

  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0}%`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });

  const year = document.querySelector('#currentYear');
  if (year) year.textContent = new Date().getFullYear();
  updateFilterCounts();
  syncThemeButton();
  render();
  updateProgress();
})();
