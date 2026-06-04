/* 雾水 · 水墨主题 交互 —— 原生 JS，无依赖。全部动效走 transform/opacity */
(function () {
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---- 顶部进度条 + 导航玻璃化 ---- */
  var progress = document.getElementById('progress');
  var header = document.querySelector('.site-header');
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0) + ')';
    if (header) header.classList.toggle('scrolled', h.scrollTop > 8);
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- 滚动错落进场 ---- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(function (el, i) {
      el.style.setProperty('--d', (i % 8) * 70 + 'ms');
      io.observe(el);
    });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- 点击水滴涟漪 ---- */
  document.addEventListener('pointerdown', function (e) {
    if (reduced) return;
    var el = e.target.closest('[data-ripple]');
    if (!el) return;
    var cs = getComputedStyle(el);
    if (cs.position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
    var r = el.getBoundingClientRect();
    var s = Math.max(r.width, r.height);
    var sp = document.createElement('span');
    sp.className = 'ripple';
    sp.style.width = sp.style.height = s + 'px';
    sp.style.left = (e.clientX - r.left - s / 2) + 'px';
    sp.style.top = (e.clientY - r.top - s / 2) + 'px';
    el.appendChild(sp);
    sp.addEventListener('animationend', function () { sp.remove(); });
  });

  /* ---- 桌面光标柔光 ---- */
  var glow = document.querySelector('.cursor-glow');
  if (glow && !reduced && matchMedia('(pointer:fine)').matches) {
    var tx = innerWidth / 2, ty = innerHeight / 2, cx = tx, cy = ty;
    addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      glow.style.transform = 'translate(' + (cx - 110) + 'px,' + (cy - 110) + 'px)';
      requestAnimationFrame(loop);
    })();
  } else if (glow) { glow.style.display = 'none'; }

  /* ---- 暗色切换：从点击点水波扩散 + 持久化 + 同步 giscus ---- */
  function syncGiscus(theme) {
    var f = document.querySelector('iframe.giscus-frame');
    if (!f) return;
    // 复用 comments.html 里 data-theme 的 ?v=... cache-buster，避免 CDN 缓存住老主题
    var script = document.querySelector('script[src*="giscus.app/client.js"]');
    var init = (script && script.dataset.theme) || '';
    var m = init.match(/[?&]v=([^&]+)/);
    var v = m ? '?v=' + m[1] : '';
    var url = 'https://a.minifog.org.cn/assets/giscus-shuimo-' + (theme === 'dark' ? 'dark' : 'light') + '.css' + v;
    f.contentWindow.postMessage({ giscus: { setConfig: { theme: url } } }, 'https://giscus.app');
  }
  function setTheme(next) {
    root.dataset.theme = next;
    try { localStorage.setItem('shuimo-theme', next); } catch (e) {}
    syncGiscus(next);
    document.dispatchEvent(new Event('shuimo:theme'));
  }
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function (e) {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      if (!document.startViewTransition || reduced) { setTheme(next); return; }
      var x = e.clientX, y = e.clientY;
      var rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      var t = document.startViewTransition(function () { setTheme(next); });
      t.ready.then(function () {
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 560, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
        );
      });
    });
  }
  // giscus 加载完成后同步当前主题
  addEventListener('message', function (e) {
    if (e.origin === 'https://giscus.app' && e.data && e.data.giscus) syncGiscus(root.dataset.theme);
  });

  /* ---- 移动端菜单 ---- */
  var menuBtn = document.getElementById('menu-btn');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) menuBtn.addEventListener('click', function () { nav.classList.toggle('open'); });

  /* ---- 代码块复制按钮 ---- */
  document.querySelectorAll('.markdown-body pre').forEach(function (pre) {
    var wrap = pre.closest('[class*="language-"]');
    var lm = wrap && wrap.className.match(/language-([\w+#.-]+)/);
    if (lm && lm[1] === 'mermaid') return; // mermaid 交给图表渲染
    if (pre.querySelector('.code-copy')) return;
    if (lm && lm[1] !== 'plaintext' && !pre.querySelector('.code-lang')) {
      var tag = document.createElement('span'); tag.className = 'code-lang'; tag.textContent = lm[1];
      pre.appendChild(tag);
    }
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'code-copy'; btn.textContent = '复制';
    btn.addEventListener('click', function () {
      var codeEl = pre.querySelector('code');
      var code = codeEl ? codeEl.innerText : pre.innerText;
      var done = function () {
        btn.textContent = '已复制'; btn.classList.add('done');
        setTimeout(function () { btn.textContent = '复制'; btn.classList.remove('done'); }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, function () {});
      else {
        var ta = document.createElement('textarea'); ta.value = code;
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        ta.remove();
      }
    });
    pre.appendChild(btn);
  });

  /* ---- 文章搜索（客户端，懒加载 /search.json） ---- */
  var sBtn = document.getElementById('search-btn');
  var overlay = document.getElementById('search-overlay');
  var sInput = document.getElementById('search-input');
  var sResults = document.getElementById('search-results');
  var sIndex = null, hits = [];
  function loadIndex() {
    if (sIndex) return Promise.resolve(sIndex);
    return fetch('/search.json').then(function (r) { return r.json(); })
      .then(function (d) { sIndex = d; return d; }).catch(function () { sIndex = []; return []; });
  }
  function openSearch() {
    if (!overlay) return;
    overlay.hidden = false; document.body.style.overflow = 'hidden';
    sInput.value = ''; sResults.innerHTML = '';
    requestAnimationFrame(function () { overlay.classList.add('open'); sInput.focus(); });
    loadIndex();
  }
  function closeSearch() {
    if (!overlay) return;
    overlay.classList.remove('open'); document.body.style.overflow = '';
    setTimeout(function () { overlay.hidden = true; }, 250);
  }
  function esc(s) { return (s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snippet(text, q) {
    text = text || '';
    var i = text.toLowerCase().indexOf(q);
    if (i < 0) return esc(text.slice(0, 90));
    var s = Math.max(0, i - 30);
    return (s > 0 ? '…' : '') + esc(text.slice(s, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length, i + q.length + 60)) + '…';
  }
  function runSearch() {
    var q = sInput.value.trim().toLowerCase();
    if (!q) { sResults.innerHTML = ''; hits = []; return; }
    loadIndex().then(function (idx) {
      hits = idx.filter(function (p) { return (p.title + ' ' + p.category + ' ' + p.content).toLowerCase().indexOf(q) >= 0; }).slice(0, 12);
      if (!hits.length) { sResults.innerHTML = '<div class="search-empty">没有找到「' + esc(sInput.value) + '」相关的文章</div>'; return; }
      var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      sResults.innerHTML = hits.map(function (p, i) {
        return '<a class="sr-item' + (i === 0 ? ' active' : '') + '" href="' + p.url + '" data-ripple>' +
          '<div class="sr-title">' + esc(p.title).replace(re, '<mark>$1</mark>') + '</div>' +
          '<div class="sr-meta">' + p.date + (p.category ? ' · ' + esc(p.category) : '') + '</div>' +
          '<div class="sr-snippet">' + snippet(p.content, q) + '</div></a>';
      }).join('');
    });
  }
  if (sBtn) sBtn.addEventListener('click', openSearch);
  if (sInput) {
    sInput.addEventListener('input', runSearch);
    sInput.addEventListener('keydown', function (e) { if (e.key === 'Enter' && hits.length) location.href = hits[0].url; });
  }
  if (overlay) overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSearch(); });
  addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openSearch(); }
    else if (e.key === 'Escape' && overlay && !overlay.hidden) closeSearch();
  });

  /* ---- 双击 Shift 快捷唤起搜索 ---- */
  var lastShift = 0;
  addEventListener('keydown', function (e) {
    if (e.key === 'Shift' && !e.repeat) {
      var ae = document.activeElement;
      var typing = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
      if (typing && (!ae.id || ae.id !== 'search-input')) { lastShift = 0; return; }
      var now = Date.now();
      if (now - lastShift < 400 && overlay && overlay.hidden) { e.preventDefault(); openSearch(); lastShift = 0; }
      else lastShift = now;
    } else if (e.key !== 'Shift') {
      lastShift = 0;
    }
  });

  /* ---- Mermaid 图表（按需懒加载，跟随主题重渲染） ---- */
  (function () {
    var nodes = [], seen = [];
    // 兼容 kramdown+rouge 两种输出结构：<code class="language-mermaid"> 与 <div class="language-mermaid">…<code>
    document.querySelectorAll('div.language-mermaid, pre > code.language-mermaid').forEach(function (el) {
      var codeEl = el.tagName === 'CODE' ? el : el.querySelector('code');
      if (!codeEl) return;
      var outer = el.closest('div.highlighter-rouge') || el.closest('div.language-mermaid') || el.closest('pre') || el;
      if (seen.indexOf(outer) !== -1) return;
      seen.push(outer);
      var div = document.createElement('div');
      div.className = 'mermaid';
      div.setAttribute('data-src', codeEl.textContent);
      outer.replaceWith(div);
      nodes.push(div);
    });
    if (!nodes.length) return;
    var loading = null;
    function load() {
      return loading || (loading = import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs').then(function (m) { return m.default; }));
    }
    function render() {
      load().then(function (mermaid) {
        nodes.forEach(function (el) { el.removeAttribute('data-processed'); el.innerHTML = el.getAttribute('data-src'); });
        var dark = root.dataset.theme === 'dark';
        var font = '-apple-system,"PingFang SC","Microsoft YaHei",system-ui,sans-serif';
        var vars = dark ? {
          background: '#131a1f',
          primaryColor: '#1a2a2f', mainBkg: '#1a2a2f', primaryBorderColor: '#6fb8ab', primaryTextColor: '#e7ebee',
          secondaryColor: '#1c2733', secondaryBorderColor: '#5d82ad', secondaryTextColor: '#e7ebee',
          tertiaryColor: '#141a1f', tertiaryBorderColor: '#2a3a40', tertiaryTextColor: '#e7ebee',
          lineColor: '#6fb8ab', textColor: '#e7ebee', nodeBorder: '#6fb8ab', titleColor: '#e7ebee',
          edgeLabelBackground: '#0e1316', clusterBkg: '#131a1f', clusterBorder: '#2a3a40',
          fontFamily: font, fontSize: '13px'
        } : {
          background: '#ecebe4',
          primaryColor: '#e6f1ee', mainBkg: '#e6f1ee', primaryBorderColor: '#3f8a7e', primaryTextColor: '#1f242a',
          secondaryColor: '#e7eef8', secondaryBorderColor: '#5d82ad', secondaryTextColor: '#1f242a',
          tertiaryColor: '#f4f1e8', tertiaryBorderColor: '#d6cfbe', tertiaryTextColor: '#1f242a',
          lineColor: '#5e8c83', textColor: '#1f242a', nodeBorder: '#3f8a7e', titleColor: '#1f242a',
          edgeLabelBackground: '#f5f4ef', clusterBkg: '#eef0e9', clusterBorder: '#cdd6d3',
          fontFamily: font, fontSize: '13px'
        };
        mermaid.initialize({
          startOnLoad: false, securityLevel: 'loose', theme: 'base', themeVariables: vars,
          flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis', padding: 10, nodeSpacing: 40, rankSpacing: 48 },
          sequence: { useMaxWidth: true }
        });
        mermaid.run({ nodes: nodes });
      }).catch(function () {});
    }
    render();
    document.addEventListener('shuimo:theme', render);
  })();

  /* ---- 分类页：标签筛选 ---- */
  (function () {
    var filter = document.getElementById('cate-filter');
    if (!filter) return;
    var chips = filter.querySelectorAll('.cate-chip');
    var blocks = document.querySelectorAll('.cate-block');
    function apply(cate) {
      chips.forEach(function (c) { c.classList.toggle('active', c.dataset.cate === cate); });
      blocks.forEach(function (b) { b.style.display = (cate === '__all' || b.dataset.cate === cate) ? '' : 'none'; });
    }
    chips.forEach(function (c) { c.addEventListener('click', function () { apply(c.dataset.cate); }); });
    // 从文章页点分类进来（带 #分类 锚点）时，自动只显示该分类
    if (location.hash) {
      var h = decodeURIComponent(location.hash.slice(1));
      if (Array.prototype.some.call(blocks, function (b) { return b.dataset.cate === h; })) apply(h);
    }
  })();

  /* ---- 文章目录 TOC + scroll-spy（宽屏右侧浮动） ---- */
  (function () {
    var body = document.querySelector('article .markdown-body');
    if (!body) return;
    var hs = Array.prototype.slice.call(body.querySelectorAll('h2, h3'));
    if (hs.length < 3) return;
    var nav = document.createElement('nav');
    nav.className = 'toc';
    nav.innerHTML = '<div class="toc-title">目录</div>';
    var links = [];
    hs.forEach(function (h, i) {
      if (!h.id) h.id = 'h-' + i;
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent.replace(/^[§\s]+/, '').trim();
      if (h.tagName === 'H3') a.className = 'lv3';
      nav.appendChild(a);
      links.push({ a: a, h: h });
    });
    document.body.appendChild(nav);
    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) links.forEach(function (l) { l.a.classList.toggle('active', l.h === e.target); });
        });
      }, { rootMargin: '-80px 0px -68% 0px', threshold: 0 });
      hs.forEach(function (h) { spy.observe(h); });
    }
    // 滚动进入正文后才淡入目录，避免与文章头部/导航重叠
    function tocVis() { nav.classList.toggle('show', body.getBoundingClientRect().top < 60); }
    addEventListener('scroll', tocVis, { passive: true });
    tocVis();
  })();
})();
