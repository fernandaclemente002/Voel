# Keep the Voel Supabase project active

The workflow at `.github/workflows/supabase-activity.yml` sends a read-only request to `public.categories` three times a day. The table has a public SELECT policy in `supabase/schema.sql`, so the request does not need the service-role key and does not modify catalog data.

## One-time setup

1. In GitHub, open **Settings → Secrets and variables → Actions → New repository secret**.
2. Add a repository secret named `SUPABASE_ANON_KEY` with the project's **anon public key** (the same public key used as `VITE_SUPABASE_ANON_KEY`). Never use a `service_role` or secret key.
3. Merge the pull request that adds this workflow.
4. Open **Actions → Supabase activity → Run workflow** once to verify the secret and database request. Future runs are scheduled for 08:17, 14:17, and 20:17 in São Paulo time.

The project URL is already set in the workflow and is not a credential. The response body is discarded; the run only reports whether the request succeeded.

## Limits to keep in mind

Supabase says that a few user database requests each day over the previous week are typically enough to avoid an inactivity pause, but this is not a guarantee. This workflow is an automated read-only request; verify its runs in GitHub Actions and pay attention to any Supabase warning email.

Because this repository is public, GitHub automatically disables scheduled workflows after 60 days without repository activity. If the schedule is disabled, it must be re-enabled in GitHub Actions. For uninterrupted availability without periodic maintenance, the supported option is a paid Supabase plan.
