# Millions of Local Trains - Environment-Aware Deployment

This guide explains how the project separates development, staging, and production builds while keeping all secrets outside of git. The goal is to keep the deployment story simple, repeatable, and cloud ready.

## Environment files

| Environment | File | How it is used | Example base URL |
| --- | --- | --- | --- |
| Development | `.env.development` | Loaded by `npm run dev` and `npm run build:development` through the `dotenv` CLI. | `http://localhost:3000` |
| Staging | `.env.staging` | Loaded by `npm run build:staging`. | `https://staging.api.million-trains.example` |
| Production | `.env.production` | Loaded by `npm run build` and `npm run build:production`. | `https://api.million-trains.example` |
| Reference | `.env.example` | Checked in template you copy when creating the real files. | Replace with your own host |

All real `.env*` files are gitignored. Copy the example file, adjust the values, and store the filled versions only in your secret manager or deployment platform.

## Secure secret management

- **GitHub Actions**: store secrets like `DATABASE_URL` or Supabase keys inside *Repository Settings → Secrets and variables*. During the workflow, export them before running `npm run build:staging` or `npm run build:production`.
- **AWS Systems Manager Parameter Store**: keep long lived credentials there, and inject them into the build container with `aws ssm get-parameter --with-decryption`. Feed the values into the environment when running the Next.js commands.
- **Azure Key Vault**: create secrets for each environment (e.g., `train-tracker--staging--database-url`). Use a managed identity in your pipeline to fetch them at build time.
- Never write keys inside source files. The pages use `process.env.NEXT_PUBLIC_API_BASE_URL`, so whichever environment file or secret store defines it will take effect without code changes.

## Build and verification commands

```bash
npm run dev                # development server with .env.development
npm run build:development  # local production build against dev services
npm run build:staging      # staging build (CI/CD recommended)
npm run build:production   # final build for release
npm run build              # alias for production build
```

After each build, run `npx next start` (or deploy to your platform) with the same environment variables present at runtime. CI pipelines should fail fast if any variable is missing, so wire up your workflow to check for required keys before running the commands.

## Keeping secrets out of git

- `.gitignore` blocks every `.env*` file while explicitly allowing `.env.example`.
- `.env.example` documents every variable: `NEXT_PUBLIC_API_BASE_URL`, `DATABASE_URL`, Supabase keys, and `JWT_SECRET`.
- Developers pull secrets from the approved store, create their local `.env.development`, and never commit it. Auditing the repo shows that no sensitive strings are present.

## Why multi-environment builds help CI/CD

1. **Predictable rollouts**: staging builds mirror production settings, so regressions show up before the release train leaves the station.
2. **Guardrails for secrets**: separating configs prevents leaking production credentials into local laptops.
3. **Faster debugging**: when an issue appears, you can reproduce it with the matching environment file and command instead of toggling flags in code.

## Video walkthrough checklist (3-5 minutes)

1. Show the `.env.*` files and how they map to each command.
2. Demonstrate where secrets live (GitHub Secrets, Parameter Store, or Key Vault) and how the pipeline reads them.
3. Run `npm run build:staging` and `npm run build:production`, pointing out the different API targets.
4. Share any misconfigurations you hit (missing env vars, typos) and how the separation made the fix obvious.

Keep the narration focused on deployment clarity: no hardcoded secrets, minimal scripts, and confident releases.
