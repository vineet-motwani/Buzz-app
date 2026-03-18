variable "aws_region" {
  description = "AWS region to deploy in"
  default     = "ap-south-1"
}

variable "key_name" {
  description = "Name of the SSH key pair"
}

variable "alert_email" {
  description = "Email address for budget alerts"
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed for SSH access (e.g., your public IP /32. Visit https://checkip.amazonaws.com to find yours)"
}
