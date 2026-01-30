 Conversion
# Millions of Local Trains - Environment-Aware Deployment

This guide explains how the project separates development, staging, and production builds while keeping all secrets outside of git. The goal is to keep the deployment story simple, repeatable, and cloud ready.

## Environment files

| Environment | File | How it is used | Example base URL |
| --- | --- | --- | --- |
| Development | `.env.development` | Loaded by `npm run dev` and `npm run build:development` through the `dotenv` CLI. | `http://localhost:3000` |
| Staging | `.env.staging` | Loaded by `npm run build:staging`. | `https://staging.api.million-trains.example` |
| Production | `.env.production` | Loaded by `npm run build` and `npm run build:production`. | `https://api.million-trains.example` |
| Reference | `.env.example` | Checked in template you copy when creating the real files. | Replace with your own host |

### RapidAPI configuration

Add the following keys to every environment file so the new API routes can proxy RapidAPI safely. Only `RAPIDAPI_KEY` is required; the rest let you override hosts or endpoints if RapidAPI changes URLs.

| Variable | Required? | Purpose / Default |
| --- | --- | --- |
| `RAPIDAPI_KEY` | ✅ | RapidAPI key issued for the IRCTC project. |
| `RAPIDAPI_HOST` | Optional | Defaults to `irctc1.p.rapidapi.com`. |
| `RAPIDAPI_LIVE_STATUS_URL` | Optional | Overrides `https://HOST/api/v1/liveTrainStatus`. |
| `RAPIDAPI_SEARCH_STATION_URL` | Optional | Overrides `https://HOST/api/v1/searchStation`. |
| `RAPIDAPI_TRAINS_BETWEEN_URL` | Optional | Overrides `https://HOST/api/v3/trainBetweenStations`. |
| `RAPIDAPI_SEARCH_TRAIN_URL` | Optional | Overrides `https://HOST/api/v1/searchTrain`. |
| `RAPIDAPI_TRAIN_SCHEDULE_URL` | Optional | Overrides `https://HOST/api/v1/getTrainSchedule`. |
| `RAPIDAPI_PNR_STATUS_URL` | Optional | Overrides `https://HOST/api/v3/getPNRStatus`. |
| `RAPIDAPI_SEAT_AVAILABILITY_URL` | Optional | Overrides `https://HOST/api/v1/checkSeatAvailability`. |
| `RAPIDAPI_SEAT_AVAILABILITY_V2_URL` | Optional | Overrides `https://HOST/api/v2/checkSeatAvailability`. |
| `RAPIDAPI_TRAIN_CLASSES_URL` | Optional | Overrides `https://HOST/api/v1/getTrainClasses`. |
| `RAPIDAPI_FARE_URL` | Optional | Overrides `https://HOST/api/v1/getFare`. |
| `RAPIDAPI_TRAINS_BY_STATION_URL` | Optional | Overrides `https://HOST/api/v1/getTrainsByStation`. |
| `RAPIDAPI_LIVE_STATION_URL` | Optional | Overrides `https://HOST/api/v1/getLiveStation`. |

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

### Routes command center

Visit `/routes` once the dev server is running to try every RapidAPI feature without exposing your key in the browser. Each widget talks to a dedicated Next.js API route:

- Search train, train-between-stations, and live status queries.
- Train schedule explorer, PNR status v3, seat availability (classic + V2).
- Train classes, fare breakup, trains-by-station, and live station boards.

Because the UI only calls local endpoints, you can rotate RapidAPI keys or host overrides without changing the frontend.

## Keeping secrets out of git

- `.gitignore` blocks every `.env*` file while explicitly allowing `.env.example`.
- `.env.example` documents every variable: `NEXT_PUBLIC_API_BASE_URL`, `DATABASE_URL`, Supabase keys, and `JWT_SECRET`.
- Developers pull secrets from the approved store, create their local `.env.development`, and never commit it. Auditing the repo shows that no sensitive strings are present.

## Why multi-environment builds help CI/CD

1. **Predictable rollouts**: staging builds mirror production settings, so regressions show up before the release train leaves the station.
2. **Guardrails for secrets**: separating configs prevents leaking production credentials into local laptops.
3. **Faster debugging**: when an issue appears, you can reproduce it with the matching environment file and command instead of toggling flags in code.

## Docker + CI/CD in this project

- **Deterministic builds**: containerizing the Next.js app (builder stage → runtime stage) fixes the Node version, OS packages, and Prisma binaries. Even though the current `Dockerfile` template is empty, the expected flow is `node:20-alpine` for the build stage, `npm run build`, copy `.next` into a lean `node:20-alpine` runtime, and expose port 3000. This locks dependencies so GitHub Actions, local devs, and AWS Fargate all run the same artifact.
- **Composable services**: `docker-compose.yml` is the placeholder for stitching the web container to Postgres or a RapidAPI mock. Running `docker compose up` locally simulates the same network topology we deploy to ECS task definitions or Azure Container Apps.
- **CI/CD as a promotion pipeline**: GitHub Actions builds the Docker image, tags it with the commit SHA, runs `npm run build:staging`, pushes to ECR/ACR, and only then deploys. Each job consumes the `.env.*` file that matches the target, so secrets never leak between stages.
- **Cloud-specific security considerations**: 
	- **AWS**: use OIDC-backed GitHub Actions roles to push to Amazon ECR, inject secrets from Parameter Store/Secrets Manager at task runtime, keep containers inside private subnets behind an ALB, and restrict outbound RapidAPI calls with egress rules.
	- **Azure**: authenticate into Azure Container Registry (ACR) with federated credentials, pull secrets from Key Vault via managed identity, enforce HTTPS-only on App Service/Container Apps, and wire Application Gateway WAF in front.
- **Runtime safeguards**: enable image vulnerability scanning (ECR scan on push or Microsoft Defender for Cloud), pin RapidAPI keys with least privilege, and enforce health probes so ALB/App Gateway drains bad tasks before routing traffic.

When you walk through this section in the video, highlight how Docker guarantees “it runs the same everywhere,” while CI/CD gates every promotion (commit → build → scan → deploy) to keep the AWS/Azure surface locked down.

## Video walkthrough checklist (3-5 minutes)

1. Show the `.env.*` files and how they map to each command.
2. Demonstrate where secrets live (GitHub Secrets, Parameter Store, or Key Vault) and how the pipeline reads them.
3. Run `npm run build:staging` and `npm run build:production`, pointing out the different API targets.
4. Share any misconfigurations you hit (missing env vars, typos) and how the separation made the fix obvious.
5. Explain the Docker + CI/CD flow above, then contrast AWS (ECR + ECS) vs. Azure (ACR + Container Apps) security knobs.
6. Tie in the QuickServe case study plan (below) so the “chain of trust” story is covered end-to-end.

Keep the narration focused on deployment clarity: no hardcoded secrets, minimal scripts, and confident releases.

## Case study: The Never-Ending Deployment Loop (QuickServe)

**Symptoms**
- Pipeline fails with “Environment variable not found” because the CI job builds the container before retrieving secrets or validating `.env`. The app bootstraps Prisma and RapidAPI clients immediately, so missing keys crash the process.
- “Port already in use” errors appear when the previous container still binds to `3000` on the EC2 host/AKS node. Without an orchestrator draining traffic, the new task cannot start.
- Old containers linger on AWS, so half the fleet runs version *N* and the rest *N-1*, producing inconsistent API responses.

**Root causes**
1. **Broken chain of trust**: code merges trigger a build, but there is no signed/tagged image artifact. The deployment phase rebuilds from source, so you cannot guarantee which commit is running.
2. **Secret handoff gap**: secrets live in GitHub but never injected into the runtime environment, causing mid-deployment crashes.
3. **Imperfect orchestration**: containers are launched manually (e.g., `docker run` on EC2) instead of relying on ECS/AKS rolling updates, so stale processes keep ports busy.

**Fix plan**
- **Containerization discipline**: build once inside CI using a multi-stage Dockerfile, tag the image (`quickserve-orders:<sha>`), and push to the registry. Every downstream environment pulls the same digest, ensuring parity.
- **Environment manifest**: define a required-variable contract (`.env.schema` or `dotenv-vault`). The CI job runs a “secret smoke test” before `docker build`, failing fast if AWS Parameter Store/Key Vault does not return a value.
- **Pipeline stages**: 
	1. **Source → Build**: lint/test, build Next.js, bake Docker image, run containerized integration tests.
	2. **Build → Deploy**: sign the image, push to ECR/ACR, promote via deployment jobs that call ECS blue/green or Azure Container Apps revisions.
	3. **Deploy → Runtime**: orchestrator performs rolling updates, health checks gate traffic shifts, and post-deploy jobs verify version headers (`x-quickserve-build`).
- **Operational hygiene**: use `docker compose down --remove-orphans` (local) or ECS `minimumHealthyPercent` to retire old tasks, and pin ports via load balancers instead of the host network.

**Video talking points**
- Walk through the failing pipeline log, point out where the environment variable check should live, and show the updated workflow diagram.
- Demonstrate how versioned images + orchestrated rollouts prevent the “port already in use” issue.
- Emphasize security: IAM roles for GitHub Actions (AWS) or federated credentials (Azure), secret stores, HTTPS-only ingress, and logging for every deployment handoff.

 Backend

This is our new Team project
In which we gonna make a website for checking  correct timing's for Trains.
 main
 main
