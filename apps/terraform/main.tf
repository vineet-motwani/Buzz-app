terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
  zone    = var.gcp_zone
}

resource "google_compute_network" "vpc_network" {
  name                    = "buzz-network"
  auto_create_subnetworks = true
}

resource "google_compute_firewall" "allow_ssh" {
  name    = "buzz-allow-ssh"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = [var.ssh_allowed_cidr]
  target_tags   = ["buzz-backend"]
}

resource "google_compute_firewall" "allow_http_https" {
  name    = "buzz-allow-http-https"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["buzz-backend"]
}

resource "google_compute_instance" "buzz_server" {
  name         = "buzz-backend-server"
  machine_type = "e2-micro" # Permanent Free Tier Eligible
  zone         = var.gcp_zone

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 30 # 30 GB standard persistent disk is permanently free
      type  = "pd-standard"
    }
  }

  network_interface {
    network = google_compute_network.vpc_network.name
    access_config {
      # Assigns an ephemeral public IP
    }
  }

  metadata = {
    ssh-keys = "${var.ssh_user}:${file(var.ssh_pub_key_path)}"
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    set -e
    apt-get update -y
    apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl git

    # Install Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs

    # Install PM2 globally
    npm install -g pm2

    # Install Caddy (reverse proxy with automatic HTTPS via Let's Encrypt)
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -y
    apt-get install -y caddy

    # Configure Caddy as reverse proxy for the backend API
    cat > /etc/caddy/Caddyfile <<'CADDYFILE'
    ${var.backend_domain} {
      reverse_proxy localhost:8000
    }
    CADDYFILE

    systemctl restart caddy
    systemctl enable caddy
  EOF

  tags = ["buzz-backend"]
}
