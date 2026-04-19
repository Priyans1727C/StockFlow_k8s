#!/bin/bash
set -e

# Enable IP forwarding
echo "=== Enabling IP forwarding ==="
sudo sysctl -w net.ipv4.ip_forward=1
sudo bash -c 'echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf'

MASTER_PRIVATE_IP=$(hostname -I | awk '{print $1}')
echo "Master private IP: $MASTER_PRIVATE_IP"

echo "=== Initializing Kubernetes Cluster ==="
sudo kubeadm init \
  --pod-network-cidr=192.168.0.0/16 \
  --apiserver-advertise-address=$MASTER_PRIVATE_IP \
  --node-name=k8s-master \
  --cri-socket=unix:///var/run/containerd/containerd.sock \
  --ignore-preflight-errors=NumCPU,Hostname

echo "=== kubectl Configure karo ==="
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

echo "=== Calico CNI install karo ==="
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.0/manifests/calico.yaml

echo "=== Metrics Server install karo (HPA ke liye zaruri) ==="
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Metrics server TLS patch (EC2 pe zaruri hai)
kubectl patch deployment metrics-server -n kube-system --type json -p='[
  {"op":"add","path":"/spec/template/spec/containers/0/args/-",
   "value":"--kubelet-insecure-tls"}
]'

echo "=== Wait for nodes to be Ready ==="
kubectl wait --for=condition=Ready node --all --timeout=120s

echo "=== Cluster status ==="
kubectl get nodes
kubectl get pods -n kube-system

echo ""
echo "=== JOIN COMMAND FOR WORKERS (save this!) ==="
kubeadm token create --print-join-command