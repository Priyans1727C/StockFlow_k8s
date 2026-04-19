resource "aws_key_pair" "k8s_key" {
  key_name   = "${var.project_name}-key"
  public_key = file(pathexpand("~/.ssh/k8s-key.pub"))
}

data "aws_ami" "ubuntu_2204" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = [
      "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*",
      "ubuntu/images/hvm-ssd-gp3/ubuntu-jammy-22.04-amd64-server-*",
    ]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "k8s_master" {
  ami                    = var.ubuntu_ami != "" ? var.ubuntu_ami : data.aws_ami.ubuntu_2204.id
  instance_type          = var.master_instance_type
  key_name               = aws_key_pair.k8s_key.key_name
  subnet_id              = aws_subnet.k8s_public_subnet.id
  vpc_security_group_ids = [aws_security_group.k8s_master_sg.id]

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
  }

  tags = {
    Name    = "${var.project_name}-master"
    Role    = "control-plane"
    Project = var.project_name
  }
}

resource "aws_eip" "k8s_master" {
  domain = "vpc"

  tags = {
    Name    = "${var.project_name}-master-eip"
    Role    = "control-plane"
    Project = var.project_name
  }
}

resource "aws_eip_association" "k8s_master" {
  allocation_id = aws_eip.k8s_master.id
  instance_id   = aws_instance.k8s_master.id
}

resource "aws_instance" "k8s_workers" {
  count                  = var.worker_count
  ami                    = var.ubuntu_ami != "" ? var.ubuntu_ami : data.aws_ami.ubuntu_2204.id
  instance_type          = var.worker_instance_type
  key_name               = aws_key_pair.k8s_key.key_name
  subnet_id              = aws_subnet.k8s_public_subnet.id
  vpc_security_group_ids = [aws_security_group.k8s_worker_sg.id]

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
  }

  tags = {
    Name    = "${var.project_name}-worker-${count.index + 1}"
    Role    = "worker"
    Project = var.project_name
  }
}

resource "aws_eip" "k8s_workers" {
  count  = var.worker_count
  domain = "vpc"

  tags = {
    Name    = "${var.project_name}-worker-${count.index + 1}-eip"
    Role    = "worker"
    Project = var.project_name
  }
}

resource "aws_eip_association" "k8s_workers" {
  count         = var.worker_count
  allocation_id = aws_eip.k8s_workers[count.index].id
  instance_id   = aws_instance.k8s_workers[count.index].id
}