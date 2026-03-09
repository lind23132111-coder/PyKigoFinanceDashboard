import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * PyKigo Wiki Synchronizer
 * This script syncs files from the local `wiki/` directory to the GitHub Wiki repository (.wiki.git).
 */

const WIKI_REPO_URL = 'https://github.com/lind23132111-coder/PyKigoFinanceDashboard.wiki.git';
const LOCAL_WIKI_PATH = join(process.cwd(), 'wiki');
const TEMP_WIKI_DIR = join(process.cwd(), '.tmp_wiki_sync');

async function sync() {
    console.log('🚀 Starting Wiki Synchronization...');

    try {
        // 1. Cleanup old temp dir
        if (existsSync(TEMP_WIKI_DIR)) {
            console.log('🧹 Cleaning up old temporary directory...');
            rmSync(TEMP_WIKI_DIR, { recursive: true, force: true });
        }

        // 2. Clone the wiki repo
        console.log(`📥 Cloning Wiki repository from ${WIKI_REPO_URL}...`);
        execSync(`git clone ${WIKI_REPO_URL} "${TEMP_WIKI_DIR}"`, { stdio: 'inherit' });

        // 3. Clear destination (except .git) and copy files from local wiki/ to temp wiki dir
        console.log('📂 Mirroring local wiki/ folder to remote...');
        
        // Remove all files/folders in temp dir except .git
        const tempFiles = readdirSync(TEMP_WIKI_DIR);
        for (const file of tempFiles) {
            if (file === '.git') continue;
            const targetPath = join(TEMP_WIKI_DIR, file);
            rmSync(targetPath, { recursive: true, force: true });
        }

        const files = readdirSync(LOCAL_WIKI_PATH);
        for (const file of files) {
            const src = join(LOCAL_WIKI_PATH, file);
            const dst = join(TEMP_WIKI_DIR, file);

            if (existsSync(src) && !file.startsWith('.')) {
                if (readdirSync(LOCAL_WIKI_PATH, { withFileTypes: true }).find(f => f.name === file)?.isDirectory()) {
                    execSync(`cp -r "${src}" "${TEMP_WIKI_DIR}/"`);
                } else {
                    copyFileSync(src, dst);
                }
                console.log(`   ✅ Synced: ${file}`);
            }
        }

        // 4. Commit and Push
        console.log('📤 Committing and pushing changes to GitHub Wiki...');
        const gitCmds = [
            `cd "${TEMP_WIKI_DIR}"`,
            `git config user.name "pykao"`,
            `git config user.email "pykao@example.com"`,
            `git add .`,
            `git diff-index --quiet HEAD || git commit -m "docs: auto-sync from main repo via sync-wiki.mjs"`,
            `git push origin master`
        ].join(' && ');

        execSync(gitCmds, { stdio: 'inherit' });

        console.log('✨ Wiki Synchronization Complete!');
    } catch (error) {
        console.error('❌ Sync failed:', error.message);
        process.exit(1);
    } finally {
        // Cleanup
        if (existsSync(TEMP_WIKI_DIR)) {
            rmSync(TEMP_WIKI_DIR, { recursive: true, force: true });
        }
    }
}

sync();
