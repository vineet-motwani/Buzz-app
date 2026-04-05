variable "gcp_project_id" {
  description = "Your GCP Project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region (Must be us-central1, us-east1, or us-west1 for the permanent Free Tier)"
  type        = string
  default     = "us-central1"

  validation {
    condition     = contains(["us-central1", "us-east1", "us-west1"], var.gcp_region)
    error_message = "Region must be us-central1, us-east1, or us-west1 for GCP Free Tier."
  }
}

variable "gcp_zone" {
  description = "GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed for SSH access (e.g., your public IP /32. Visit https://checkip.amazonaws.com to find yours)"
  type        = string

  validation {
    condition     = can(cidrhost(var.ssh_allowed_cidr, 0))
    error_message = "Must be a valid CIDR block (e.g., 203.0.113.5/32)."
  }
}

variable "ssh_user" {
  description = "The username you want to use for SSH"
  type        = string
  default     = "ubuntu"
}

variable "ssh_pub_key_path" {
  description = "The absolute path to your public SSH key on your computer (e.g., ~/.ssh/id_rsa.pub)"
  type        = string
}

variable "backend_domain" {
  description = "Domain for the backend API (e.g., api.buzz.vineet-motwani.cv)"
  type        = string
}
