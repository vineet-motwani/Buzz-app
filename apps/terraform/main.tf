provider "aws" {
  region = var.aws_region
}

resource "aws_security_group" "buzz_sg" {
  name        = "buzz-app-sg"
  description = "Allow inbound traffic for Buzz App"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr] # Restrict SSH access to a specific CIDR block.
  }

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "buzz_server" {
  ami           = "ami-022d03f649d12a49d" # Ubuntu 22.04 LTS for ap-south-1 (Mumbai)
  instance_type = "t2.micro"
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.buzz_sg.id]

  tags = {
    Name = "Buzz-Backend-Server"
  }
}

resource "aws_budgets_budget" "budget_limit" {
  name              = "monthly-budget-limit"
  budget_type       = "COST"
  limit_amount      = "1"
  limit_unit        = "USD"
  time_unit         = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }
}
