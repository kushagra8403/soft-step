# Customer sign-in, order emails and the owner's order list

This is a one-time setup, about 30 minutes. It uses free plans only: Supabase (accounts and saved orders), Gmail (sends the emails) and Netlify (runs the small server code). Nothing here changes how checkout works today: the order still goes to WhatsApp and is paid by UPI. Signing in only adds a saved order and emails.

**What customers get:** an optional "Sign in" in the menu, an email when the order is received, and an email each time the owner changes the status. **What the owner gets:** sign in with the owner email, open the menu, tap "My account", then "Manage orders". Change the status, add a note such as the courier tracking number, and tap "Update & email".

> The price and stock editor (`#admin`) still works only on the claude.ai copy. The order list works on the Netlify site.

## Step 1. A Gmail address for the shop
Use `softsteps.home@gmail.com` or any Gmail you control.
1. Open https://myaccount.google.com/security and turn on **2-Step Verification**.
2. Open https://myaccount.google.com/apppasswords, name it "Soft Steps", press **Create**.
3. Copy the 16-letter password. You will paste it twice below.

## Step 2. Supabase (free)
1. Sign up at https://supabase.com and press **New project**. Name: `soft-steps`. Choose a database password (save it) and a region near India (Mumbai).
2. Left menu **SQL Editor**, **New query**, paste the whole of `supabase/schema.sql` from this repo, press **Run**. It says "Success".
3. Left menu **Project Settings**, **API**. Keep this page open. You need: Project URL, the `anon public` key and the `service_role` key (secret; never share it).
4. Left menu **Authentication**, **URL Configuration**. Set **Site URL** to `https://softstepshome.netlify.app` and add the same address under **Redirect URLs**.
5. **Authentication**, **Emails** (or **SMTP Settings**): turn on **Custom SMTP** so sign-up emails do not hit Supabase's tiny free limit. Host `smtp.gmail.com`, port `465`, username = the Gmail address, password = the 16-letter app password, sender = the same Gmail address, sender name `Soft Steps`.
6. **Authentication**, **Sign In / Providers**, **Email**: keep **Confirm email** switched on. This matters: the owner check relies on a confirmed email address.

## Step 3. Netlify: deploy from GitHub instead of drag-and-drop
Drag-and-drop uploads cannot run server code, so the site must be built from the repo once.
1. In Netlify open the site, **Site configuration**, **Build & deploy**, **Continuous deployment**, **Link repository**, choose GitHub and `kushagra8403/soft-step`, branch `main`. Leave build settings as they are (the repo's `netlify.toml` has them).
2. **Site configuration**, **Environment variables**, add these six (Add a variable, one at a time):

| Name | Value |
|---|---|
| `SUPABASE_URL` | Project URL from Step 2.3 |
| `SUPABASE_ANON_KEY` | the `anon public` key |
| `SUPABASE_SERVICE_KEY` | the `service_role` key |
| `GMAIL_USER` | the shop Gmail address |
| `GMAIL_APP_PASSWORD` | the 16-letter app password (no spaces) |
| `ADMIN_EMAILS` | the owner's email, for example `owner@gmail.com`. Several can be separated by commas |

3. **Deploys**, **Trigger deploy**, **Deploy site**. When it is "Published", open the site menu: a **Sign in** link appears. If it does not, one of the variables is missing or misspelt.

## Step 4. Try it
1. Menu, **Sign in**, **Create account** with your own email. Confirm using the email Supabase sends, then sign in.
2. Add a mat to the cart and place a test order. You should receive "We got your order SS-XXXX" and the owner copy goes to the first `ADMIN_EMAILS` address.
3. Sign in with the owner email, menu, **My account**, **Manage orders**, set **Shipped**, add a note, tap **Update & email**. The customer email arrives.

## Good to know
- Gmail allows about 500 emails a day, far more than needed.
- The shop never shows the service key or the Gmail password to the browser; they live only in Netlify.
- Orders are stored in Supabase (free plan, 500 MB). Customers can only see their own orders; the order table is closed to the public key.
- The order total is recalculated on the server from the items. Prices are still taken from the page, so the owner should keep checking the amount paid on UPI before choosing "Payment confirmed".
- If a customer does not sign in, checkout works exactly as before (no email is sent).
- Run `node netlify/tests/functions.cjs` to test the server code without any accounts.
