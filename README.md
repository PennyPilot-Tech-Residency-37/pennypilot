# PennyPilot

PennyPilot is a gamified financial planning web application designed to help users build better budgeting habits, track spending, and visualize savings goals. By integrating bank data via the Plaid API, users can link their accounts and automatically populate budget tables and charts. The app uses a combination of interactive visuals, progress tracking, and financial education tools to engage users and support long-term financial health.

---

## 🚀 Setup & Installation Guide

Follow these steps to get the project running locally for development or testing.

### Prerequisites

- Node.js (v18 or above)
- Python 3.10+
- MySQL or PostgreSQL
- Virtual environment tool (e.g. `venv` or `virtualenv`)
- Plaid API keys
- AWS EC2 instance (for deployment)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/pennypilot.git
```
### 2. Frontend Setup (React)
``` bash
cd pennypilot
npm install
npm run dev
```
### 3. Backend Setup (Flask + SQLAlchemy)
``` bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```
Environment Variables & Secrets

To run this project locally or in a deployment environment, you will need access to environment variables for services such as Plaid, Firebase, and the database connection.

We’ve provided a `.env.example` file in the root directory.
To get started:

1. Copy the `.env.example` file to create your local `.env` file
2. Fill in the actual values by referencing project secrets stored in GitHub Secrets.
    - This project uses GitHub Actions for CI/CD. Sensitive keys are stored securely in GitHub Secrets, which are automatically injected during build and deployment workflows.
    - To request access:

Contact a project maintainer
Access is granted only to trusted collaborators with write/admin permissions

Once granted, secrets such as the following will be available in the Actions environment:

PLAID_CLIENT_ID

PLAID_SECRET

FIREBASE_API_KEY

DATABASE_URL

SECRET_KEY

These are not available to local development automatically. You must retrieve them securely and insert them manually into your local .env files using the .env.example template as a guide.


Run the backend server:
``` bash
flask run
```
### 4. Database Initialization
Ensure your local MySQL/PostgreSQL server is running.
``` bash
flask db init
flask db migrate
flask db upgrade
```
### 5. Deploying to AWS EC2
- see guide through this link: https://docs.aws.amazon.com/codedeploy/latest/userguide/deployment-steps-server.html

### Project Overview
- Link your bank accounts securely via Plaid

- Automatically categorize transactions into income, expenses, and savings

- Visualize your budget breakdown and progress

- Earn rewards and achievements for meeting goals

- Securely authenticate via Firebase

### Screenshots and Diagrams
"Insert visuals here"

### Team Structure

Frontend

- Built with React, styled using Material UI

- State management: Redux Toolkit + React Query

- Authentication via Firebase Auth

Responsibilities:

- UI design and responsiveness

- Budget table & chart rendering

- Plaid Link integration on client side

Backend

- Developed using Flask and SQLAlchemy

- Implements a secure RESTful API

- Handles Plaid token exchanges and transaction storage

- Manages budget logic and database interaction

Responsibilities:

- Secure token handling and API routing

- Data transformation and storage

- Database migrations

Cybersecurity

- Responsible for securing both backend and frontend systems

Implements:

- API key validation

- Secure storage of access tokens

- HTTPS and CORS headers

- Performs vulnerability scans and sets up basic monitoring

- Reviews access control and data privacy practices

### Contributors

Alex Alarcon — Frontend

Jennifer Coppick — Frontend

Jaycob Hoffman — Backend

Jared Wilson — Backend

Kevin Jones — Cybersecurity
