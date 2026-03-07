/**
 * PyKigo Finance Dashboard - Automated Screenshot Tool
 * 
 * ⚠️ PRIVACY POLICY:
 *   Screenshots MUST use DEMO MODE (mock data) to prevent accidental
 *   exposure of real asset data in PR documentation.
 * 
 * HOW IT WORKS:
 *   This script starts a local dev server with NEXT_PUBLIC_DEMO_MODE=true,
 *   takes screenshots of the new UI (your local code), then shuts the server down.
 *   The UI reflects the LATEST code, the data is always MOCK.
 * 
 * Usage:
 *   node scripts/take-screenshots.mjs
 * 
 * Requirements:
 *   - npm packages installed (npm install)
 *   - playwright installed (npm install --save-dev playwright)
 *   - npx playwright install chromium
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

const OUTPUT_DIR = join(process.cwd(), 'screenshots');
const LOCAL_URL = 'http://localhost:3001'; // Use 3001 to avoid conflict with main dev server
const DEMO_ENV = { ...process.env, NEXT_PUBLIC_DEMO_MODE: 'true', PORT: '3001' };
const STARTUP_WAIT_MS = 8000;

const VIEWPORTS = {
    mobile: { width: 390, height: 844, label: 'mobile_390' },
    desktop: { width: 1280, height: 800, label: 'desktop_1280' },
};

const PAGES = [
    { path: '/', label: 'dashboard' },
    { path: '/wizard', label: 'wizard' },
    { path: '/goals', label: 'goals' },
    { path: '/report', label: 'report' },
    { path: '/planning', label: 'planning' },
];

/**
 * Start a demo dev server on port 3001
 */
function startDemoServer() {
    console.log('🚀 Starting local Demo server (NEXT_PUBLIC_DEMO_MODE=true) on port 3001...');
    const server = spawn('npm', ['run', 'dev'], {
        env: DEMO_ENV,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
    });

    server.stderr.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('error') || msg.includes('Error')) {
            console.warn('Server stderr:', msg.trim());
        }
    });

    return server;
}

/**
 * Wait for the local server to be ready
 */
async function waitForServer(url, maxWaitMs = 30000) {
    const { default: fetch } = await import('node-fetch').catch(() => ({ default: global.fetch }));
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
            if (res.ok || res.status < 500) return true;
        } catch (_) { /* still starting */ }
        await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error(`Server did not respond at ${url} within ${maxWaitMs}ms`);
}

async function captureAll() {
    console.log('📸 Screenshot Capture — using DEMO MODE (Mock Data)\n');

    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Start the demo dev server
    const server = startDemoServer();
    try {
        await waitForServer(LOCAL_URL);
        console.log('✅ Demo server ready!\n');

        const browser = await chromium.launch();

        for (const [viewportKey, viewport] of Object.entries(VIEWPORTS)) {
            console.log(`📱 Capturing ${viewportKey} (${viewport.width}x${viewport.height})...`);
            const context = await browser.newContext({ viewport });
            const page = await context.newPage();

            for (const { path, label } of PAGES) {
                try {
                    await page.goto(`${LOCAL_URL}${path}`, { waitUntil: 'networkidle', timeout: 20000 });
                    await page.waitForTimeout(1500);

                    const filename = `${label}_${viewport.label}.png`;
                    await page.screenshot({ path: join(OUTPUT_DIR, filename), fullPage: false });
                    console.log(`   ✅ ${filename}`);
                } catch (err) {
                    console.warn(`   ⚠️  Failed: ${label} — ${err.message}`);
                }
            }

            await context.close();
        }

        await browser.close();
        console.log(`\n✨ Done! All screenshots use mock data and are safe for PRs.`);
        console.log(`   Saved to: ${OUTPUT_DIR}/`);
    } finally {
        server.kill();
        console.log('🛑 Demo server stopped.');
    }
}

captureAll().catch((err) => {
    console.error('❌ Screenshot capture failed:', err);
    process.exit(1);
});
