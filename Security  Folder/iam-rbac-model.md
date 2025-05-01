# IAM Policies and RBAC Model – PennyPilot

## Purpose
This document defines the Identity and Access Management (IAM) roles and policies for the PennyPilot app during Sprint 1.

---

## IAM Roles

| Role             | Permissions Description                            | Services Accessed         |
|------------------|-----------------------------------------------------|---------------------------|
| Frontend Dev     | Read/write to frontend codebase and Firebase Auth   | Firebase Hosting, Auth    |
| Backend Dev      | Full access to backend logic, DB credentials        | Firebase Functions, DB    |
| Security Engineer| IAM policy mgmt, audit logging, monitoring setup    | Firebase IAM, Logging     |

---

## MFA Policy
- Enforced via Firebase Authentication for all dev accounts.
- MFA required for Firebase console access.
- App users must enable MFA for high-risk operations (Plaid integration, personal data updates).

---

## Least Privilege
- IAM roles are scoped to specific Firebase services.
- API keys and DB creds use Firebase secrets environment variables with restricted access.
