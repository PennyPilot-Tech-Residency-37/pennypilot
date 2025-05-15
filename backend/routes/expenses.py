from config import db
from flask import jsonify, request
from marshmallow import ValidationError
from models import Expenses
from schemas import expenses_schema

def setup_expense_routes(app):
    # Create expense
    @app.route('/expense', methods=['POST'])
    def create_expense():
        try:
            expense_data = expenses_schema.load(request.json)
        except ValidationError as e:
            return jsonify(e.messages), 400
        
        new_expense = Expenses(amount=expense_data['amount'], category=expense_data['category'], date=expense_data['date'], description=expense_data['description'])

        db.session.add(new_expense)
        db.session.commit()

        return jsonify({"message": "Expense created!"}), 201

    # Read expense
    @app.route('/expenses/<int:id>', methods=['GET'])
    def read_expense(id):
        expense = Expenses.query.filter(Expenses.id == id).first_or_404()

        return expenses_schema.jsonify(expense)

    # Update expense
    @app.route('/expenses/<int:id>', methods=['PUT'])
    def update_expense(id):
        expense = Expenses.query.get_or_404(id)

        try:
            expense_data = expenses_schema.load(request.json)
        except ValidationError as e:
            return jsonify(e.messages), 400
        
        expense.amount = expense_data['amount']
        expense.category = expense_data['category']
        expense.date = expense_data['date']
        expense.description = expense_data['description']

        db.session.commit()

        return jsonify({'message': 'Expense updated successfully!'}), 200

    # Delete expense
    @app.route('/expenses/<int:id>', methods=['DELETE'])
    def delete_expense(id):
        expense = Expenses.query.get_or_404(id)

        db.session.delete(expense)
        db.session.commit()

        return jsonify({'message': 'Expense removed successfully!'})