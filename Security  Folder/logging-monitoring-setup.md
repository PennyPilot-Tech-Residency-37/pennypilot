# Logging and Monitoring Setup – Sprint 1 Deliverable

## Objective
Establish centralized logging and monitoring for observability and threat detection.

---

## Tools Used
- **Firebase Analytics**: Logs client-side events and usage.
- **Cloud Logging (GCP)**: Collects logs from Firebase Functions and Hosting.
- **Elastic Stack (ELK)**: Self-hosted setup for ingesting logs from dev servers and VPN.
- **Azure Sentinel (Optional)**: Connected to Wazuh IDS for advanced correlation.

---

## Logging Sources
| Source           | Tool/Platform     | Purpose                           |
|------------------|-------------------|-----------------------------------|
| Frontend         | Firebase Analytics | User behavior, errors             |
| Backend Logs     | Flask + Cloud Logging | API usage, errors                 |
| IDS Alerts       | Wazuh + ELK        | Intrusion attempts                |
| VPN Connections  | WireGuard Logs     | Audit trail for internal access   |

---

## Monitoring Dashboard
- Kibana dashboards created for security events, login anomalies, and error rates.
- Firebase alerting configured for suspicious login behavior and rule violations.

---

## Next Steps
- Set up daily log rotation.
- Integrate Slack alerting from ELK.
