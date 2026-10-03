# Google OAuth setup

The storefront uses Supabase Auth with Google OAuth and a server-side PKCE
callback. The app only needs `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; keep the Google client secret in the
Supabase dashboard, never in a `NEXT_PUBLIC_` variable or browser code.

## Google Cloud

1. Create or select a Google Cloud project and open Google Auth Platform.
2. Configure the consent screen audience and app branding. If the app is in
   testing mode, add the Google accounts that should be allowed to test it.
3. In Data Access, allow the `openid`, email, and profile scopes.
4. Create an OAuth client ID with application type **Web application**.
5. Add the storefront origins under **Authorized JavaScript origins**:
   `http://localhost:3000` for development and the production origin when
   deployed (for example `https://shop.example.com`).
6. Add the callback URL shown on the Supabase Google provider setup screen to
   **Authorized redirect URIs**. It is usually
   `https://<project-ref>.supabase.co/auth/v1/callback`. This is the Supabase
   callback, not the storefront's `/auth/callback` route.
7. Copy the OAuth client ID and client secret for the Supabase configuration.

## Supabase dashboard

1. Open **Authentication → Sign In / Providers → Google** and enable Google.
2. Paste the Google OAuth client ID and secret, then save.
3. In **Authentication → Settings**, enable new user signups if this storefront
   should allow first-time Google users to create accounts.
4. Open **Authentication → URL Configuration**. Set the Site URL to
   `http://localhost:3000` for local development, and add
   `http://localhost:3000/auth/callback` to the redirect URL allow list.
5. Before production, set the Site URL to the production origin and add the
   exact production callback, such as
   `https://shop.example.com/auth/callback`. Keep the localhost callback only
   for development.

## Local app configuration

Set these values in `Webstore/.env` (the URL and publishable key are already
present in this workspace):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Restart the storefront with `pnpm --filter @webstore/storefront dev`, then open
`http://localhost:3000/login` and choose **Continue with Google**. After
consent, the app returns to `/account`; sign out is available there.

Google OAuth creates a Supabase Auth user. It does not by itself guarantee a
matching `public.profiles` row; confirm that the existing database signup
trigger or a trusted provisioning flow creates customer profiles before the
app depends on profile data.
