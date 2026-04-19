output "master_public_ip" {
  description = "Master node Elastic IP — use this in GitHub Secrets as K8S_MASTER_IP"
  value       = aws_eip.k8s_master.public_ip
}

output "master_private_ip" {
  description = "Master node private IP — use in kubeadm init"
  value       = aws_instance.k8s_master.private_ip
}

output "worker_public_ips" {
  description = "Worker nodes Elastic IPs"
  value       = aws_eip.k8s_workers[*].public_ip
}

output "worker_private_ips" {
  description = "Worker nodes private IPs"
  value       = aws_instance.k8s_workers[*].private_ip
}

output "ssh_master_command" {
  description = "SSH command for master"
  value       = "ssh -i ~/.ssh/k8s-key ubuntu@${aws_eip.k8s_master.public_ip}"
}

output "ssh_worker_commands" {
  description = "SSH commands for workers"
  value = [
    for w in aws_eip.k8s_workers :
    "ssh -i ~/.ssh/k8s-key ubuntu@${w.public_ip}"
  ]
}