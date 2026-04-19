# StockFlow K8s

StockFlow K8s is a production-style inventory management deployment repository.
It contains:

- A React + TypeScript frontend (Vite)
- Supabase integration for auth and data
- Kubernetes manifests for app deployment and ingress
- Monitoring configuration (Prometheus + Grafana)
- Terraform infrastructure provisioning for AWS EC2-based Kubernetes nodes
- CI workflow for Docker image build and push

## 1. Project Goals

This repository is designed to help you:

- Build and run StockFlow frontend locally
- Package the app as a Docker image
- Deploy to Kubernetes with ingress-based access
- Monitor application and node health with Prometheus/Grafana
- Provision infrastructure on AWS using Terraform

## 2. Tech Stack

### Application

- React 18
- TypeScript 5
- Vite 5
- Tailwind CSS + shadcn/ui
- Supabase JavaScript client
- TanStack React Query
- React Router

### Platform / Ops

- Docker (multi-stage image build)
- NGINX (serving frontend + runtime env injection)
- Kubernetes (Deployment, Service, Ingress, HPA)
- Prometheus Operator stack (kube-prometheus-stack)
- Terraform (AWS provider)
- GitHub Actions (image build/push)

## 3. Repository Layout

```text
stockFlow_k8s/
  .github/workflows/
    ci.yml
  frontend/
    src/
    Dockerfile
    docker-entrypoint.sh
    nginx.conf
    package.json
  k8s/
    namespace.yaml
    deployment.yaml
    service.yaml
    ingress.yaml
    hpa.yaml
    secret.yml
    configmap.yaml
    monitoring/
      prometheus-values.yaml
      grafana-values.yaml
      stockflow-servicemonitor.yaml
      stockflow-prometheusrule.yaml
  scripts/
    common.sh
    master_only.sh
  terraform/
    provider.tf
    variables.tf
    main.tf
    vpc.tf
    security.tf
    outputs.tf
    terraform.tfvars
  setup.md
  projectsetup.md
  LICENSE
```

## 4. Architecture Overview

1. Users access StockFlow through Kubernetes ingress on port 80.
2. Ingress routes traffic to the stockflow service.
3. Service forwards to stockflow pods running NGINX + frontend static assets.
4. Frontend reads runtime env values from env-config.js generated at container start.
5. Frontend communicates with Supabase for authentication and data.
6. Prometheus scrapes NGINX exporter metrics via ServiceMonitor.
7. Grafana visualizes metrics and alerts from Prometheus.

## 5. Prerequisites

### For local development

- Node.js 20+ (recommended)
- npm

### For Kubernetes deployment

- kubectl configured for your cluster
- Helm 3
- Docker registry access for pushing frontend image

### For infrastructure provisioning

- Terraform >= 1.5
- AWS credentials configured
- SSH key pair available at ~/.ssh/k8s-key and ~/.ssh/k8s-key.pub

## 6. Local Development (Frontend)

From the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

App default URL:

- http://localhost:5173

### Required frontend environment variables

Use either local .env or runtime env injection in container:

- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

Example:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

## 7. Docker Build and Runtime

Frontend image uses multi-stage build:

- Build stage: node:20-alpine + npm ci + vite build
- Runtime stage: nginx:1.27-alpine

Build image:

```bash
cd frontend
docker build -t <dockerhub-user>/stockflow:latest .
```

Run container with runtime env values:

```bash
docker run --rm -p 8080:80 \
  -e VITE_SUPABASE_URL=https://your-project.supabase.co \
  -e VITE_SUPABASE_PUBLISHABLE_KEY=your_key \
  <dockerhub-user>/stockflow:latest
```

## 8. Kubernetes Deployment

Apply manifests in order:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

Optional autoscaling:

```bash
kubectl apply -f k8s/hpa.yaml
```

Verify:

```bash
kubectl get all -n stockflow
kubectl get ingress -n stockflow
kubectl describe ingress -n stockflow stockflow-ingress
```

### Important ingress note

Ingress resources require a running ingress controller. This repo expects ingress-nginx with ingressClassName nginx.

## 9. Monitoring (Prometheus + Grafana)

Monitoring manifests are under k8s/monitoring.

Install stack:

```bash
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f k8s/monitoring/prometheus-values.yaml \
  -f k8s/monitoring/grafana-values.yaml
kubectl apply -f k8s/monitoring/stockflow-servicemonitor.yaml
kubectl apply -f k8s/monitoring/stockflow-prometheusrule.yaml
```

Provided defaults:

- Grafana NodePort: 32000
- Prometheus NodePort: 32090
- ServiceMonitor target: stockflow metrics endpoint on port 9113

## 10. Terraform Infrastructure (AWS)

Terraform creates:

- VPC + subnet + route table + internet gateway
- 1 master EC2 + Elastic IP
- N worker EC2 nodes + Elastic IPs
- Security groups for K8s control/data plane communication

Typical workflow:

```bash
cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
terraform output
```

Set required variable in terraform.tfvars:

- your_public_ip

## 11. CI Workflow

GitHub Actions workflow:

- File: .github/workflows/ci.yml
- Trigger: manual (workflow_dispatch)
- Action: Build and push frontend Docker image to Docker Hub
- Required secrets:
  - DOCKERHUB_USERNAME
  - DOCKERHUB_TOKEN

## 12. Quality Checks

Frontend scripts:

```bash
cd frontend
npm run lint
npm run test
npm run build
```

Current observed status during review:

- Tests: passing
- Lint: failing due to TypeScript ESLint issues (mostly no-explicit-any and no-empty-object-type)

## 13. Code Review Summary (Current)

This review was based on repository inspection plus lint/test execution.

### High priority findings

1. Sensitive values are committed in repository files:

- k8s/secret.yml contains live Supabase values
- frontend/.env contains Supabase values
- k8s/monitoring/grafana-values.yaml contains admin password in plain text

Recommendation:

- Rotate exposed credentials immediately.
- Remove secrets from git history if this repository is public/shared.
- Use Kubernetes external secret management (or sealed secrets), and environment-specific secret injection.

2. Potentially sensitive Terraform artifacts are present in repo tree:

- terraform.tfstate
- terraform.tfstate.backup
- tfplan

Recommendation:

- Keep state in a remote backend (for example S3 + DynamoDB locking).
- Ensure local state/plan files are not tracked and are removed from repository history if committed.

### Medium priority findings

1. Lint health is currently poor for long-term maintainability.

Primary hotspots:

- src/context/InventoryContext.tsx
- src/context/AuthContext.tsx
- src/components/inventory/ProductDialog.tsx
- src/pages/Analytics.tsx
- src/components/ui/command.tsx
- src/components/ui/textarea.tsx
- tailwind.config.ts

Recommendation:

- Replace any with explicit interfaces/types.
- Fix empty interface declarations.
- Replace require imports in TS config with import syntax.

2. License mismatch in documentation.

- Root LICENSE is Apache-2.0
- frontend/README.md currently states MIT

Recommendation:

- Align all docs to Apache-2.0 unless intentionally dual-licensed.

## 14. Hardening Checklist

- Move secrets to managed secret store.
- Enable TLS on ingress and enforce HTTPS.
- Tighten Security Group ingress rules (avoid 0.0.0.0/0 where not strictly required).
- Pin Docker images by immutable tag/digest for repeatable deploys.
- Add branch-protected CI checks for lint/test/build.
- Add backup/restore strategy for database state.

## 15. Troubleshooting

### Ingress created but app not reachable

- Confirm ingress-nginx controller is installed and healthy.
- Confirm worker/master SG rules allow 80/443 where needed.
- Check ingress class name matches controller class.

### Prometheus target not scraping

- Ensure stockflow-service exposes metrics port 9113.
- Ensure ServiceMonitor label release matches Helm release labels.
- Check NetworkPolicy/security group constraints.

### Pod crashes on startup

- Verify required env vars exist in stockflow-secret.
- Check deployment logs:

```bash
kubectl logs -n stockflow deploy/stockflow -c stockflow --tail=200
```

