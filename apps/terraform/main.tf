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
}

resource "google_compute_firewall" "allow_app" {
  name    = "buzz-allow-app"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["8000"]
  }

  source_ranges = [var.app_allowed_cidr]
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
      # This block assigns a public IP address to the VM
    }
  }

  metadata = {
    ssh-keys = "${var.ssh_user}:${file(var.ssh_pub_key_path)}"
  }

  # This script runs ONCE when the server boots up to automatically install Node.js
  metadata_startup_script = <<-EOF
    #!/bin/bash
    apt-get update -y
    # Install Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs git

    # Install PM2 globally to run the server in the background
    npm install -g pm2
  EOF

  tags = ["buzz-backend"]
}
