# Database Sync Instructions

## Issue
The production database is missing the `MeetingActivity` model, causing 500 errors when creating meetings.

## Quick Fix (Already Applied)
- Temporarily disabled activity logging to allow meeting creation
- Meeting creation and deletion now work without errors

## Permanent Solution
To enable activity logging, you need to sync the database schema:

### Option 1: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Run database push in production environment
vercel env pull .env.production
npx prisma db push --schema=./prisma/schema.prisma
```

### Option 2: Manual Database Update
If you have direct access to your Supabase database:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run this SQL to create the missing table:

```sql
-- Create MeetingAction enum
CREATE TYPE "MeetingAction" AS ENUM ('CREATED', 'DELETED', 'UPDATED');

-- Create MeetingActivity table
CREATE TABLE "MeetingActivity" (
    "id" TEXT NOT NULL,
    "action" "MeetingAction" NOT NULL,
    "meetingTitle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedById" TEXT NOT NULL,
    "originalCreatorId" TEXT,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "MeetingActivity_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "MeetingActivity" ADD CONSTRAINT "MeetingActivity_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MeetingActivity" ADD CONSTRAINT "MeetingActivity_originalCreatorId_fkey" FOREIGN KEY ("originalCreatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MeetingActivity" ADD CONSTRAINT "MeetingActivity_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Option 3: Reset and Recreate (Data Loss Warning)
If you don't mind losing existing data:

```bash
npx prisma migrate reset --force
npx prisma db push
```

## After Database Sync
Once the database is properly synced, you can re-enable activity logging by:

1. Uncommenting the activity logging code in:
   - `src/app/api/workspaces/[slug]/meetings/route.ts`
   - `src/app/api/workspaces/[slug]/meetings/[meetingId]/route.ts`
   - `src/app/api/workspaces/[slug]/activities/route.ts`

2. Redeploy the application

## Current Status
✅ Meeting creation works (without activity logging)
✅ Meeting deletion works (without activity logging)  
✅ Mobile responsive design
✅ Direct Google Meet links
✅ Timezone fixes
⏳ Activity logging (pending database sync)