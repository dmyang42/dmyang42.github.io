// Run with Playwright available on NODE_PATH and a local server at SITE_URL.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.SITE_URL || 'http://127.0.0.1:8765';
const routes = ['index.html', 'research.html', 'personal.html', 'photo.html'];

(async () => {
    const browser = await chromium.launch({headless: true, channel: 'chrome'});
    const errors = [];
    async function setup(options = {}) {
        const page = await browser.newPage(options);
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => new URL(route.request().url()).origin === base
            ? route.continue() : route.abort());
        return page;
    }
    async function settled(page, path) {
        await page.waitForFunction(path => location.pathname.endsWith(path)
            && !document.getElementById('wrapper').hasAttribute('aria-busy'), path);
        assert.equal(await page.locator('#main').count(), 1);
        assert.equal(await page.locator('#nav .active a, #navPanel .active a').count(), 1);
    }
    async function tab(page, path, mobile = false) {
        if (mobile) {
            await page.locator('#navPanelToggle').click();
            assert.equal(await page.locator('#wrapper').evaluate(el => getComputedStyle(el).opacity), '1',
                'Opening the mobile menu does not fade the page or background');
        }
        await page.locator((mobile ? '#navPanel' : '#nav') + ' .links a[href="' + path + '"]').click();
        await settled(page, path);
    }
    async function geometry(page) {
        return page.evaluate(() => {
            const main = document.getElementById('main');
            const css = getComputedStyle(main);
            return {width: Math.round(main.getBoundingClientRect().width), zoom: css.zoom,
                font: css.fontFamily, overflow: document.documentElement.scrollWidth > innerWidth + 1};
        });
    }
    async function shell(page) {
        return page.evaluate(() => ({
            headerTop: Math.round(document.querySelector('#header').getBoundingClientRect().top),
            headerBottom: Math.round(document.querySelector('#header').getBoundingClientRect().bottom),
            navTop: Math.round(document.querySelector('#nav').getBoundingClientRect().top),
            mainTop: Math.round(document.querySelector('#main').getBoundingClientRect().top),
            viewport: document.querySelector('meta[name="viewport"]').content,
            opacity: getComputedStyle(document.querySelector('#wrapper')).opacity
        }));
    }

    try {
        // Every section can be the first document. Its appearance must be identical
        // when reached via navigation, including after leaving the CV stylesheet.
        const expected = {};
        let expectedShell;
        for (const route of routes) {
            const page = await setup({viewport: {width: 1440, height: 1000}});
            await page.goto(base + '/' + route);
            expected[route] = await geometry(page);
            if (route === 'research.html') expectedShell = await shell(page);
            await page.close();
        }
        for (const start of routes) {
            const page = await setup({viewport: {width: 1440, height: 1000}});
            let documents = 0;
            const requests = [];
            page.on('request', request => {
                if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++;
                requests.push(new URL(request.url()).pathname);
            });
            await page.goto(base + '/' + start);
            await page.evaluate(() => {
                window.originalBackground = document.querySelector('.bg');
                window.originalNav = document.querySelector('#nav');
                window.originalHeader = document.querySelector('#header');
                window.sharedStyleChanges = [];
                const observer = new MutationObserver(mutations => window.sharedStyleChanges.push(...mutations.map(m => m.attributeName)));
                for (const href of ['assets/css/main.css', 'assets/css/site-navigation.css']) {
                    observer.observe(document.querySelector('link[href="' + href + '"]'), {attributes: true});
                }
            });
            for (const route of routes.filter(route => route !== start)) {
                await tab(page, route);
                assert.deepEqual(await geometry(page), expected[route], start + ' → ' + route);
                assert(await page.evaluate(() => window.originalBackground === document.querySelector('.bg')));
                assert.deepEqual(await shell(page), expectedShell, 'Shared header/navigation geometry: ' + start + ' → ' + route);
                assert(await page.evaluate(() => window.originalNav === document.querySelector('#nav')
                    && window.originalHeader === document.querySelector('#header')));
            }
            await tab(page, 'index.html');
            assert.equal(await page.locator('#intro').count(), 0, 'Home tab does not reinsert the welcome screen');
            assert.deepEqual(await shell(page), expectedShell, 'Returning Home aligns with the other sections');
            const toggle = page.locator('#timeline-toggle');
            await toggle.click();
            assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
            await tab(page, 'research.html');
            await page.evaluate(() => scrollTo(0, 900));
            await page.waitForTimeout(100);
            // Programmatic click avoids Playwright scrolling the nav into view.
            await page.locator('#nav a[href="personal.html"]').evaluate(link => link.click());
            await settled(page, 'personal.html');
            await page.goBack();
            await settled(page, 'research.html');
            assert(Math.abs(await page.evaluate(() => scrollY) - 900) < 3, 'Back restores scroll');
            await page.goForward();
            await settled(page, 'personal.html');
            await page.evaluate(() => {
                window.originalPDF = document.querySelector('.cv-viewer iframe');
                window.originalPDFWindow = window.originalPDF.contentWindow;
            });
            const pdfRequests = requests.filter(path => path === '/CV.pdf').length;
            await tab(page, 'photo.html');
            await tab(page, 'personal.html');
            assert(await page.evaluate(() => window.originalPDF === document.querySelector('.cv-viewer iframe')
                && window.originalPDFWindow === window.originalPDF.contentWindow));
            assert.equal(requests.filter(path => path === '/CV.pdf').length, pdfRequests, 'PDF is not requested again');
            await tab(page, 'index.html');
            assert.equal(await toggle.getAttribute('aria-expanded'), 'true', 'Timeline keeps expanded state');
            assert.equal(documents, 1, 'Only the initial document navigates');
            assert.deepEqual(await page.evaluate(() => window.sharedStyleChanges), [], 'Shared stylesheets are never toggled');
            for (const route of routes) assert(requests.filter(path => path === '/' + route).length <= 1, route + ' fetched once');
            console.log('PASS desktop entry:', start, '(one document; persistent background, PDF, timeline; history and styles)');
            await page.close();
        }

        const mobile = await setup({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
        await mobile.goto(base + '/research.html');
        const mobileShell = await shell(mobile);
        await mobile.evaluate(() => { window.mobileSentinel = true; });
        for (const route of ['personal.html', 'photo.html', 'index.html', 'research.html']) {
            await tab(mobile, route, true);
            await mobile.waitForTimeout(650); // Catch the template's former delayed redirect.
            assert(await mobile.evaluate(() => window.mobileSentinel));
            assert(!(await mobile.locator('body').getAttribute('class')).includes('is-navPanel-visible'));
            assert.equal((await geometry(mobile)).overflow, false);
            assert.deepEqual(await shell(mobile), mobileShell, 'Mobile shell remains stable: ' + route);
            if (route === 'index.html') assert.equal(await mobile.locator('#intro').count(), 0);
        }
        console.log('PASS mobile menu: stable opacity/viewport/header, compact Home, no delayed reload or overflow');
        await mobile.close();

        const landing = await setup({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
        await landing.goto(base + '/index.html');
        assert.equal(await landing.locator('#intro').count(), 1, 'Direct first visit keeps the welcome screen');
        await tab(landing, 'index.html', true);
        assert.equal(await landing.locator('#intro').count(), 0, 'Home clicked on the landing screen also becomes compact');
        await landing.goBack();
        await landing.waitForFunction(() => document.getElementById('intro') !== null);
        await landing.goForward();
        await landing.waitForFunction(() => document.getElementById('intro') === null);
        await landing.reload();
        assert.equal(await landing.locator('#intro').count(), 0, 'Refresh keeps the compact history entry');
        await landing.close();
        console.log('PASS welcome-screen versus Home-tab history and refresh');

        const rapid = await setup();
        await rapid.goto(base + '/research.html');
        await rapid.route('**/personal.html', async route => {
            await new Promise(resolve => setTimeout(resolve, 400));
            await route.continue();
        });
        await rapid.locator('#nav a[href="personal.html"]').evaluate(link => link.click());
        await rapid.locator('#nav a[href="photo.html"]').evaluate(link => link.click());
        await settled(rapid, 'photo.html');
        await rapid.waitForTimeout(650);
        assert(rapid.url().endsWith('/photo.html'), 'Latest click wins');
        await rapid.close();
        console.log('PASS rapid clicks: slow response cannot replace the latest section');

        const fallback = await setup();
        await fallback.goto(base + '/research.html');
        await fallback.route('**/personal.html', route => route.request().resourceType() === 'fetch'
            ? route.abort() : route.continue());
        await tab(fallback, 'personal.html');
        assert.equal(await fallback.title(), 'Daming Yang - CV');
        await fallback.reload();
        assert.equal(await fallback.locator('.cv-viewer iframe').count(), 1);
        await fallback.close();
        console.log('PASS failed fetch fallback and direct refresh');

        const noJS = await setup({javaScriptEnabled: false});
        await noJS.goto(base + '/research.html');
        await noJS.locator('#nav a[href="index.html"]').click();
        assert.equal(await noJS.title(), 'Daming Yang - Home');
        assert.equal(await noJS.locator('#news-timeline > li:visible').count(), 11);
        await noJS.close();
        assert.deepEqual(errors, [], 'No page JavaScript errors');
        console.log('PASS no-JavaScript navigation and readable timeline; no JavaScript errors');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
