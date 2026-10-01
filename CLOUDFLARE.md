# Cloudflare Workers deployment

This Nuxt app builds as a Cloudflare Worker. `wrangler.jsonc` serves the Nuxt
server bundle and public assets on `dvfdne.org` and `www.dvfdne.org`.

## Connect GitHub

1. In Cloudflare **Workers & Pages**, create a Worker from the
   `ComputerComa/DVFD_Website` GitHub repository, or connect the repository to
   an existing Worker under **Settings > Builds**. Name the Worker
   `dvfd-website` to match `wrangler.jsonc`.
2. Select `main` as the production branch and the repository root as the root
   directory. Set the build command to `npm run build` and the deploy command
   to `npx wrangler deploy`.
3. Under **Settings > Build > Build Variables and Secrets**, set
   `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_KEY` for the Nuxt build.
   Use the project URL and publishable key, never a secret or service-role key.
4. Under **Settings > Variables and Secrets**, set the same two variables for
   Worker runtime. Configure separate values for previews if previews need a
   different Supabase project.

## Domain cutover

The two hostnames currently belong to a Cloudflare Pages project. The custom
domains in `wrangler.jsonc` make the Worker the origin for both hostnames when
deployed. Before the first production deployment with these routes, remove the
hostnames from the Pages project's **Custom domains** and clear any conflicting
DNS CNAME records. Cloudflare then creates the Worker custom-domain DNS records
and certificates during deployment. Check both hostnames and admin sign-in after
cutover.

For a local, non-publishing check, run `npm run build` followed by
`npx wrangler deploy --dry-run`.
