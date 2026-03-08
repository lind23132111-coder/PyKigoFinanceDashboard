# Enhancement: Separate Development and Production Environments

## Problem Statement
Currently, the local development environment (`npm run dev`) and the production site share the same Supabase project and database. This leads to:
1. **Data Pollution**: Automated tests (like Playwright/Subagent) and local manual tests create "junk" data in the production `assets` and `history` tables.
2. **Risk of Accidental Deletion**: Developers might accidentally delete real user data while cleaning up test records.
3. **UI Sync Issues**: Changes to shared state are reflected across all environments immediately.

## Proposed Solution
1. **Setup Secondary Supabase Project**: Create a new Supabase project specifically for development/staging.
2. **Environment Variable Management**:
   - Use `.env.local` for local development (pointing to dev DB).
   - Use Vercel Environment Variables for production (pointing to prod DB).
3. **Branching/Preview Environments**: Implement Supabase branching if using the Pro plan, or use separate schemas.

## Priority: High (To protect production data integrity)
