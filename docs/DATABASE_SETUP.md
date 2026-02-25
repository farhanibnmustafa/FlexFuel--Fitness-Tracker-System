# Database Setup Guide

The 500 errors you're seeing are likely because the database tables haven't been created yet. Follow these steps to set up the database:

## Step 1: Run the Database Schema

You need to execute the SQL schema file to create the required tables. The schema file is located at:
- `supabase-schema.sql`

### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" to execute the SQL

### Option B: Using psql (PostgreSQL CLI)
```bash
psql -h your-supabase-host -U postgres -d postgres -f supabase-schema.sql
```

### Option C: Using Supabase CLI
```bash
supabase db reset
# or
supabase migration up
```

## Step 2: Verify Tables Created

After running the schema, verify these tables exist:
- `body_measurements`
- `strength_records`
- `water_intake`
- `progress_photos`

## Step 3: Restart Your Server

After creating the tables, restart your Node.js server:
```bash
node server.js
# or
npm start
```

## Troubleshooting

If you still see errors after running the schema:

1. **Check table names**: Make sure the table names match exactly (case-sensitive in some databases)
2. **Check permissions**: Ensure your database user has CREATE and INSERT permissions
3. **Check connection**: Verify your Supabase connection settings in `supabaseClient.js`
4. **Check logs**: Look at the server console for detailed error messages

## Required Tables Summary

The following tables are needed for the goals features:

1. **body_measurements** - Stores user body measurements over time
2. **strength_records** - Stores personal records (PRs) for exercises
3. **water_intake** - Stores daily water intake tracking
4. **progress_photos** - Stores progress photos (ready for future implementation)

All tables are defined in `supabase-schema.sql` starting around line 207.

