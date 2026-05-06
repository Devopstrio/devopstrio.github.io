/* ═══════════════════════════════════════════
   DEVOPSTRIO — Main JavaScript
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    /* ── 1. HEADER SCROLL EFFECT ── */
    const header = document.getElementById('site-header');
    const onScroll = () => {
        if (window.scrollY > 40) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
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

    /* ── 4. COUNTER ANIMATION ── */
    function animateCounter(el, target, suffix = '') {
        const duration = 1800;
        const start = performance.now();
        const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        function step(now) {
            const elapsed = Math.min((now - start) / duration, 1);
            const val = Math.round(ease(elapsed) * target);
            el.textContent = val + suffix;
            if (elapsed < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    /* ── 5. SCROLL REVEAL + COUNTER TRIGGER ── */
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
                    const target = parseInt(el.dataset.target, 10);
                    animateCounter(el, target);
                    counterObserver.unobserve(el);
                }
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

    /* ── 9. DYNAMIC REPO FETCHING (GitHub API) ── */
    const GITHUB_ORG = 'Devopstrio';
    // NOTE: This placeholder is replaced during deployment via GitHub Actions
    const GITHUB_TOKEN = '%%GITHUB_TOKEN%%'; 

    async function fetchGitHubRepos() {
        const repoGrid = document.getElementById('repo-grid');
        if (!repoGrid) return;

        // Show loading state
        repoGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">
                <div class="status-dot" style="display: inline-block; margin-bottom: 10px;"></div>
                <p>Syncing live accelerators from GitHub...</p>
            </div>
        `;

        try {
            let allRepos = [];
            let page = 1;
            let hasMore = true;

            // Fetch until we get all repos or hit a safety limit
            while (hasMore && page <= 10) {
                const headers = { 'Accept': 'application/vnd.github.v3+json' };
                // Only add token if it has been replaced (isn't the placeholder)
                if (GITHUB_TOKEN && !GITHUB_TOKEN.startsWith('%%')) {
                    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
                }

                const response = await fetch(`https://api.github.com/orgs/${GITHUB_ORG}/repos?per_page=100&page=${page}&sort=pushed`, {
                    headers: headers
                });

                if (!response.ok) {
                    if (response.status === 403) console.warn('GitHub API rate limit reached.');
                    throw new Error('Failed to fetch repos');
                }

                const repos = await response.json();
                if (repos.length === 0) {
                    hasMore = false;
                } else {
                    allRepos = allRepos.concat(repos);
                    page++;
                }
            }
            
            repoGrid.innerHTML = ''; // Clear loading

            if (allRepos.length === 0) {
                repoGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">No public repositories found.</p>';
                return;
            }

            allRepos.forEach(repo => {
                if (repo.fork) return; // Skip forks
                const card = createRepoCard(repo);
                repoGrid.appendChild(card);
            });

            // Re-bind filter logic to new cards
            bindFilterLogic();
            
            // Re-trigger reveal animations
            document.querySelectorAll('.repo-card').forEach(el => revealObserver.observe(el));

        } catch (error) {
            console.error('GitHub API Error:', error);
            repoGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ce2453;">Unable to sync live repositories. Showing offline catalog.</p>';
        }
    }

    function createRepoCard(repo) {
        const categories = mapTopicsToCategories(repo);
        const langClass = (repo.language || 'docs').toLowerCase();
        
        const card = document.createElement('div');
        card.className = 'repo-card reveal';
        card.dataset.category = categories.join(' ');

        card.innerHTML = `
            <div class="repo-card-top">
                <div class="repo-icon ${categories[0] || 'cloud'}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253M3.157 7.582A8.959 8.959 0 0 0 3 12c0 .778.099 1.533.284 2.253" />
                    </svg>
                </div>
                <div class="repo-tags">
                    ${categories.map(cat => `<span class="tag tag-${cat}">${cat.replace('-', ' ')}</span>`).join('')}
                </div>
            </div>
            <h5>${repo.name}</h5>
            <p>${repo.description || 'Enterprise acceleration blueprint by Devopstrio.'}</p>
            <div class="repo-meta">
                <span class="repo-lang"><span class="lang-dot ${langClass}"></span>${repo.language || 'Documentation'}</span>
                <a href="${repo.html_url}" target="_blank" rel="noopener" class="repo-link">View Repo ↗</a>
            </div>
        `;
        return card;
    }

    function mapTopicsToCategories(repo) {
        const topics = (repo.topics || []).map(t => t.toLowerCase());
        const name = repo.name.toLowerCase();
        const cats = new Set();

        if (topics.some(t => ['landing-zone', 'caf', 'governance', 'subscription'].includes(t)) || name.includes('landingzone') || name.includes('landing-zone')) cats.add('landing-zone');
        if (topics.some(t => ['ai', 'openai', 'llm', 'rag', 'data', 'fabric', 'databricks'].includes(t)) || name.includes('ai') || name.includes('data')) cats.add('ai');
        if (topics.some(t => ['security', 'zero-trust', 'defender', 'iam', 'compliance'].includes(t)) || name.includes('security') || name.includes('trust')) cats.add('security');
        if (topics.some(t => ['vdi', 'avd', 'w365', 'desktop'].includes(t)) || name.includes('avd') || name.includes('vdi')) cats.add('vdi');
        if (topics.some(t => ['fintech', 'healthcare', 'telecom', 'retail', 'industry', 'bank'].includes(t))) cats.add('industry');
        if (topics.some(t => ['devops', 'terraform', 'bicep', 'actions', 'cicd', 'yaml', 'gitops'].includes(t)) || name.includes('devops') || name.includes('tf-') || name.includes('terraform')) cats.add('devops');

        if (cats.size === 0) cats.add('devops'); // Default
        return Array.from(cats);
    }

    function bindFilterLogic() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.onclick = () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;

                document.querySelectorAll('.repo-card').forEach(card => {
                    const cats = (card.dataset.category || '').split(' ');
                    const show = filter === 'all' || cats.includes(filter);
                    if (show) {
                        card.classList.remove('hidden');
                        requestAnimationFrame(() => card.classList.add('visible'));
                    } else {
                        card.classList.add('hidden');
                    }
                });
            };
        });
    }

    // Initialize
    fetchGitHubRepos();

    /* ── 10. FOOTER YEAR ── */
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

});
