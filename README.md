# Public heart-rate dashboard

This GitHub Pages dashboard displays only the latest shared reading for each username.

## Enable the read-only endpoint

In Supabase SQL Editor, run [`public_dashboard.sql`](public_dashboard.sql). It creates a narrowly scoped public function returning only `username`, `bpm`, and `measured_at`; it cannot return the private history table, user IDs, or installation IDs.
