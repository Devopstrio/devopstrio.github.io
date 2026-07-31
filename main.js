/* ═══════════════════════════════════════════
   DEVOPSTRIO — Main JavaScript
   Dynamic Repo Loader + UI Engine
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    /* ── 1. HEADER SCROLL EFFECT & MOBILE MENU ── */
    const header = document.getElementById('site-header');
    const onScroll = () => {
        header.classList.toggle('header-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            navLinks.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('open');
                navLinks.classList.remove('active');
            });
        });
    }

    /* ── 2. SMOOTH SCROLL WITH CONTEXT-AWARE FILTERING & HEADER OFFSET ── */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const targetId = anchor.getAttribute('href');
            if (targetId && targetId !== '#') {
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();

                    // Context-aware filter activation for bundle explore links
                    const targetFilter = anchor.dataset.filter;
                    if (targetFilter) {
                        const filterBtn = document.querySelector(`.filter-btn[data-filter="${targetFilter}"]`);
                        if (filterBtn) {
                            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                            filterBtn.classList.add('active');
                            currentFilter = targetFilter;
                            currentPage = 1;
                            renderRepositories(false);
                        }
                    }

                    const headerHeight = document.getElementById('site-header')?.offsetHeight || 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
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

    /* ── 5. ENTERPRISE BUNDLE 3D INFINITE CAROUSEL CONTROLLER ── */
    const carouselTrack = document.getElementById('tier-carousel-track');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    if (carouselTrack && prevBtn && nextBtn) {
        const cards = Array.from(carouselTrack.querySelectorAll('.tier-card'));
        // Cyclic card order: 0: Enterprise, 1: AI, 4: MultiCloud, 2: Data, 3: Security
        const CAROUSEL_ORDER = [0, 1, 4, 2, 3];
        let centerPosIndex = 2; // Default center is CAROUSEL_ORDER[2] = 4 (MultiCloud), showing AI (1) | MultiCloud (4) | Data (2)

        function updateCarouselPositions() {
            const total = CAROUSEL_ORDER.length;
            const leftOrderIdx = (centerPosIndex - 1 + total) % total;
            const rightOrderIdx = (centerPosIndex + 1) % total;

            const leftCardIdx = CAROUSEL_ORDER[leftOrderIdx];
            const centerCardIdx = CAROUSEL_ORDER[centerPosIndex];
            const rightCardIdx = CAROUSEL_ORDER[rightOrderIdx];

            cards.forEach((card, idx) => {
                card.classList.remove('pos-left', 'pos-center', 'pos-right', 'pos-hidden-left', 'pos-hidden-right');
                
                if (idx === centerCardIdx) {
                    card.classList.add('pos-center');
                } else if (idx === leftCardIdx) {
                    card.classList.add('pos-left');
                } else if (idx === rightCardIdx) {
                    card.classList.add('pos-right');
                } else {
                    const cardOrderIdx = CAROUSEL_ORDER.indexOf(idx);
                    const diff = (cardOrderIdx - centerPosIndex + total) % total;
                    if (diff > total / 2) {
                        card.classList.add('pos-hidden-left');
                    } else {
                        card.classList.add('pos-hidden-right');
                    }
                }
            });

            // Re-check current hover state post-navigation for instant active focus
            const currentlyHovered = cards.find(c => c.matches(':hover'));
            if (currentlyHovered && (currentlyHovered.classList.contains('pos-left') || currentlyHovered.classList.contains('pos-center') || currentlyHovered.classList.contains('pos-right'))) {
                cards.forEach(c => {
                    if (c === currentlyHovered) {
                        c.classList.add('hover-active');
                        c.classList.remove('hover-passive');
                    } else if (c.classList.contains('pos-left') || c.classList.contains('pos-center') || c.classList.contains('pos-right')) {
                        c.classList.add('hover-passive');
                        c.classList.remove('hover-active');
                    }
                });
            } else {
                cards.forEach(c => c.classList.remove('hover-active', 'hover-passive'));
            }
        }

        prevBtn.addEventListener('click', () => {
            centerPosIndex = (centerPosIndex - 1 + CAROUSEL_ORDER.length) % CAROUSEL_ORDER.length;
            updateCarouselPositions();
        });

        nextBtn.addEventListener('click', () => {
            centerPosIndex = (centerPosIndex + 1) % CAROUSEL_ORDER.length;
            updateCarouselPositions();
        });

        // Hover & Focus Instant Tracking for Visible Cards
        cards.forEach((card) => {
            const handleHoverIn = () => {
                if (card.classList.contains('pos-left') || card.classList.contains('pos-center') || card.classList.contains('pos-right')) {
                    cards.forEach(c => {
                        if (c === card) {
                            c.classList.add('hover-active');
                            c.classList.remove('hover-passive');
                        } else if (c.classList.contains('pos-left') || c.classList.contains('pos-center') || c.classList.contains('pos-right')) {
                            c.classList.add('hover-passive');
                            c.classList.remove('hover-active');
                        }
                    });
                }
            };

            const handleHoverOut = () => {
                cards.forEach(c => c.classList.remove('hover-active', 'hover-passive'));
            };

            card.addEventListener('mouseenter', handleHoverIn);
            card.addEventListener('mouseleave', handleHoverOut);
            card.addEventListener('focusin', handleHoverIn);
            card.addEventListener('focusout', handleHoverOut);
        });

        // Keyboard Arrow Key Navigation
        document.addEventListener('keydown', (e) => {
            const servicesSec = document.getElementById('services');
            if (!servicesSec) return;
            const rect = servicesSec.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                if (e.key === 'ArrowLeft') {
                    prevBtn.click();
                } else if (e.key === 'ArrowRight') {
                    nextBtn.click();
                }
            }
        });

        // Initial setup
        updateCarouselPositions();
    }

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
        'multicloud': `<path d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"/>`,
        'ai': `<path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>`,
        'security': `<path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>`,
        'devops': `<path d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"/>`,
        'vdi': `<rect width="18" height="12" x="3" y="4" rx="2"/><line x1="2" x2="22" y1="20" y2="20"/><line x1="12" x2="12" y1="16" y2="20"/>`,
        'industry': `<path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>`,
        'data': `<path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>`,
    };

    let allFetchedRepos = [];
    let currentFilter = 'all';
    let currentPage = 1;
    const REPOS_PER_PAGE = 15;

    const SUPPLEMENTAL_REPOS = [
        { name: 'Enterprise-Agent-Engineering', html_url: 'https://github.com/Devopstrio/Enterprise-Agent-Engineering', description: 'Enterprise agentic engineering blueprints and LLM multi-agent design patterns.', category: 'ai', stargazers_count: 12, pushed_at: '2026-06-15T10:00:00Z' },
        { name: 'enterprise-agent-platform', html_url: 'https://github.com/Devopstrio/enterprise-agent-platform', description: 'Scalable enterprise agent platform for autonomous AI agent workflows and tool calling.', category: 'ai', stargazers_count: 18, pushed_at: '2026-06-18T10:00:00Z' },
        { name: 'cloudops-ai-agent', html_url: 'https://github.com/Devopstrio/cloudops-ai-agent', description: 'Autonomous CloudOps AI agent for cloud infrastructure troubleshooting and incident remediation.', category: 'ai', stargazers_count: 24, pushed_at: '2026-06-20T10:00:00Z' },
        { name: 'terraform-agent-framework', html_url: 'https://github.com/Devopstrio/terraform-agent-framework', description: 'Terraform-native agentic framework for infrastructure automation and policy validation.', category: 'devops', stargazers_count: 15, pushed_at: '2026-06-22T10:00:00Z' },
        { name: 'landingzone-ai-agent', html_url: 'https://github.com/Devopstrio/landingzone-ai-agent', description: 'AI agent framework for landing zone provisioning, subscription vending, and compliance audit.', category: 'landing-zone', stargazers_count: 19, pushed_at: '2026-06-25T10:00:00Z' },
        { name: 'multi-agent-orchestrator', html_url: 'https://github.com/Devopstrio/multi-agent-orchestrator', description: 'Multi-agent orchestrator engine for complex multi-step enterprise AI tasks.', category: 'ai', stargazers_count: 31, pushed_at: '2026-06-28T10:00:00Z' },
        { name: 'agent-governance-framework', html_url: 'https://github.com/Devopstrio/agent-governance-framework', description: 'Security governance framework for AI agents with IAM boundaries and audit logging.', category: 'security', stargazers_count: 14, pushed_at: '2026-07-01T10:00:00Z' },
        { name: 'enterprise-ai-runtime', html_url: 'https://github.com/Devopstrio/enterprise-ai-runtime', description: 'Enterprise runtime environment for deploying scalable LLMs, RAG, and agentic microservices.', category: 'ai', stargazers_count: 27, pushed_at: '2026-07-02T10:00:00Z' },
        { name: 'ai-runtime-manager', html_url: 'https://github.com/Devopstrio/ai-runtime-manager', description: 'Runtime management platform for AI model deployment, container lifecycle, and scaling.', category: 'ai', stargazers_count: 16, pushed_at: '2026-07-03T10:00:00Z' },
        { name: 'inference-gateway', html_url: 'https://github.com/Devopstrio/inference-gateway', description: 'High-performance inference gateway with rate limiting, load balancing, and prompt routing.', category: 'ai', stargazers_count: 22, pushed_at: '2026-07-04T10:00:00Z' },
        { name: 'model-serving-engine', html_url: 'https://github.com/Devopstrio/model-serving-engine', description: 'Enterprise model serving engine optimized for low-latency LLM and SLM inference.', category: 'ai', stargazers_count: 17, pushed_at: '2026-07-05T10:00:00Z' },
        { name: 'llm-routing-engine', html_url: 'https://github.com/Devopstrio/llm-routing-engine', description: 'Dynamic LLM request router supporting cost optimization, fallback, and latency management.', category: 'ai', stargazers_count: 29, pushed_at: '2026-07-06T10:00:00Z' },
        { name: 'gpu-workload-manager', html_url: 'https://github.com/Devopstrio/gpu-workload-manager', description: 'GPU cluster workload manager for AI training, fine-tuning, and inference workloads.', category: 'ai', stargazers_count: 35, pushed_at: '2026-07-07T10:00:00Z' },
        { name: 'model-lifecycle-manager', html_url: 'https://github.com/Devopstrio/model-lifecycle-manager', description: 'End-to-end MLOps lifecycle manager for AI model registration, versioning, and evaluation.', category: 'ai', stargazers_count: 21, pushed_at: '2026-07-08T10:00:00Z' },
        { name: 'enterprise-knowledge-intelligence', html_url: 'https://github.com/Devopstrio/enterprise-knowledge-intelligence', description: 'Enterprise knowledge intelligence platform for GraphRAG and semantic search.', category: 'ai', stargazers_count: 26, pushed_at: '2026-07-09T10:00:00Z' },
        { name: 'knowledge-graph-engine', html_url: 'https://github.com/Devopstrio/knowledge-graph-engine', description: 'Scalable knowledge graph construction engine for enterprise entity extraction.', category: 'ai', stargazers_count: 18, pushed_at: '2026-07-10T10:00:00Z' },
        { name: 'graph-rag-platform', html_url: 'https://github.com/Devopstrio/graph-rag-platform', description: 'GraphRAG retrieval-augmented generation platform combining knowledge graphs and vector databases.', category: 'ai', stargazers_count: 42, pushed_at: '2026-07-11T10:00:00Z' },
        { name: 'enterprise-search-ai', html_url: 'https://github.com/Devopstrio/enterprise-search-ai', description: 'Enterprise AI search platform with hybrid vector, BM25, and semantic reranking.', category: 'ai', stargazers_count: 20, pushed_at: '2026-07-12T10:00:00Z' },
        { name: 'semantic-indexer', html_url: 'https://github.com/Devopstrio/semantic-indexer', description: 'Automated semantic indexing engine for structured and unstructured enterprise documents.', category: 'ai', stargazers_count: 13, pushed_at: '2026-07-13T10:00:00Z' },
        { name: 'knowledge-sync-service', html_url: 'https://github.com/Devopstrio/knowledge-sync-service', description: 'Real-time knowledge synchronization service connecting enterprise data sources to vector stores.', category: 'ai', stargazers_count: 15, pushed_at: '2026-07-14T10:00:00Z' },
        { name: 'document-intelligence-engine', html_url: 'https://github.com/Devopstrio/document-intelligence-engine', description: 'Document intelligence OCR and extraction engine for enterprise PDF, DOCX, and image pipelines.', category: 'ai', stargazers_count: 23, pushed_at: '2026-07-15T10:00:00Z' },
        { name: 'ai-integration-platform', html_url: 'https://github.com/Devopstrio/ai-integration-platform', description: 'Enterprise AI integration platform connecting LLMs to ERP, CRM, and legacy systems.', category: 'ai', stargazers_count: 30, pushed_at: '2026-07-16T10:00:00Z' },
        { name: 'ai-integration-hub', html_url: 'https://github.com/Devopstrio/ai-integration-hub', description: 'Centralized AI integration hub for API gateway routing, connectors, and webhooks.', category: 'ai', stargazers_count: 19, pushed_at: '2026-07-17T10:00:00Z' },
        { name: 'enterprise-event-gateway', html_url: 'https://github.com/Devopstrio/enterprise-event-gateway', description: 'Event-driven enterprise gateway for async messaging, webhook ingestion, and event bus routing.', category: 'devops', stargazers_count: 25, pushed_at: '2026-07-18T10:00:00Z' },
        { name: 'api-orchestration-engine', html_url: 'https://github.com/Devopstrio/api-orchestration-engine', description: 'High-throughput API orchestration engine for composite microservice workflows.', category: 'devops', stargazers_count: 17, pushed_at: '2026-07-19T10:00:00Z' },
        { name: 'connector-factory', html_url: 'https://github.com/Devopstrio/connector-factory', description: 'Factory framework for rapidly scaffolding enterprise SaaS and cloud infrastructure connectors.', category: 'devops', stargazers_count: 14, pushed_at: '2026-07-20T10:00:00Z' },
        { name: 'workflow-integration-kit', html_url: 'https://github.com/Devopstrio/workflow-integration-kit', description: 'Developer integration kit for embedding automated enterprise workflows into SaaS applications.', category: 'devops', stargazers_count: 11, pushed_at: '2026-07-21T10:00:00Z' },
        { name: 'enterprise-adapter-sdk', html_url: 'https://github.com/Devopstrio/enterprise-adapter-sdk', description: 'Enterprise adapter SDK for legacy system integration and protocol translation.', category: 'devops', stargazers_count: 16, pushed_at: '2026-07-22T10:00:00Z' },
        { name: 'ai-evaluation-platform', html_url: 'https://github.com/Devopstrio/ai-evaluation-platform', description: 'Enterprise AI evaluation platform for benchmarking LLM accuracy, safety, and performance.', category: 'ai', stargazers_count: 28, pushed_at: '2026-07-23T10:00:00Z' },
        { name: 'prompt-quality-bench', html_url: 'https://github.com/Devopstrio/prompt-quality-bench', description: 'Automated prompt engineering benchmark suite for testing prompt resilience and drift.', category: 'ai', stargazers_count: 12, pushed_at: '2026-07-24T10:00:00Z' },
        { name: 'llm-evaluation-engine', html_url: 'https://github.com/Devopstrio/llm-evaluation-engine', description: 'LLM evaluation engine with continuous automated scoring against custom ground-truth datasets.', category: 'ai', stargazers_count: 21, pushed_at: '2026-07-25T10:00:00Z' },
        { name: 'agent-test-framework', html_url: 'https://github.com/Devopstrio/agent-test-framework', description: 'Automated testing framework for validating AI agent decision trees and tool interactions.', category: 'ai', stargazers_count: 15, pushed_at: '2026-07-26T10:00:00Z' },
        { name: 'hallucination-analyzer', html_url: 'https://github.com/Devopstrio/hallucination-analyzer', description: 'Real-time hallucination detection and mitigation analyzer for enterprise GenAI applications.', category: 'ai', stargazers_count: 33, pushed_at: '2026-07-27T10:00:00Z' },
        { name: 'guardrail-validator', html_url: 'https://github.com/Devopstrio/guardrail-validator', description: 'Guardrail validation suite enforcing enterprise AI safety policies and PII redaction.', category: 'security', stargazers_count: 22, pushed_at: '2026-07-28T10:00:00Z' },
        { name: 'model-scorecard', html_url: 'https://github.com/Devopstrio/model-scorecard', description: 'Automated model quality scorecard generator evaluating bias, latency, accuracy, and cost.', category: 'ai', stargazers_count: 18, pushed_at: '2026-07-29T10:00:00Z' },
        { name: 'multicloud-control-plane', html_url: 'https://github.com/Devopstrio/multicloud-control-plane', description: 'Unified multi-cloud control plane for managing Azure, AWS, and GCP infrastructure.', category: 'multicloud', stargazers_count: 45, pushed_at: '2026-07-30T10:00:00Z' },
        { name: 'crosscloud-governance', html_url: 'https://github.com/Devopstrio/crosscloud-governance', description: 'Cross-cloud policy governance and compliance engine for hybrid multi-cloud environments.', category: 'multicloud', stargazers_count: 27, pushed_at: '2026-07-29T10:00:00Z' },
        { name: 'multicloud-network-hub', html_url: 'https://github.com/Devopstrio/multicloud-network-hub', description: 'Hybrid multi-cloud network mesh connecting cloud VNets, VPCs, and on-premises datacenters.', category: 'multicloud', stargazers_count: 31, pushed_at: '2026-07-28T10:00:00Z' },
        { name: 'cloud-policy-manager', html_url: 'https://github.com/Devopstrio/cloud-policy-manager', description: 'Policy-as-code management platform enforcing unified security rules across multi-cloud.', category: 'multicloud', stargazers_count: 19, pushed_at: '2026-07-27T10:00:00Z' },
        { name: 'multicloud-observability', html_url: 'https://github.com/Devopstrio/multicloud-observability', description: 'Unified multi-cloud observability platform consolidating metrics, logs, and traces.', category: 'multicloud', stargazers_count: 24, pushed_at: '2026-07-26T10:00:00Z' },
        { name: 'terraform-multicloud-blueprints', html_url: 'https://github.com/Devopstrio/terraform-multicloud-blueprints', description: 'Reusable Terraform blueprints for provisioning standardized multi-cloud landing zones.', category: 'multicloud', stargazers_count: 38, pushed_at: '2026-07-25T10:00:00Z' },
        { name: 'intelligent-cloud-automation', html_url: 'https://github.com/Devopstrio/intelligent-cloud-automation', description: 'AI-driven cloud automation platform for self-healing infrastructure and cloud operations.', category: 'multicloud', stargazers_count: 29, pushed_at: '2026-07-24T10:00:00Z' },
        { name: 'terraform-scaffold-engine', html_url: 'https://github.com/Devopstrio/terraform-scaffold-engine', description: 'CLI scaffolding engine for generating modular, enterprise-ready Terraform repositories.', category: 'devops', stargazers_count: 23, pushed_at: '2026-07-23T10:00:00Z' },
        { name: 'opentofu-blueprints', html_url: 'https://github.com/Devopstrio/opentofu-blueprints', description: 'OpenSource OpenTofu infrastructure blueprints for modern cloud deployment.', category: 'devops', stargazers_count: 34, pushed_at: '2026-07-22T10:00:00Z' },
        { name: 'automation-workflow-engine', html_url: 'https://github.com/Devopstrio/automation-workflow-engine', description: 'Scalable workflow automation engine executing IaC pipelines and operational runbooks.', category: 'devops', stargazers_count: 17, pushed_at: '2026-07-21T10:00:00Z' },
        { name: 'cloud-bootstrap-kit', html_url: 'https://github.com/Devopstrio/cloud-bootstrap-kit', description: 'Instant cloud bootstrap starter kit with CI/CD, security scanning, and IaC templates.', category: 'devops', stargazers_count: 26, pushed_at: '2026-07-20T10:00:00Z' },
        { name: 'runbook-orchestrator', html_url: 'https://github.com/Devopstrio/runbook-orchestrator', description: 'Automated runbook execution orchestrator for CloudOps and incident response pipelines.', category: 'devops', stargazers_count: 15, pushed_at: '2026-07-19T10:00:00Z' },
        { name: 'python-cloud-toolkit', html_url: 'https://github.com/Devopstrio/python-cloud-toolkit', description: 'Enterprise Python SDK and toolkit for cloud automation, FinOps, and DevOps scripting.', category: 'devops', stargazers_count: 21, pushed_at: '2026-07-18T10:00:00Z' },
        { name: 'event-driven-cloud-platform', html_url: 'https://github.com/Devopstrio/event-driven-cloud-platform', description: 'Event-driven cloud architecture blueprint built on cloud-native event buses and serverless.', category: 'devops', stargazers_count: 30, pushed_at: '2026-07-17T10:00:00Z' },
        { name: 'event-stream-hub', html_url: 'https://github.com/Devopstrio/event-stream-hub', description: 'Distributed event streaming hub supporting Kafka, Event Hubs, and Kinesis integration.', category: 'devops', stargazers_count: 18, pushed_at: '2026-07-16T10:00:00Z' },
        { name: 'message-routing-engine', html_url: 'https://github.com/Devopstrio/message-routing-engine', description: 'Enterprise message routing engine for asynchronous enterprise integration patterns.', category: 'devops', stargazers_count: 14, pushed_at: '2026-07-15T10:00:00Z' },
        { name: 'event-schema-registry', html_url: 'https://github.com/Devopstrio/event-schema-registry', description: 'Centralized event schema registry for managing Avro, Protobuf, and JSON schema evolution.', category: 'devops', stargazers_count: 16, pushed_at: '2026-07-14T10:00:00Z' },
        { name: 'stream-processing-kit', html_url: 'https://github.com/Devopstrio/stream-processing-kit', description: 'Real-time stream processing toolkit for low-latency analytics and event transformations.', category: 'devops', stargazers_count: 22, pushed_at: '2026-07-13T10:00:00Z' },
        { name: 'pubsub-blueprints', html_url: 'https://github.com/Devopstrio/pubsub-blueprints', description: 'Production-ready publish-subscribe architectural blueprints for multi-cloud messaging.', category: 'devops', stargazers_count: 20, pushed_at: '2026-07-12T10:00:00Z' },
        { name: 'event-replay-engine', html_url: 'https://github.com/Devopstrio/event-replay-engine', description: 'Reliable event replay and dead-letter queue management engine for event-driven systems.', category: 'devops', stargazers_count: 13, pushed_at: '2026-07-11T10:00:00Z' },
        { name: 'cloud-cost-governance', html_url: 'https://github.com/Devopstrio/cloud-cost-governance', description: 'FinOps cloud cost governance platform enforcing budget policies and cost allocation.', category: 'multicloud', stargazers_count: 36, pushed_at: '2026-07-10T10:00:00Z' },
        { name: 'budget-as-code', html_url: 'https://github.com/Devopstrio/budget-as-code', description: 'Budget-as-Code framework for defining cloud spending limits within Terraform & Bicep.', category: 'multicloud', stargazers_count: 25, pushed_at: '2026-07-09T10:00:00Z' },
        { name: 'cloud-cost-analyzer', html_url: 'https://github.com/Devopstrio/cloud-cost-analyzer', description: 'Multi-cloud cost analysis tool detailing spending across subscriptions, resource groups, and tags.', category: 'multicloud', stargazers_count: 28, pushed_at: '2026-07-08T10:00:00Z' },
        { name: 'cost-anomaly-detector', html_url: 'https://github.com/Devopstrio/cost-anomaly-detector', description: 'AI-powered FinOps cost anomaly detector alerting on unpredicted cloud spend spikes.', category: 'multicloud', stargazers_count: 32, pushed_at: '2026-07-07T10:00:00Z' },
        { name: 'cloud-cost-optimizer', html_url: 'https://github.com/Devopstrio/cloud-cost-optimizer', description: 'Automated cloud cost optimization engine identifying unattached disks, idle VMs, and right-sizing.', category: 'multicloud', stargazers_count: 40, pushed_at: '2026-07-06T10:00:00Z' },
        { name: 'carbon-usage-analyzer', html_url: 'https://github.com/Devopstrio/carbon-usage-analyzer', description: 'Cloud sustainability and carbon footprint analyzer estimating CO2 emissions across multi-cloud.', category: 'multicloud', stargazers_count: 19, pushed_at: '2026-07-05T10:00:00Z' },
        { name: 'cloud-efficiency-score', html_url: 'https://github.com/Devopstrio/cloud-efficiency-score', description: 'Enterprise Cloud Efficiency Score metric generator evaluating FinOps, security, and utilization.', category: 'multicloud', stargazers_count: 22, pushed_at: '2026-07-04T10:00:00Z' },
        { name: 'Enterprise-AI-Governance', html_url: 'https://github.com/Devopstrio/Enterprise-AI-Governance', description: 'Comprehensive AI governance and compliance framework aligned to EU AI Act and NIST AI RMF.', category: 'security', stargazers_count: 48, pushed_at: '2026-07-03T10:00:00Z' },
        { name: 'model-risk-governance', html_url: 'https://github.com/Devopstrio/model-risk-governance', description: 'Enterprise model risk management platform tracking AI model risk profiles and approvals.', category: 'security', stargazers_count: 21, pushed_at: '2026-07-02T10:00:00Z' },
        { name: 'ai-policy-engine', html_url: 'https://github.com/Devopstrio/ai-policy-engine', description: 'Policy enforcement engine for AI guardrails, model access control, and data privacy.', category: 'security', stargazers_count: 27, pushed_at: '2026-07-01T10:00:00Z' },
        { name: 'responsible-ai-toolkit', html_url: 'https://github.com/Devopstrio/responsible-ai-toolkit', description: 'Responsible AI toolkit for auditing model fairness, explainability, and bias mitigation.', category: 'security', stargazers_count: 30, pushed_at: '2026-06-30T10:00:00Z' },
        { name: 'ai-compliance-mapper', html_url: 'https://github.com/Devopstrio/ai-compliance-mapper', description: 'Automated AI compliance mapping tool linking model artifacts to regulatory controls.', category: 'security', stargazers_count: 17, pushed_at: '2026-06-29T10:00:00Z' },
        { name: 'model-transparency-kit', html_url: 'https://github.com/Devopstrio/model-transparency-kit', description: 'Model transparency and documentation generator outputting AI Model Cards and datasheets.', category: 'security', stargazers_count: 15, pushed_at: '2026-06-28T10:00:00Z' },
        { name: 'ai-audit-framework', html_url: 'https://github.com/Devopstrio/ai-audit-framework', description: 'Enterprise AI auditing framework generating immutable audit trails for AI decision-making.', category: 'security', stargazers_count: 24, pushed_at: '2026-06-27T10:00:00Z' }
    ];

    function sanitizeRepoName(rawName) {
        return (rawName || '').trim().replace(/^[-_]+|[-_]+$/g, '');
    }

    function sanitizeGitHubUrl(rawUrl, rawName) {
        let slug = (rawName || '').trim();
        if (rawUrl) {
            const parts = rawUrl.trim().split('/');
            const lastPart = parts[parts.length - 1] || parts[parts.length - 2];
            if (lastPart) slug = lastPart;
        }
        const cleanSlug = sanitizeRepoName(slug);
        return `https://github.com/Devopstrio/${cleanSlug}`;
    }

    let currentSearchQuery = '';

    function normalizeSearchQuery(str) {
        return (str || '')
            .toLowerCase()
            .replace(/[-_]/g, ' ')
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function bindSearchLogic() {
        const input = document.getElementById('repo-search-input');
        const clearBtn = document.getElementById('repo-search-clear');
        if (!input) return;

        input.addEventListener('input', () => {
            currentSearchQuery = input.value;
            if (clearBtn) {
                clearBtn.style.display = currentSearchQuery.length > 0 ? 'flex' : 'none';
            }
            currentPage = 1;
            renderRepositories(false);
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                input.value = '';
                currentSearchQuery = '';
                clearBtn.style.display = 'none';
                currentPage = 1;
                renderRepositories(false);
                input.focus();
            });
        }

        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                const searchSec = document.getElementById('repos');
                if (searchSec) {
                    e.preventDefault();
                    input.focus();
                    input.select();
                }
            } else if (e.key === 'Escape' && document.activeElement === input) {
                if (input.value) {
                    input.value = '';
                    currentSearchQuery = '';
                    if (clearBtn) clearBtn.style.display = 'none';
                    currentPage = 1;
                    renderRepositories(false);
                } else {
                    input.blur();
                }
            }
        });
    }

    async function fetchGitHubRepos() {
        const repoGrid = document.getElementById('repo-grid');
        if (!repoGrid) return;

        // Show premium loading state
        repoGrid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
                <div style="display:inline-flex; align-items:center; gap:12px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px 28px;">
                    <span class="status-dot" style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#D32F2F; animation:pulse 1.4s ease-in-out infinite;"></span>
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

            // Sanitize API repos
            allRepos = allRepos.map(repo => ({
                ...repo,
                name: sanitizeRepoName(repo.name),
                html_url: sanitizeGitHubUrl(repo.html_url, repo.name)
            }));

            // Dual deduplication by both Name & GitHub URL
            const existingNames = new Set(allRepos.map(r => r.name.toLowerCase()));
            const existingUrls = new Set(allRepos.map(r => r.html_url.toLowerCase()));

            SUPPLEMENTAL_REPOS.forEach(supp => {
                const cleanName = sanitizeRepoName(supp.name);
                const cleanUrl = sanitizeGitHubUrl(supp.html_url, supp.name);
                const nameKey = cleanName.toLowerCase();
                const urlKey = cleanUrl.toLowerCase();

                if (!existingNames.has(nameKey) && !existingUrls.has(urlKey)) {
                    allRepos.push({
                        ...supp,
                        name: cleanName,
                        html_url: cleanUrl
                    });
                    existingNames.add(nameKey);
                    existingUrls.add(urlKey);
                }
            });

            allFetchedRepos = allRepos;

            // Update live stat counter
            const statEl = document.getElementById('stat-repos');
            if (statEl && allRepos.length > 0) {
                statEl.dataset.target = allRepos.length;
                animateCounter(statEl, allRepos.length);
            }

            // Update filter button count
            const allBtn = document.getElementById('filter-all');
            if (allBtn) allBtn.textContent = `All (${allRepos.length})`;

            // Show "Live" sync badge above the grid
            const syncBadge = document.getElementById('live-sync-badge');
            if (syncBadge) {
                syncBadge.innerHTML = `
                    <span style="display:inline-flex;align-items:center;gap:6px;font-size:0.78rem;color:#EF5350;background:rgba(211,47,47,0.1);border:1px solid rgba(211,47,47,0.25);border-radius:99px;padding:4px 14px;font-weight:600;">
                        <span style="width:6px;height:6px;border-radius:50%;background:#D32F2F;display:inline-block;box-shadow:0 0 8px #D32F2F;"></span>
                        Live · ${allRepos.length} repos loaded from GitHub
                    </span>`;
            }

            initSearchSafely();
            bindFilterEvents();
            renderRepositories(false);

        } catch (err) {
            console.error('GitHub API Error:', err);
            // Fallback: load SUPPLEMENTAL_REPOS on network error
            allFetchedRepos = SUPPLEMENTAL_REPOS;
            initSearchSafely();
            bindFilterEvents();
            renderRepositories(false);
        }
    }

    function initSearchSafely() {
        try {
            if (document.getElementById('repo-search-input')) {
                bindSearchLogic();
            }
        } catch (e) {
            console.warn('Search initialization error:', e);
        }
    }

    function getFilteredRepos() {
        let repos = allFetchedRepos;

        if (currentFilter !== 'all') {
            repos = repos.filter(repo => {
                const categories = mapTopicsToCategories(repo);
                return categories.includes(currentFilter);
            });
        }

        if (currentSearchQuery) {
            const queryWords = normalizeSearchQuery(currentSearchQuery).split(' ').filter(Boolean);
            repos = repos.filter(repo => {
                const nameStr = normalizeSearchQuery(repo.name || '');
                const descStr = normalizeSearchQuery(repo.description || '');
                const topicsStr = normalizeSearchQuery((repo.topics || []).join(' '));
                const catStr = normalizeSearchQuery((repo.category || '') + ' ' + mapTopicsToCategories(repo).join(' '));
                const langStr = normalizeSearchQuery(repo.language || '');
                const combinedText = `${nameStr} ${descStr} ${topicsStr} ${catStr} ${langStr}`;

                return queryWords.every(word => combinedText.includes(word));
            });
        }

        return repos;
    }

    function renderRepositories(shouldScroll = false) {
        const repoGrid = document.getElementById('repo-grid');
        if (!repoGrid) return;

        const filteredRepos = getFilteredRepos();
        const totalRepos = filteredRepos.length;
        const totalPages = Math.ceil(totalRepos / REPOS_PER_PAGE) || 1;

        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * REPOS_PER_PAGE;
        const pageRepos = filteredRepos.slice(startIndex, startIndex + REPOS_PER_PAGE);

        repoGrid.innerHTML = '';
        if (!pageRepos.length) {
            if (currentSearchQuery) {
                repoGrid.innerHTML = `
                    <div class="search-empty-state" style="grid-column:1/-1; text-align:center; padding:60px 20px;">
                        <div style="width:56px; height:56px; border-radius:50%; background:rgba(211,47,47,0.1); border:1px solid rgba(211,47,47,0.25); display:inline-flex; align-items:center; justify-content:center; margin-bottom:16px; margin-left:auto; margin-right:auto;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF5350" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <h4 style="font-size:1.25rem; font-weight:700; color:#FFF; margin-bottom:8px;">No repositories found</h4>
                        <p style="color:#AAA; font-size:0.95rem; max-width:480px; margin:0 auto 24px; line-height:1.6;">
                            No matching accelerators found for "<span style="color:#EF5350; font-weight:600;">${escapeHtml(currentSearchQuery)}</span>". Try another keyword or clear your search.
                        </p>
                        <button id="btn-clear-search-empty" class="btn-clear-empty" type="button" style="padding:10px 24px; background:#D32F2F; color:#FFF; border:none; border-radius:12px; font-weight:700; font-family:'Outfit',sans-serif; cursor:pointer; transition:all 0.25s ease;">Clear Search</button>
                    </div>`;

                const emptyClearBtn = document.getElementById('btn-clear-search-empty');
                if (emptyClearBtn) {
                    emptyClearBtn.onclick = () => {
                        const input = document.getElementById('repo-search-input');
                        const clearBtn = document.getElementById('repo-search-clear');
                        if (input) input.value = '';
                        if (clearBtn) clearBtn.style.display = 'none';
                        currentSearchQuery = '';
                        currentPage = 1;
                        renderRepositories(false);
                    };
                }
            } else {
                repoGrid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#888;padding:40px 0;">
                    No repositories found for this category.
                </p>`;
            }
        } else {
            pageRepos.forEach(repo => {
                const card = createRepoCard(repo);
                repoGrid.appendChild(card);
            });
        }

        renderPagination(totalPages);

        document.querySelectorAll('.repo-card').forEach(el => revealObserver.observe(el));

        if (shouldScroll) {
            const sectionHeader = document.getElementById('repos-header') || document.getElementById('repos');
            if (sectionHeader) {
                sectionHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    function renderPagination(totalPages) {
        const container = document.getElementById('pagination-container');
        if (!container) return;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = `
            <div class="pagination-bar">
                <button class="pagination-btn nav-btn" id="pagination-prev" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous Page">
                    Previous
                </button>
        `;

        const pagesToShow = getPaginationPages(currentPage, totalPages);

        pagesToShow.forEach(page => {
            if (page === '...') {
                html += `<span class="pagination-ellipsis">...</span>`;
            } else {
                html += `
                    <button class="pagination-btn num-btn ${page === currentPage ? 'active' : ''}" data-page="${page}" aria-label="Page ${page}">
                        ${page}
                    </button>
                `;
            }
        });

        html += `
                <button class="pagination-btn nav-btn" id="pagination-next" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next Page">
                    Next
                </button>
            </div>
        `;

        container.innerHTML = html;

        const prevBtn = document.getElementById('pagination-prev');
        if (prevBtn && !prevBtn.disabled) {
            prevBtn.onclick = () => changePage(currentPage - 1);
        }

        const nextBtn = document.getElementById('pagination-next');
        if (nextBtn && !nextBtn.disabled) {
            nextBtn.onclick = () => changePage(currentPage + 1);
        }

        container.querySelectorAll('.num-btn[data-page]').forEach(btn => {
            btn.onclick = () => {
                const pageNum = parseInt(btn.dataset.page, 10);
                if (pageNum && pageNum !== currentPage) {
                    changePage(pageNum);
                }
            };
        });
    }

    function getPaginationPages(current, total) {
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        if (current <= 4) {
            return [1, 2, 3, 4, 5, '...', total];
        }
        if (current >= total - 3) {
            return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        }
        return [1, '...', current - 1, current, current + 1, '...', total];
    }

    function changePage(newPage) {
        currentPage = newPage;
        renderRepositories(true);
    }

    function bindFilterEvents() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.onclick = () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                currentPage = 1;
                renderRepositories(false);
            };
        });
    }

    function createRepoCard(repo) {
        const categories = mapTopicsToCategories(repo);
        const primaryCat = categories[0] || 'devops';
        const primaryCatLabel = primaryCat.replace(/-/g, ' ').toUpperCase();
        const langClass = (repo.language || 'docs').toLowerCase().replace(/[^a-z0-9]/g, '');
        const iconPath = CATEGORY_ICONS[primaryCat] || CATEGORY_ICONS['devops'];
        const stars = repo.stargazers_count || 0;
        const updatedDate = new Date(repo.pushed_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

        const rawChips = Array.from(new Set([
            repo.language,
            ...(repo.topics || []).slice(0, 4)
        ])).filter(Boolean);

        const card = document.createElement('div');
        card.className = 'repo-card reveal';
        card.dataset.category = categories.join(' ');

        let nameHtml = repo.name;
        if (currentSearchQuery && currentSearchQuery.trim()) {
            const raw = currentSearchQuery.trim();
            const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escaped})`, 'gi');
            nameHtml = repo.name.replace(regex, '<mark class="search-highlight">$1</mark>');
        }

        card.innerHTML = `
            <div class="repo-card-header">
                <div class="repo-icon-tile ${primaryCat}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        ${iconPath}
                    </svg>
                </div>
                <div class="repo-card-badges">
                    <span class="repo-badge-cat">${primaryCatLabel}</span>
                    <span class="repo-badge-live">
                        <span class="live-dot"></span>LIVE
                    </span>
                </div>
            </div>

            <div class="repo-card-body">
                <h4 class="repo-card-title">${nameHtml}</h4>
                <p class="repo-card-desc">${repo.description || 'Production-grade enterprise cloud blueprint and automation accelerator by Devopstrio.'}</p>
                
                <div class="repo-tech-chips">
                    ${rawChips.map(chip => `<span class="tech-chip">${chip}</span>`).join('')}
                </div>
            </div>

            <div class="repo-card-footer">
                <div class="repo-card-meta">
                    <span class="repo-lang">
                        <span class="lang-dot ${langClass}"></span>
                        ${repo.language || 'Documentation'}
                    </span>
                    ${stars > 0 ? `<span class="repo-stars" style="display:inline-flex;align-items:center;gap:3px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg> ${stars}</span>` : ''}
                    <span class="repo-date" style="color:#555;">${updatedDate}</span>
                </div>
                <a href="${repo.html_url}" target="_blank" rel="noopener" class="repo-cta-btn" aria-label="Open Blueprint for ${repo.name}">
                    <span>Open Blueprint</span>
                    <span class="repo-link-arrow">→</span>
                </a>
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
        if (matches(['multicloud','multi-cloud','hybrid-cloud','aws-azure','cross-cloud','azure-aws'], ['multicloud','multi-cloud','cross-cloud','hybrid-cloud'])) cats.add('multicloud');
        if (matches(['ai','openai','llm','rag','genai','fabric','databricks','ml','mlops'], ['ai','data','llm','rag','genai','mlflow','lakehouse'])) cats.add('ai');
        if (matches(['security','zero-trust','defender','iam','compliance','siem','devsecops'], ['security','trust','zero-trust','compliance','siem','vault','privileged'])) cats.add('security');
        if (matches(['vdi','avd','w365','desktop','fslogix'], ['avd','vdi','w365','windows-365'])) cats.add('vdi');
        if (matches(['fintech','healthcare','telecom','retail','industry','bank','government'], ['lz','financial','healthcare','insurance','automotive'])) cats.add('industry');
        if (matches(['devops','terraform','bicep','actions','cicd','yaml','gitops','ansible','kubernetes','docker'], ['devops','tf-','terraform','bicep','platform','k8s','helm','gitops'])) cats.add('devops');

        if (cats.size === 0) cats.add('devops');
        return Array.from(cats);
    }

    // Initialize — runs on every page load, auto-syncing from GitHub
    fetchGitHubRepos();

    /* ── 10. FOOTER YEAR ── */
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

});
