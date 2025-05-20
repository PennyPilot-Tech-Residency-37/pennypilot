from config import db, app
import sqlalchemy as sa
import os

class User(db.Model):
    __tablename__ = 'Users'
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(10), nullable=False)

class LinkedAccount(db.Model):
    __tablename__ = 'Linked_Accounts'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    associated_user = db.Column(db.String(50), db.ForeignKey('Users.id'))


user = db.relationship('User', backref='linked_account')
class Transaction(db.Model):
    __tablename__ = 'Transactions'
    id = db.Column(db.Integer, primary_key=True)
    transaction_date = db.Column(db.Date, nullable=False)
    transaction_amount = db.Column(db.Float, nullable=False)


class Goal(db.Model):
    __tablename__ = 'Goals'
    id = db.Column(db.Integer, primary_key=True)
    target_amount = db.Column(db.Float, nullable=False)
    current_amount = db.Column(db.Float, nullable=False)
    deadline = db.Column(db.Date, nullable=False)

class TaxInfo(db.Model):
    __tablename__ = 'Tax_Info'
    id = db.Column(db.Integer, primary_key=True)
    income1 = db.Column(db.Float, nullable=False)
    # User can have up to five incomes
    income2 = db.Column(db.Float, nullable=False)
    income3 = db.Column(db.Float, nullable=False)
    income4 = db.Column(db.Float, nullable=False)
    income5 = db.Column(db.Float, nullable=False)
    tax_rate = db.Column(db.Integer, nullable=False)
    total_income = db.Column(db.Float, nullable=False)
    tax_to_save = db.Column(db.Float, nullable=False)
    total_saved = db.Column(db.Float, nullable=False)

class Income(db.Model):
    __tablename__ = 'Income'
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    source = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(1000))
# I'm guessing the description should be allowed to be empty, need to fix this if I'm wrong.

class Expenses(db.Model):
    __tablename__ = 'Expenses'
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(1000))
# Here too.

class Savings(db.Model):
    __tablename__ = 'Savings'
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    goal_name = db.Column(db.String(100), nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False)

class Budget(db.Model):
    __tablename__ = 'Budget'
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(100), nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    month = db.Column(db.String(3), nullable=False)
    year = db.Column(db.Integer, nullable=False)

class AccessToken(db.Model):
    __tablename__ = 'access_tokens'
    id = sa.Column(sa.Integer, primary_key=True)
    user_id = sa.Column(sa.String, nullable=False)
    access_token = sa.Column(sa.String, nullable=False)
    item_id = sa.Column(sa.String, nullable=False)

    # id = db.Column(db.Integer, primary_key=True)
    # user_id = db.Column(db.String, nullable=False)
    # access_token = db.Column(db.String, nullable=False)
    # item_id = db.Column(db.String, nullable=False)

# Only run db.create_all() if FLASK_ENV is set to development
if os.getenv("FLASK_ENV") == "development":
    with app.app_context():
        db.create_all()