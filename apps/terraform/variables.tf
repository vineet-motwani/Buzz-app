variable "gcp_project_id" {
  description = "Your GCP Project ID"
}

variable "gcp_region" {
  description = "GCP region (Must be us-central1, us-east1, or us-west1 for the permanent Free Tier)"
  default     = "us-central1"
}

variable "gcp_zone" {
  description = "GCP zone"
  default     = "us-central1-a"
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed for SSH access (e.g., your public IP /32. Visit https://checkip.amazonaws.com to find yours)"
}

variable "app_allowed_cidr" {
  description = "CIDR block allowed to access the application port (8000). To open to the world, use 0.0.0.0/0."
  default     = "0.0.0.0/0"
}

variable "ssh_user" {
  description = "The username you want to use for SSH"
  default     = "ubuntu"
}

variable "ssh_pub_key_path" {
  description = "The absolute path to your public SSH key on your computer (e.g., ~/.ssh/id_rsa.pub)"
}
