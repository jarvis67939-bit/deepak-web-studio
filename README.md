# Deepak Web Studio — Showcase + Admin Starter

## What this includes
- Public demo listing
- Search + category filtering
- Live Demo buttons
- Public feedback form + admin approval
- Admin website add/edit/delete
- Admin settings for WhatsApp number
- Theme switching without changing the website URL
- About section image/text controls
- Supabase-ready architecture
- LocalStorage fallback so the design can be previewed before Supabase setup

## Important
For real public/customer syncing across devices, connect Supabase.

1. Create a Supabase project.
2. Open SQL Editor and run `supabase-schema.sql`.
3. Create an Auth user for yourself in Authentication > Users.
4. Open `app.js` and replace:
   YOUR_SUPABASE_URL
   YOUR_SUPABASE_ANON_KEY
5. Upload the files to GitHub and connect that repo to Netlify.
6. Open `/admin.html` and log in with your Supabase admin user.

## Images
The starter admin accepts image URLs. For uploaded business photos, create a public Supabase Storage bucket called `site-images`, upload an image, copy its public URL, and paste that URL into the admin field.

## URL
Keep `index.html` at the repository root. Netlify will keep the same site URL when you push updates to GitHub.

## Production security
The included authenticated policies are intentionally simple for a starter. Before taking real client data, restrict admin policies to your own authenticated user ID and add stronger validation/rate limiting.
