resource "aws_security_group" "k8s_master_sg" {
  name        = "${var.project_name}-master-sg"
  description = "Security group for Kubernetes master node"
  vpc_id      = aws_vpc.k8s_vpc.id

  ingress {
    description = "SSH from anywhere (student mobility)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "Kubernetes API Server"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "etcd server client API"
    from_port   = 2379
    to_port     = 2380
    protocol    = "tcp"
    self        = true
  }
  ingress {
    description = "Kubelet API"
    from_port   = 10250
    to_port     = 10250
    protocol    = "tcp"
    self        = true
  }
  ingress {
    description = "kube-scheduler"
    from_port   = 10259
    to_port     = 10259
    protocol    = "tcp"
    self        = true
  }
  ingress {
    description = "kube-controller-manager"
    from_port   = 10257
    to_port     = 10257
    protocol    = "tcp"
    self        = true
  }
  ingress {
    description = "Calico BGP"
    from_port   = 179
    to_port     = 179
    protocol    = "tcp"
    self        = true
  }
  ingress {
    description = "Calico VXLAN/IPIP (UDP all between nodes)"
    from_port   = 0
    to_port     = 0
    protocol    = "udp"
    self        = true
  }
  ingress {
    description = "Calico IP-in-IP between master nodes"
    from_port   = 0
    to_port     = 0
    protocol    = "4"
    self        = true
  }
  ingress {
    description = "All node traffic within master SG"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${var.project_name}-master-sg" }
}

resource "aws_security_group" "k8s_worker_sg" {
  name        = "${var.project_name}-worker-sg"
  description = "Security group for Kubernetes worker nodes"
  vpc_id      = aws_vpc.k8s_vpc.id

  ingress {
    description = "SSH from anywhere (student mobility)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description     = "Kubelet API from master"
    from_port       = 10250
    to_port         = 10250
    protocol        = "tcp"
    security_groups = [aws_security_group.k8s_master_sg.id]
  }
  ingress {
    description = "NodePort Services (public access)"
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "Calico between workers"
    from_port   = 0
    to_port     = 0
    protocol    = "udp"
    self        = true
  }
  ingress {
    description = "Calico BGP between workers"
    from_port   = 179
    to_port     = 179
    protocol    = "tcp"
    self        = true
  }
  ingress {
    description = "Calico IP-in-IP between workers"
    from_port   = 0
    to_port     = 0
    protocol    = "4"
    self        = true
  }
  ingress {
    description = "All node traffic within worker SG"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }
  ingress {
    description     = "All traffic from master"
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    security_groups = [aws_security_group.k8s_master_sg.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${var.project_name}-worker-sg" }
}

resource "aws_security_group_rule" "master_kubelet_from_workers" {
  type                     = "ingress"
  description              = "Kubelet API from workers (metrics-server scrape)"
  from_port                = 10250
  to_port                  = 10250
  protocol                 = "tcp"
  security_group_id        = aws_security_group.k8s_master_sg.id
  source_security_group_id = aws_security_group.k8s_worker_sg.id
}