# StockFlow Kubernetes Setup Guide

This guide shows how to deploy StockFlow to your Kubernetes cluster using the manifests in `k8s/`.

## 1. Prerequisites

Install these tools on your machine:

- `kubectl` (configured to your cluster)
- Docker (or any OCI image builder)
- Optional for local clusters:
  - Minikube (`minikube`)
  - NGINX Ingress Controller
  - Metrics Server (required for HPA)

Quick checks:

```bash
kubectl version --client
kubectl get nodes
docker --version
```

## 2. Build and Push the Frontend Image

The deployment uses image `priyans1727c/stockflow:latest` by default.

If you want to use your own image:

```bash
cd frontend
docker build -t <your-dockerhub-username>/stockflow:latest .
docker push <your-dockerhub-username>/stockflow:latest
```

Then update image in `k8s/deployment.yaml`:

- change `image: priyans1727c/stockflow:latest`
- to `image: <your-dockerhub-username>/stockflow:latest`

## 3. Configure Runtime Secrets

The container requires these runtime variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Current secret file: `k8s/secret.yml`.

Before deploying, update `k8s/secret.yml` with your values.

## 4. Deploy to Kubernetes

From repository root (`stockFlow_k8s`):

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

Or apply all YAML files at once:

```bash
kubectl apply -f k8s/
```

## 5. Verify Deployment

```bash
kubectl get all -n stockflow
kubectl get ingress -n stockflow
kubectl get hpa -n stockflow
kubectl logs -n stockflow deploy/stockflow -c stockflow --tail=100
```

You should see:

- `stockflow` pods in `Running` state
- `stockflow-service` exposed on port `80` (NodePort `30080`)
- ingress `stockflow-ingress` created

## 6. Access the App

### Option A: NodePort

```bash
kubectl get nodes -o wide
```

Open:

- `http://<node-ip>:30080`

For Minikube:

```bash
minikube service stockflow-service -n stockflow --url
```

### Option B: Ingress

If ingress controller is installed, map ingress IP/host and open root path `/`.

For Minikube:

```bash
minikube addons enable ingress
minikube tunnel
kubectl get ingress -n stockflow
```

## 7. Monitoring (Optional)

A ServiceMonitor is available at:

- `k8s/monitoring/stockflow-servicemonitor.yaml`

If you are running Prometheus Operator / kube-prometheus-stack:

```bash
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f k8s/monitoring/stockflow-servicemonitor.yaml
```

## 8. Update / Rollout

After pushing a new image tag:

```bash
kubectl -n stockflow set image deployment/stockflow stockflow=<your-dockerhub-username>/stockflow:<new-tag>
kubectl -n stockflow rollout status deployment/stockflow
kubectl -n stockflow rollout history deployment/stockflow
```

## 9. Troubleshooting

Check pod status and events:

```bash
kubectl get pods -n stockflow
kubectl describe pod -n stockflow <pod-name>
kubectl get events -n stockflow --sort-by=.metadata.creationTimestamp
```

Common issues:

- `ImagePullBackOff`: wrong image name/tag or private registry access issue.
- `CrashLoopBackOff`: missing Supabase env vars in `k8s/secret.yml`.
- HPA not scaling: metrics server not installed.
- Ingress not routing: ingress controller not installed or `ingressClassName` mismatch.

## 10. Cleanup

```bash
kubectl delete -f k8s/
```

Or remove namespace (deletes all resources in `stockflow` namespace):

```bash
kubectl delete namespace stockflow
```
