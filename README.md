# Last Day Vanda — Party Invitation Website

A responsive online invitation website with:
- Guest registration (name, optional email and phone)
- Public guest list (names only; contact details stay private)
- Admin login and dashboard
- Guest CSV export
- Share invitation link

## 1. Create the online database

1. Go to https://supabase.com and create a project.
2. Open **SQL Editor** in your project.
3. Open `supabase.sql`, copy all its contents, paste into SQL Editor, and click **Run**.
4. Open **Project Settings → API** (or **Data API**) and copy:
   - Project URL
   - Publishable key (or legacy `anon` key)
5. Open `config.js` and replace the two placeholder values:

```js
window.PARTY_CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-PUBLISHABLE-OR-ANON-KEY"
};
```

Use only the public publishable/anon key in the browser. **Never put the `service_role` key in this website.**

## 2. Create the admin login

1. In Supabase, open **Authentication → Users**.
2. Choose **Add user** and create the admin email/password.
3. Copy the user's UUID from the user list.
4. Go to **SQL Editor** and run this, replacing the example UUID:

```sql
insert into public.party_admins (user_id)
values ('YOUR-ADMIN-AUTH-USER-UUID');
```

5. Keep admin account creation restricted to yourself. Do not publish admin credentials.

## 3. Test locally

Because the site uses Supabase and browser modules, serve it through a local web server rather than opening the HTML file directly.

With Python installed, open PowerShell in this folder and run:

```powershell
py -m http.server 8000
```

Then visit http://localhost:8000

Test:
- Register a guest; their name should appear in the public guest list.
- Click **Admin**, sign in using the admin account, and check the dashboard.
- Export the guest list as CSV.
- Test the share button on your phone or browser.

## 4. Publish it online (GitHub Pages)

1. Create a GitHub account at https://github.com if needed.
2. Create a new **public** repository, for example `last-day-vanda`.
3. Upload `index.html`, `styles.css`, `app.js`, and `config.js`. You may also upload `README.md` and `supabase.sql`.
4. Open the repository **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select branch `main`, folder `/ (root)`, then click **Save**.
7. Wait for GitHub Pages to publish. Your invitation URL will look like:
   `https://YOUR-GITHUB-USERNAME.github.io/last-day-vanda/`
8. Open that URL and test a registration. Share that URL with your guests.

The Supabase publishable/anon key is designed for browser use when Row Level Security is enabled. The SQL policies in this project allow public inserts and public access only to the restricted name-only view; full contact details require an authenticated admin user whose UUID is in `party_admins`.

## Important customization

The date, time, and location currently say **To be announced / Details coming soon** because those details were not provided. Edit the three event-strip labels in `index.html` when you know them.

For a production event, consider adding a CAPTCHA or rate limiting to reduce spam registrations. The starter site intentionally does not expose email addresses or phone numbers in the public guest list.
