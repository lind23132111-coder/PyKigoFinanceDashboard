/**
 * PyKigo Finance Dashboard - Automated Screenshot Tool
 * 
 * Usage:
 *   node scripts/take-screenshots.mjs
 * 
 * Captures screenshots of all major pages in both mobile and desktop viewports.
 * Requires a running local dev server at http://localhost:3000
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = join(process.cwd(), 'screenshots');
const PASSWORD = process.env.SITE_PASSWORD || 'pydash2026';

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

async function login(page) {
    const loginPath = `${BASE_URL}/login`;
    await page.goto(loginPath, { waitUntil: 'networkidle' });

    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
        await passwordInput.fill(PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL(`${BASE_URL}/`, { timeout: 5000 }).catch(() => { });
    }
}

async function captureAll() {
    console.log('📸 Starting Screenshot Capture...');

    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const browser = await chromium.launch();

    for (const [viewportKey, viewport] of Object.entries(VIEWPORTS)) {
        console.log(`\n📱 Capturing ${viewportKey} viewport (${viewport.width}x${viewport.height})...`);
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();

        await login(page);

        for (const { path, label } of PAGES) {
            try {
                await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: 15000 });
                await page.waitForTimeout(1000);

                const filename = `${label}_${viewport.label}.png`;
                const filepath = join(OUTPUT_DIR, filename);
                await page.screenshot({ path: filepath, fullPage: false });
                console.log(`   ✅ ${filename}`);
            } catch (err) {
                console.warn(`   ⚠️  Failed to capture ${label}: ${err.message}`);
            }
        }

        await context.close();
    }

    await browser.close();
    console.log(`\n✨ Done! Screenshots saved to: ${OUTPUT_DIR}/`);
}

captureAll().catch((err) => {
    console.error('❌ Screenshot capture failed:', err);
    process.exit(1);
});
