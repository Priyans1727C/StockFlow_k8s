variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "stockflow"
}

variable "master_instance_type" {
  description = "EC2 instance type for K8s master"
  type        = string
  default     = "c7i-flex.large"
}

variable "worker_instance_type" {
  description = "EC2 instance type for K8s workers"
  type        = string
  default     = "t3.small"
}

variable "worker_count" {
  description = "Number of worker nodes"
  type        = number
  default     = 2
}

variable "ubuntu_ami" {
  description = "Optional Ubuntu 22.04 LTS AMI override; leave empty to auto-discover latest per region"
  type        = string
  default     = ""
}

variable "your_public_ip" {
  description = "Your local machine IP for SSH access (curl ifconfig.me)"
  type        = string
}