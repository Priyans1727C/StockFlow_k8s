# StockFlow Project Setup (Kubernetes Deployment)

This document captures the exact steps to deploy StockFlow on your Kubernetes cluster using ingress on port 80, without HPA, and with monitoring enabled (Prometheus + Grafana).

## Deployment Scope

- Deploy application resources only.
- Do not apply `k8s/hpa.yaml`.
- Apply monitoring stack from files under `k8s/monitoring/`.
- Do not modify existing manifest files.

## Cluster Access

Use master SSH:

```bash
ssh -i ~/.ssh/k8s-key ubuntu@13.235.157.45
```

Terraform outputs used:

- Master public IP: `13.235.157.45`
- Worker public IPs: `13.205.181.26`, `13.234.247.71`

## 1. Verify Cluster

Run on master:

```bash
kubectl config current-context
kubectl get nodes -o wide
```

Expected: all nodes in `Ready` state.

## 2. Remove Previous Ingress for This Project

Run on master:

```bash
kubectl get ingress -A
kubectl delete ingress -n stockflow stockflow-ingress --ignore-not-found
```

If any old StockFlow ingress exists in other namespaces, delete it explicitly:

```bash
kubectl delete ingress -n <namespace> <old-ingress-name>
```

## 3. Deploy Application Manifests (No HPA)

Go to repo and apply only the required files:

```bash
cd ~/StockFlow_k8s
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

Do NOT run:

```bash
kubectl apply -f k8s/hpa.yaml
```

## 4. Ensure Ingress Controller Exists and Binds Port 80

Install/upgrade NGINX ingress controller via Helm (run on master):

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx || true
helm repo update

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.kind=DaemonSet \
  --set controller.hostNetwork=true \
  --set controller.dnsPolicy=ClusterFirstWithHostNet \
  --set controller.ingressClassResource.name=nginx \
  --set controller.ingressClassByName=true \
  --set controller.ingressClassResource.default=true \
  --set controller.service.enabled=false \
  --set controller.tolerations[0].key=node-role.kubernetes.io/control-plane \
  --set controller.tolerations[0].operator=Exists \
  --set controller.tolerations[0].effect=NoSchedule \
  --set controller.tolerations[1].key=node-role.kubernetes.io/master \
  --set controller.tolerations[1].operator=Exists \
  --set controller.tolerations[1].effect=NoSchedule

kubectl -n ingress-nginx rollout status ds/ingress-nginx-controller --timeout=240s
```

Why this is needed: without a running ingress controller, `Ingress` resources exist but traffic on port 80 will not route.

## 4.1 Allow Worker Public IP Access for Ingress

If you want ingress to work on worker public IPs (`http://<worker-public-ip>/`), worker security group must allow ports `80` and `443` from the internet.

Terraform rule requirement in `terraform/security.tf` under `aws_security_group.k8s_worker_sg`:

- Ingress TCP 80 from `0.0.0.0/0`
- Ingress TCP 443 from `0.0.0.0/0`

Apply Terraform after the change:

```bash
cd terraform
terraform plan -out tfplan
terraform apply -auto-approve tfplan
```

Without these worker SG rules, master IP may work while worker public IPs time out/refuse even if ingress-nginx is healthy.

## 5. Verify Application Rollout

```bash
kubectl -n stockflow rollout status deploy/stockflow --timeout=180s
kubectl get all -n stockflow
kubectl get ingress -n stockflow -o wide
kubectl describe ingress -n stockflow stockflow-ingress
```

Expected:

- `deployment/stockflow` rollout successful.
- `stockflow-service` exists.
- `stockflow-ingress` exists with class `nginx`.

## 6. Verify Ingress on Port 80

Run on master:

```bash
curl -I http://127.0.0.1/
curl -I http://13.235.157.45/
```

Expected response includes:

- `HTTP/1.1 200 OK`

Browser check:

- Open `http://13.235.157.45/`
- Expected app screen: StockFlow auth page.

Worker browser check (after SG rules are applied):

- Open `http://13.205.181.26/`
- Open `http://13.234.247.71/`
- Expected app screen: StockFlow auth page on both.

## 7. What Was Successfully Verified

- Old project ingress cleaned up.
- StockFlow deployed without HPA.
- Ingress controller installed and running.
- Public ingress endpoint works on port 80.
- Browser access works at `http://13.235.157.45/`.

## 8. Deploy Monitoring Stack (Prometheus + Grafana)

Run on master:

```bash
cd ~/StockFlow_k8s
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true
helm repo update

helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f k8s/monitoring/prometheus-values.yaml \
  -f k8s/monitoring/grafana-values.yaml

kubectl apply -f k8s/monitoring/stockflow-servicemonitor.yaml
```

## 9. Verify Monitoring

Run on master:

```bash
kubectl -n monitoring rollout status deploy/kube-prometheus-stack-grafana --timeout=300s
kubectl -n monitoring get pods
kubectl -n monitoring get svc
kubectl -n monitoring get servicemonitor stockflow
```

Verify Prometheus target query:

```bash
PROM_POD=$(kubectl -n monitoring get pod -l app.kubernetes.io/name=prometheus -o jsonpath='{.items[0].metadata.name}')
kubectl -n monitoring exec "$PROM_POD" -- sh -c "wget -qO- --post-data='query=count(up{namespace=\"stockflow\"}==1)' http://localhost:9090/api/v1/query"
```

Expected value in response data: `2` (both StockFlow pods scraped).

Node Exporter health check (master node):

```bash
PROM_POD=$(kubectl -n monitoring get pod -l app.kubernetes.io/name=prometheus -o jsonpath='{.items[0].metadata.name}')
kubectl -n monitoring exec "$PROM_POD" -- sh -c "wget -qO- --post-data='query=up{instance=\"10.0.1.53:9100\"}' http://localhost:9090/api/v1/query"
```

Expected: value `1` (UP).

If it is DOWN, ensure Terraform security group rules allow worker-to-master scrape traffic on port `9100` for node-exporter.

Grafana access:

- `http://13.235.157.45:32000/`
- `http://13.205.181.26:32000/`
- `http://13.234.247.71:32000/`

Expected: Grafana login page loads on all three URLs.

Prometheus browser access:

- `http://13.235.157.45:32090/`
- `http://13.205.181.26:32090/`
- `http://13.234.247.71:32090/`

If Prometheus service is still `ClusterIP`, expose it as NodePort:

```bash
kubectl -n monitoring patch svc kube-prometheus-stack-prometheus --type merge -p '{"spec":{"type":"NodePort","ports":[{"name":"http-web","port":9090,"protocol":"TCP","targetPort":9090,"nodePort":32090},{"name":"reloader-web","port":8080,"protocol":"TCP","targetPort":"reloader-web"}]}}'
kubectl -n monitoring get svc kube-prometheus-stack-prometheus
```

Note: `curl -I` may return `405 Method Not Allowed` for Prometheus root endpoint; browser `GET` still works.

Grafana credentials from current values file:

- Username: `admin`
- Password: `kali67890`

Change this password in `k8s/monitoring/grafana-values.yaml` after first login.

## 10. Useful Operations

Re-deploy app resources:

```bash
cd ~/StockFlow_k8s
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl -n stockflow rollout status deploy/stockflow
```

Check recent logs:

```bash
kubectl logs -n stockflow deploy/stockflow -c stockflow --tail=100
```

Delete only app stack (keeps ingress controller):

```bash
kubectl delete -f k8s/ingress.yaml --ignore-not-found
kubectl delete -f k8s/service.yaml --ignore-not-found
kubectl delete -f k8s/deployment.yaml --ignore-not-found
kubectl delete -f k8s/configmap.yaml --ignore-not-found
kubectl delete -f k8s/secret.yml --ignore-not-found
kubectl delete -f k8s/namespace.yaml --ignore-not-found
```
