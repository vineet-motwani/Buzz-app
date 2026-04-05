output "instance_public_ip" {
  description = "Public IP address of the GCP instance — point your DNS A record to this"
  value       = google_compute_instance.buzz_server.network_interface[0].access_config[0].nat_ip
}

output "ssh_command" {
  description = "SSH command to connect to the server"
  value       = "ssh ${var.ssh_user}@${google_compute_instance.buzz_server.network_interface[0].access_config[0].nat_ip}"
}
