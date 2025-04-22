# Security Infrastructure Implementation Guide – Sprint 1 Deliverable

## Objective
Deploy security infrastructure components to protect the PennyPilot application and its architecture.

---

## 1. Firewalls
- Firebase Hosting includes built-in protections.
- Additional restrictions applied through Cloudflare for domain-based access control.
- IP whitelisting enabled in project configuration.

---

## 2. VPN (for internal tools)
- WireGuard is set up for secure access to internal systems and sensitive development tools.
- Access granted to backend and security roles only.

---

## 3. IDS/IPS
- AWS-hosted development servers (used by backend team) use Wazuh for intrusion detection.
- Alerts sent to centralized logging system (see Logging doc).

---

## 4. WAF (Web Application Firewall)
- Managed through Firebase Hosting with Cloudflare integration.
- Protects against OWASP Top 10 threats like XSS and SQLi.

---

## Implementation Status
- ✅ Cloudflare WAF active
- ✅ WireGuard deployed to staging
- 🚧 IDS fully configured, alerting in progress
