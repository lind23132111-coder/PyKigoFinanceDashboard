import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { deleteSnapshot } from './src/app/actions/wizard';

async function forceDelete() {
    const snapshotId = '15a9551a-0775-49a8-b565-f347e85e5d75';
    console.log('Force deleting snapshot:', snapshotId);
    try {
        const result = await deleteSnapshot(snapshotId);
        console.log('Deletion result:', result);
    } catch (err) {
        console.error('Deletion failed:', err);
    }
}

forceDelete();
