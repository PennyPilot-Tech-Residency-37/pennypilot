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

# Initializing schemas

user_schema = UserSchema()
linked_account_schema = LinkedAccountSchema()
# transaction_schema = TransactionSchema()
goal_schema = GoalSchema()
tax_info_schema = TaxInfoSchema()