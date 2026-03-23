output "instance_public_ip" {
  description = "Public IP address of the GCP instance"
  value       = google_compute_instance.buzz_server.network_interface[0].access_config[0].nat_ip
}
