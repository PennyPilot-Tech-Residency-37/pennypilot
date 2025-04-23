from config import ma
from marshmallow import fields

class UserSchema(ma.Schema):
    name = fields.String(required=True)
    email = fields.String(required=True)
    phone = fields.String(required=True)

    class Meta:
        fields = ('id', 'name', 'email', 'phone')

class LinkedAccountSchema(ma.Schema):
    username = fields.String(required=True)
    password = fields.String(required=True)
    associated_user = fields.Integer(required=True)

    class Meta:
        fields = ('id', 'username', 'password', 'associated_user')

class TransactionSchema(ma.Schema):
    transaction_date = fields.Date(required=True)
    transaction_amount = fields.Float(required=True)

    class Meta:
        fields = ('id', 'transaction_date', 'transaction_amount')

class GoalSchema(ma.Schema):
    target_amount = fields.Float(required=True)
    current_amount = fields.Float(required=True)
    deadline = fields.Date(required=True)

    class Meta:
        fields = ('id', 'target_amount', 'current_amount', 'deadline')

class TaxInfoSchema(ma.Schema):
    income1 = fields.Float(required=True)
    income2 = fields.Float(required=True)
    income3 = fields.Float(required=True)
    income4 = fields.Float(required=True)
    income5 = fields.Float(required=True)
    tax_rate = fields.Integer(required=True)
    total_income = fields.Float(required=True)
    tax_to_save = fields.Float(required=True)
    total_saved = fields.Float(required=True)

    class Meta:
        fields = ('id', 'income1', 'income2', 'income3', 'income4', 'income5', 'tax_rate', 'total_income', 'tax_to_save', 'total_saved')

class IncomeSchema(ma.Schema):
    amount = fields.Float(required=True)
    source = fields.String(required=True)
    date = fields.Date(required=True)
    description = fields.String()
# If we need to require the description, this will need to be updated.
    class Meta:
        fields = ('id', 'amount', 'source', 'date', 'description')

class ExpensesSchema(ma.Schema):
    amount = fields.Float(required=True)
    category = fields.String(required=True)
    date = fields.Date(required=True)
    description = fields.String()
# This one too.
    class Meta:
        fields = ('id', 'amount', 'category', 'date', 'description')

class SavingsSchema(ma.Schema):
    amount = fields.Float(required=True)
    goal_name = fields.String(required=True)
    target_amount = fields.Float(required=True)
    date = fields.Date(required=True)

    class Meta:
        fields = ('id', 'amount', 'goal_name', 'target_amount', 'date')

class BudgetSchema(ma.Schema):
    category = fields.String(required=True)
    target_amount = fields.Float(required=True)
    month = fields.String(required=True)
    year = fields.Integer(required=True)

    class Meta:
        fields = ('id', 'category', 'target_amount', 'month', 'year')

# Initializing schemas

user_schema = UserSchema()
linked_account_schema = LinkedAccountSchema()
transaction_schema = TransactionSchema()
goal_schema = GoalSchema()
tax_info_schema = TaxInfoSchema()
income_schema = IncomeSchema()
expenses_schema = ExpensesSchema()
savings_schema = SavingsSchema()
budget_schema = BudgetSchema()