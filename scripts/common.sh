#!/bin/bash
set -e  

echo "=== Step 1: System Update ==="
sudo apt-get update && sudo apt-get upgrade -y

echo "=== Step 2: Swap Disable (K8s requirement) ==="
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

echo "=== Step 3: Kernel modules load karo ==="
cat <<EOF | sudo tee /etc/modules-load.d/containerd.conf
overlay
br_netfilter
EOF
sudo modprobe overlay
sudo modprobe br_netfilter

echo "=== Step 4: Add Docker Repository ==="
sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "=== Step 5: Install containerd ==="
sudo apt-get update
sudo apt-get install -y containerd.io

sudo mkdir -p /etc/containerd
sudo containerd config default | sudo tee /etc/containerd/config.toml > /dev/null

# SystemdCgroup = true karo (kubeadm requirement)
sudo sed -i 's/SystemdCgroup \= false/SystemdCgroup \= true/g' \
  /etc/containerd/config.toml

sudo systemctl restart containerd
sudo systemctl enable containerd
echo "Containerd status: $(systemctl is-active containerd)"

echo "=== Step 6: Install kubeadm, kubelet, kubectl ==="
KUBE_VERSION="1.29"

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v${KUBE_VERSION}/deb/Release.key | \
  sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] \
  https://pkgs.k8s.io/core:/stable:/v${KUBE_VERSION}/deb/ /" | \
  sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

echo "=== DONE! Verify versions ==="
kubeadm version
kubectl version --client
kubelet --version