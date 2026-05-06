/* ═══════════════════════════════════════════
   DEVOPSTRIO — Main JavaScript
   Dynamic Repo Loader + UI Engine
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    /* ── 1. HEADER SCROLL EFFECT ── */
    const header = document.getElementById('site-header');
    const onScroll = () => {
        header.classList.toggle('header-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ── 2. SMOOTH SCROLL ── */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* ── 3. COUNTER ANIMATION ── */
    function animateCounter(el, target) {
        const duration = 1800;
        const start = performance.now();
        const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        function step(now) {
            const elapsed = Math.min((now - start) / duration, 1);
            el.textContent = Math.round(ease(elapsed) * target);
            if (elapsed < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    /* ── 4. SCROLL REVEAL + COUNTER TRIGGER ── */
    const countersTriggered = new Set();

    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    const counterObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                if (!countersTriggered.has(el)) {
                    countersTriggered.add(el);
                    animateCounter(el, parseInt(el.dataset.target, 10));
                    counterObserver.unobserve(el);
                }
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

    /* ══════════════════════════════════════════════
       ── 9. DYNAMIC REPO LOADER (GitHub API) ──
       Auto-loads repos from GitHub on every page visit.
       The site auto-updates when new repos are pushed.
    ══════════════════════════════════════════════ */

    const GITHUB_ORG = 'Devopstrio';
    // Token placeholder — replaced during deployment via GitHub Actions secret injection.
    // When not injected (local dev), falls back to unauthenticated API (60 req/hr limit).
    const GITHUB_TOKEN = '%%GITHUB_TOKEN%%';

    // Category icon map — each category gets a unique SVG for visual richness
    const CATEGORY_ICONS = {
        'landing-zone': `<path d="M2.25 12L12 2.25l9.75 9.75M4.5 10.5V21h6v-6h3v6h6V10.5"/>`,
        'ai': `<path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>`,
        'security': `<path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
        'devops': `<path d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"/>`,
        'vdi': `<rect width="18" height="12" x="3" y="4" rx="2"/><line x1="2" x2="22" y1="20" y2="20"/><line x1="12" x2="12" y1="16" y2="20"/>`,
        'industry': `<path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>`,
        'data': `<path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>`,
    };

    async function fetchGitHubRepos() {
        const repoGrid = document.getElementById('repo-grid');
        if (!repoGrid) return;

        // Show premium loading state
        repoGrid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
                <div style="display:inline-flex; align-items:center; gap:12px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px 28px;">
                    <span class="status-dot" style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ce2453; animation:pulse 1.4s ease-in-out infinite;"></span>
                    <span style="color:#aaa; font-size:0.95rem;">Syncing live accelerators from GitHub...</span>
                </div>
            </div>`;

        const isAuthenticated = GITHUB_TOKEN && !GITHUB_TOKEN.startsWith('%%');
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (isAuthenticated) headers['Authorization'] = `token ${GITHUB_TOKEN}`;

        try {
            let allRepos = [];
            let page = 1;

            while (page <= 10) {
                const res = await fetch(
                    `https://api.github.com/orgs/${GITHUB_ORG}/repos?per_page=100&page=${page}&sort=pushed&type=public`,
                    { headers }
                );

                if (res.status === 403 || res.status === 429) {
                    console.warn('GitHub API rate limit reached — showing partial results.');
                    break;
                }
                if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

                const batch = await res.json();
                if (!batch.length) break;

                allRepos = allRepos.concat(batch.filter(r => !r.fork && !r.archived));
                page++;
            }

            // Update live stat counter
            const statEl = document.getElementById('stat-repos');
            if (statEl && allRepos.length > 0) {
                statEl.dataset.target = allRepos.length;
                animateCounter(statEl, allRepos.length);
            }

            // Update filter button count
            const allBtn = document.getElementById('filter-all');
            if (allBtn) allBtn.textContent = `All (${allRepos.length})`;

            // Render cards
            repoGrid.innerHTML = '';
            if (!allRepos.length) {
                repoGrid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#888;padding:40px 0;">
                    No public repositories found in the ${GITHUB_ORG} organization.
                </p>`;
                return;
            }

            allRepos.forEach(repo => {
                repoGrid.appendChild(createRepoCard(repo));
            });

            // Show "Live" sync badge above the grid
            const syncBadge = document.getElementById('live-sync-badge');
            if (syncBadge) {
                syncBadge.innerHTML = `
                    <span style="display:inline-flex;align-items:center;gap:6px;font-size:0.78rem;color:#4ade80;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:99px;padding:4px 12px;">
                        <span style="width:6px;height:6px;border-radius:50%;background:#4ade80;display:inline-block;"></span>
                        Live · ${allRepos.length} repos loaded from GitHub
                    </span>`;
            }

            bindFilterLogic();
            document.querySelectorAll('.repo-card').forEach(el => revealObserver.observe(el));

        } catch (err) {
            console.error('GitHub API Error:', err);
            repoGrid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">
                    <p style="color:#ce2453;margin-bottom:8px;">⚠ Unable to load live repositories.</p>
                    <p style="font-size:0.85rem;">Check your connection or <a href="https://github.com/${GITHUB_ORG}" target="_blank" style="color:#ce2453;">browse on GitHub →</a></p>
                </div>`;
        }
    }

    function createRepoCard(repo) {
        const categories = mapTopicsToCategories(repo);
        const primaryCat = categories[0] || 'devops';
        const langClass = (repo.language || 'docs').toLowerCase().replace(/[^a-z0-9]/g, '');
        const iconPath = CATEGORY_ICONS[primaryCat] || CATEGORY_ICONS['devops'];
        const stars = repo.stargazers_count || 0;
        const updatedDate = new Date(repo.pushed_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

        const card = document.createElement('div');
        card.className = 'repo-card reveal';
        card.dataset.category = categories.join(' ');

        card.innerHTML = `
            <div class="repo-card-top">
                <div class="repo-icon ${primaryCat}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        ${iconPath}
                    </svg>
                </div>
                <div class="repo-tags">
                    ${categories.map(cat => `<span class="tag tag-${cat}">${cat.replace(/-/g, ' ')}</span>`).join('')}
                </div>
            </div>
            <h5>${repo.name}</h5>
            <p>${repo.description || 'Enterprise acceleration blueprint by Devopstrio.'}</p>
            <div class="repo-meta">
                <span class="repo-lang">
                    <span class="lang-dot ${langClass}"></span>
                    ${repo.language || 'Documentation'}
                </span>
                <span style="font-size:0.78rem;color:#666;display:flex;align-items:center;gap:4px;">
                    ${stars > 0 ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg> ${stars}` : ''}
                    <span style="color:#444;">${updatedDate}</span>
                </span>
                <a href="${repo.html_url}" target="_blank" rel="noopener" class="repo-link">View Repo ↗</a>
            </div>
        `;
        return card;
    }

    function mapTopicsToCategories(repo) {
        const topics = (repo.topics || []).map(t => t.toLowerCase());
        const name = repo.name.toLowerCase();
        const cats = new Set();

        const matches = (topicList, nameFragments = []) =>
            topics.some(t => topicList.includes(t)) || nameFragments.some(f => name.includes(f));

        if (matches(['landing-zone','caf','governance','subscription'], ['landingzone','landing-zone'])) cats.add('landing-zone');
        if (matches(['ai','openai','llm','rag','genai','fabric','databricks','ml','mlops'], ['ai','data','llm','rag','genai','mlflow','lakehouse'])) cats.add('ai');
        if (matches(['security','zero-trust','defender','iam','compliance','siem','devsecops'], ['security','trust','zero-trust','compliance','siem','vault','privileged'])) cats.add('security');
        if (matches(['vdi','avd','w365','desktop','fslogix'], ['avd','vdi','w365','windows-365'])) cats.add('vdi');
        if (matches(['fintech','healthcare','telecom','retail','industry','bank','government'], ['lz','financial','healthcare','insurance','automotive'])) cats.add('industry');
        if (matches(['devops','terraform','bicep','actions','cicd','yaml','gitops','ansible','kubernetes','docker'], ['devops','tf-','terraform','bicep','platform','k8s','helm','gitops'])) cats.add('devops');

        if (cats.size === 0) cats.add('devops');
        return Array.from(cats);
    }

    function bindFilterLogic() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.onclick = () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;
                let visibleCount = 0;

                document.querySelectorAll('.repo-card').forEach(card => {
                    const cats = (card.dataset.category || '').split(' ');
                    const show = filter === 'all' || cats.includes(filter);
                    if (show) {
                        card.classList.remove('hidden');
                        requestAnimationFrame(() => card.classList.add('visible'));
                        visibleCount++;
                    } else {
                        card.classList.remove('visible');
                        card.classList.add('hidden');
                    }
                });
            };
        });
    }

    // Initialize — runs on every page load, auto-syncing from GitHub
    fetchGitHubRepos();

    /* ── 10. FOOTER YEAR ── */
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

});
