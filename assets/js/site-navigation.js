// Progressive navigation for the four main sections. Each URL also works on its own.
(function () {
    'use strict';

    if (!window.fetch || !window.DOMParser || !history.pushState || location.protocol === 'file:') return;

    const root = new URL('../../', document.currentScript.src);
    const routes = new Set(['index.html', 'research.html', 'personal.html', 'photo.html']
        .map(name => new URL(name, root).pathname));
    const wrapper = document.getElementById('wrapper');
    const header = document.getElementById('header');
    const copyright = document.getElementById('copyright');
    const pages = new Map();
    const requests = new Map();
    const styles = new Map();
    const positions = new Map();
    let navigation = 0;
    let sequence = 0;

    function routeFor(url) {
        if (url.origin !== root.origin || url.search) return null;
        const path = url.pathname === root.pathname ? new URL('index.html', root).pathname : url.pathname;
        return routes.has(path) ? path : null;
    }

    const initialPath = routeFor(new URL(location.href));
    if (!initialPath || !wrapper || !header || !copyright || !document.getElementById('main')) return;

    function readPage(doc, path) {
        const main = doc.getElementById('main');
        const logo = doc.querySelector('#header .logo');
        const footer = doc.getElementById('copyright');
        if (!main || !logo || !footer) throw new Error('Incomplete section');
        return {
            path, main, intro: doc.getElementById('intro'),
            title: doc.title, logo: logo.textContent, footer: footer.innerHTML,
            lang: doc.documentElement.lang || 'en',
            description: doc.querySelector('meta[name="description"]')?.content,
            styles: Array.from(doc.querySelectorAll('head > link[rel="stylesheet"]'))
                .map(link => new URL(link.getAttribute('href'), root).href)
        };
    }

    let current = readPage(document, initialPath);
    pages.set(initialPath, current);
    let entry = history.state?.siteNavigation?.id || 'section-' + Date.now() + '-' + sequence++;
    let showIntro = Boolean(current.intro) && history.state?.siteNavigation?.intro !== false;
    if (current.intro && !showIntro) current.intro.remove();
    document.body.classList.add('has-section-navigation');
    history.replaceState(Object.assign({}, history.state, {siteNavigation: {id: entry, intro: showIntro}}), '');
    history.scrollRestoration = 'manual';
    positions.set(entry, [scrollX, scrollY]);

    document.querySelectorAll('head > link[rel="stylesheet"]').forEach(link => {
        styles.set(link.href, {link, ready: Promise.resolve()});
    });

    function fetchPage(path) {
        if (!requests.has(path)) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const request = fetch(path, {signal: controller.signal, credentials: 'same-origin'})
                .then(response => {
                    if (!response.ok || response.redirected) throw new Error('Section unavailable');
                    return response.text();
                })
                .finally(() => clearTimeout(timeout))
                .catch(error => {
                    requests.delete(path);
                    throw error;
                });
            requests.set(path, request);
        }
        return requests.get(path);
    }

    function loadStyle(href) {
        if (!styles.has(href)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            // Download without applying another section's global rules yet.
            link.media = 'not all';
            const ready = new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('Stylesheet timed out')), 10000);
                link.onload = () => { clearTimeout(timer); resolve(); };
                link.onerror = () => { clearTimeout(timer); reject(new Error('Stylesheet unavailable')); };
            }).catch(error => {
                styles.delete(href);
                link.remove();
                throw error;
            });
            styles.set(href, {link, ready});
            document.head.appendChild(link);
        }
        return styles.get(href).ready;
    }

    async function getPage(path) {
        if (!pages.has(path)) {
            const html = await fetchPage(path);
            // Another click may have finished parsing this same request already.
            if (!pages.has(path)) pages.set(path, readPage(new DOMParser().parseFromString(html, 'text/html'), path));
        }
        const page = pages.get(path);
        await Promise.all(page.styles.map(loadStyle));
        return page;
    }

    function updateMeta(name, content) {
        let meta = document.querySelector('meta[name="' + name + '"]');
        if (!content) { if (meta) meta.remove(); return; }
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    function updateLinks() {
        document.querySelectorAll('#nav .links a, #navPanel .links a').forEach(link => {
            const active = routeFor(new URL(link.href)) === current.path;
            link.parentElement.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    }

    function savePosition() {
        const position = [scrollX, scrollY];
        positions.set(entry, position);
    }

    function scrollToPage(url, position) {
        let anchor;
        try { anchor = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch (_) { /* Invalid hash. */ }
        if (anchor) anchor.scrollIntoView({behavior: 'instant'});
        else window.scrollTo({left: position[0], top: position[1], behavior: 'instant'});
    }

    async function navigate(url, historyEntry) {
        const path = routeFor(url);
        const ticket = ++navigation;
        savePosition();
        document.body.classList.remove('is-navPanel-visible');
        wrapper.setAttribute('aria-busy', 'true');
        document.body.classList.add('is-section-loading');
        try {
            const next = await getPage(path);
            if (ticket !== navigation) return;
            savePosition();
            // Tab clicks start at the section header; only Back/Forward restore a
            // reading position (and the original homepage's welcome screen).
            const position = historyEntry ? positions.get(historyEntry.id) || [0, 0] : [0, 0];
            showIntro = Boolean(historyEntry?.intro && next.intro);
            if (current.intro) current.intro.remove();

            if (next !== current) {
                current.main.hidden = true;
                current.main.inert = true;
                current.main.removeAttribute('id');
                styles.forEach(({link}, href) => {
                    const media = next.styles.includes(href) ? 'all' : 'not all';
                    // Leave shared stylesheets entirely untouched during a switch.
                    if ((link.media || 'all') !== media) link.media = media;
                });
                next.main.id = 'main';
                next.main.hidden = false;
                next.main.inert = false;
                // Keep visited views connected: detaching a PDF iframe resets its viewer.
                if (next.main.parentNode !== wrapper) wrapper.insertBefore(next.main, copyright);
                header.querySelector('.logo').textContent = next.logo;
                copyright.innerHTML = next.footer;
                current = next;
            }
            if (showIntro) wrapper.insertBefore(current.intro, header);

            document.title = current.title;
            document.documentElement.lang = current.lang;
            updateMeta('description', current.description);
            if (historyEntry) entry = historyEntry.id;
            else {
                entry = 'section-' + Date.now() + '-' + sequence++;
                history.pushState({siteNavigation: {id: entry, intro: showIntro}}, '', url.href);
            }
            updateLinks();
            document.dispatchEvent(new CustomEvent('site:pagechange'));
            scrollToPage(url, position);
            current.main.setAttribute('tabindex', '-1');
            current.main.focus({preventScroll: true});
            window.dispatchEvent(new Event('scroll'));
            savePosition();
        } catch (_) {
            // A failed enhancement must never leave a link unusable.
            if (ticket === navigation) location.assign(url.href);
        } finally {
            if (ticket === navigation) {
                wrapper.removeAttribute('aria-busy');
                document.body.classList.remove('is-section-loading');
            }
        }
    }

    function sectionLink(event) {
        const link = event.target.closest?.('#nav .links a, #navPanel .links a');
        if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return null;
        return routeFor(new URL(link.href)) ? link : null;
    }

    // Capture before the template's mobile panel schedules a full-page redirect.
    document.addEventListener('click', event => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = sectionLink(event);
        if (!link) return;
        event.preventDefault();
        event.stopPropagation();
        const url = new URL(link.href);
        if (routeFor(url) === current.path && !showIntro) {
            ++navigation; // A click back to the current section cancels an in-flight switch.
            document.body.classList.remove('is-navPanel-visible', 'is-section-loading');
            wrapper.removeAttribute('aria-busy');
            scrollToPage(url, [0, 0]);
            savePosition();
            return;
        }
        navigate(url);
    }, true);

    function prefetch(event) {
        const connection = navigator.connection;
        if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return;
        const link = sectionLink(event);
        const path = link && routeFor(new URL(link.href));
        // Intent-based HTML only; do not fetch photo albums or PDFs speculatively.
        if (path && !pages.has(path)) fetchPage(path).catch(() => {});
    }
    document.addEventListener('pointerover', prefetch, {passive: true});
    document.addEventListener('focusin', prefetch);
    window.addEventListener('scroll', savePosition, {passive: true});
    window.addEventListener('popstate', event => {
        const url = new URL(location.href);
        if (!routeFor(url)) { location.reload(); return; }
        const id = event.state?.siteNavigation?.id;
        // Native same-page anchors share an entry ID; keep them as anchor navigation.
        if (id === entry && routeFor(url) === current.path) {
            scrollToPage(url, [0, 0]);
            return;
        }
        if (!id) { location.reload(); return; }
        navigate(url, event.state.siteNavigation);
    });
    updateLinks();
    if (current.intro && !showIntro) document.dispatchEvent(new CustomEvent('site:pagechange'));
})();
