from config import db, app

class User(db.Model):
    __tablename__ = 'Users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100))
    phone = db.Column(db.String(10))

class LinkedAccount(db.Model):
    __tablename__ = 'Linked_Accounts'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    associated_user = db.Column(db.Integer, db.ForeignKey('Users.id'))
    user = db.relationship("User", backref="linked_accounts")

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
    income2 = db.Column(db.Float)
    income3 = db.Column(db.Float)
    income4 = db.Column(db.Float)
    income5 = db.Column(db.Float)
    tax_rate = db.Column(db.Integer, nullable=False)
    total_income = db.Column(db.Float, nullable=False)
    tax_to_save = db.Column(db.Float, nullable=False)
    total_saved = db.Column(db.Float, nullable=False)

# Creating tables

with app.app_context():
    db.create_all()