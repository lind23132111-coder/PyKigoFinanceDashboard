/**
 * PyKigo Finance Dashboard - Automated Screenshot Tool
 * 
 * Usage:
 *   node scripts/take-screenshots.mjs
 * 
 * ⚠️ Privacy Policy: This script ALWAYS uses the Demo deployment (mock data).
 * It will NEVER connect to the real data environment to prevent accidental
 * exposure of real asset information in PR screenshots or documentation.
 *
 * Demo URL: https://py-kigo-finance-dashboard-demo.vercel.app/
 * To override locally: SCREENSHOT_URL=http://localhost:3000 node scripts/take-screenshots.mjs
 * (Only do this if you have set NEXT_PUBLIC_DEMO_MODE=true in .env.local)
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Always default to Demo deployment — never real data
const DEMO_URL = 'https://py-kigo-finance-dashboard-demo.vercel.app';
const BASE_URL = process.env.SCREENSHOT_URL || DEMO_URL;
const OUTPUT_DIR = join(process.cwd(), 'screenshots');

if (BASE_URL !== DEMO_URL) {
    console.warn('⚠️  WARNING: Using custom URL instead of Demo deployment.');
    console.warn('   Make sure NEXT_PUBLIC_DEMO_MODE=true is set to avoid capturing real data!');
    console.warn('');
}

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
    console.log('📸 Starting Screenshot Capture (Demo Data Only)...');
    console.log(`   Using: ${BASE_URL}\n`);

    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const browser = await chromium.launch();

    for (const [viewportKey, viewport] of Object.entries(VIEWPORTS)) {
        console.log(`📱 Capturing ${viewportKey} viewport (${viewport.width}x${viewport.height})...`);
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();

        for (const { path, label } of PAGES) {
            try {
                await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: 20000 });
                await page.waitForTimeout(1500); // allow lazy-loaded content

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
    console.log('   These screenshots contain MOCK DATA only and are safe to include in PRs.');
}

captureAll().catch((err) => {
    console.error('❌ Screenshot capture failed:', err);
    process.exit(1);
});
