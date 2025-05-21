# Getting Started with PennyPilot (Develop Branch)

Welcome to the **PennyPilot** repo! This `develop` branch is the active working branch where all new features are created, tested, and reviewed before merging into production (`main`).

If you’re a contributor, follow these steps to set up your environment and start working on your own feature branch.

---

## Step 1: Fork the Repository

1. Go to the main repo: [https://github.com/PennyPilot-Tech-Residency-37/pennypilot](https://github.com/PennyPilot-Tech-Residency-37/pennypilot)
2. Click the **Fork** button in the top-right corner
3. Choose your personal GitHub account as the destination

---

## Step 2: Clone Your Fork

In your terminal:

```bash
git clone https://github.com/your-username/pennypilot.git
cd pennypilot
git remote add upstream https://github.com/YourOrgOrUser/pennypilot.git
```

## Step 3: Create Your Feature Branch (From Develop)
Always branch off from the develop branch when working on a new feature.

```
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name
```

## Step 4: Install Dependencies
Make sure you're in the root directory of the project, then run:
```
npm install
```
This will install all necessary packages in package.json.

If you're using yarn instead:
```
yarn install
```
## Step 5: Stay Updated with the develop Branch
To make sure your branch always has the latest changes:
```
git checkout develop
git pull upstream develop
git checkout feature/your-feature-name
git merge develop
```
Resolve any merge conflicts if they occur.

## Step 6: Run the App Locally
Once everything is installed, run:
```
npm run dev
```

## Authors

- Jaycob Hoffman
- Alex Alarcon
- Jennifer Coppick
- Kevin Jones

# PennyPilot Backend Documentation
---
## Table of Contents
- [models.py](#modelspy)
- [schemas.py](#schemaspy)
- [key_utils.py](#key_utilspy)
- [config.py](#configpy)
- [base.py](#basepy)
- [app.py](#apppy)
- [setup_cred.py](#setup_credpy)
- [plaid_client_config.py](#plaid_client_configpy)
- [init_keys_table.py](#init_keys_tablepy)
- [jared_mock_data.py](#jared_mock_datapy)
- [user.py](#userpy)
- [transaction.py](#transactionpy)
- [tax_info.py](#tax_infopy)
- [savings.py](#savingspy)
---
## `models.py`
Defines the ORM models for the app using SQLAlchemy. Includes tables for Users, Linked Accounts, Transactions, Goals, Tax Info, Income, Expenses, Savings, Budget, and Access Tokens.
**Key points:**
- Uses SQLAlchemy declarative models linked with Flask app.
- Defines relationships between `User` and `LinkedAccount`.
- Each class corresponds to a database table with appropriate columns and data types.
- Automatically creates tables on app context.
---
## `schemas.py`
Marshmallow schemas for serialization and validation of API input/output data.
- Each schema corresponds to a model and defines required fields and validation.
- Includes schemas for User, LinkedAccount, Transaction, Goal, TaxInfo, Income, Expenses, Savings, Budget, and AccessToken.
- Fields include types such as String, Integer, Float, Date, with required flags.
- Schemas are instantiated at the bottom for use in route handlers.
---
## `key_utils.py`
Utility module for secure key storage and validation.
- Defines `KeyStorage` model for keys with salt and hashed keys.
- Generates random salt using `os.urandom`.
- Hashes keys with SHA-256 combining salt + key.
- Stores hashed keys in database.
- Validates input keys by comparing hashes.
---
## `config.py`
Flask app and extension configuration.
- Initializes Flask app, SQLAlchemy, Marshmallow, and CORS.
- Loads environment variables via `dotenv`.
- Configures database URI, disables SQLAlchemy event system tracking.
- Sets up CORS to allow cross-origin requests.
---
## `base.py`
Defines SQLAlchemy declarative base:
```python
import sqlalchemy as sa
from sqlalchemy.orm import declarative_base
Base = declarative_base()
```
---
## `app.py`
Main application entry point.
- Imports and initializes Flask app and database session.
- Imports and sets up routes for users, linked accounts, goals, tax info, transactions, Plaid integration, and home.
- Loads environment variables for SSL certificates.
- Runs Flask app with debug mode enabled.
---
## `setup_cred.py`
Initializes Firebase Admin SDK with service account credentials.
- Loads `.env` file using `dotenv`.
- Reads `GOOGLE_CREDENTIALS` environment variable to get path to Firebase service account JSON.
- Uses `firebase_admin.credentials.Certificate` to initialize Firebase app.
**Environment variable:**
```bash
GOOGLE_CREDENTIALS=/path/to/firebase-service-account.json
```
---
## `plaid_client_config.py`
Sets up the Plaid API client.
- Loads Plaid credentials (`CLIENT_ID`, `SECRET`, `ENV`) from environment variables.
- Defaults to Sandbox environment if none specified.
- Configures and instantiates Plaid API client using official SDK.
---
## `init_keys_table.py`
Script to create the `keys` table in the database.
- Uses `Base.metadata.create_all` with SQLAlchemy engine.
- Runs within Flask app context.
- Prints confirmation message once table is created.
---
## `jared_mock_data.py`
Populates the database with mock data for testing.
- Adds a user, linked account, transaction, goal, and tax info with fixed test values.
- Uses the Flask SQLAlchemy session.
- Commits data and closes session.
---
## `user.py`
Defines RESTful API routes for User resource.
- CRUD routes for users (`POST /users`, `GET /users/<id>`, `PUT /users/<id>`, `DELETE /users/<id>`).
- Validates request JSON against `UserSchema`.
- Commits changes to the database.
- Returns appropriate JSON messages and HTTP status codes.
---
## `transaction.py`
Defines RESTful API routes for Transaction resource.
- CRUD routes (`POST /transactions`, `GET /transactions/<id>`, `PUT /transactions/<id>`, `DELETE /transactions/<id>`).
- Validates input data with `TransactionSchema`.
- Performs DB operations and returns status messages.
---
## `tax_info.py`
RESTful routes for TaxInfo resource.
- Supports full CRUD operations.
- Validates requests with `TaxInfoSchema`.
- Handles multiple income fields and tax-related data.
---
## `savings.py`
RESTful API for Savings resource.
- Implements create, read, update, delete endpoints.
- Uses `SavingsSchema` for input validation.
- Persists data including amount, goal name, target, and date.