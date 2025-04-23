from config import db
from flask import jsonify, request
from marshmallow import ValidationError
from models import Expense
from schemas import expense_schema

def setup_expense_routes(app):
    # Create expense
    @app.route('/expense', methods=['POST'])
    def create_expense():
        try:
            expense_data = expense_schema.load(request.json)
        except ValidationError as e:
            return jsonify(e.messages), 400
        
        new_expense = Expense(amount=expense_data['amount'], category=expense_data['category'], date=expense_data['date'], description=expense_data['description'])

        db.session.add(new_expense)
        db.session.commit()

        return jsonify({"message": "Expense created!"}), 201

    # Read expense
    @app.route('/expenses/<int:id>', methods=['GET'])
    def read_expense(id):
        expense = Expense.query.filter(Expense.id == id).first_or_404()

        return expense_schema.jsonify(expense)

    # Update expense
    @app.route('/expenses/<int:id>', methods=['PUT'])
    def update_expense(id):
        expense = Expense.query.get_or_404(id)

        try:
            expense_data = expense_schema.load(request.json)
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
        expense = Expense.query.get_or_404(id)

        db.session.delete(expense)
        db.session.commit()

        return jsonify({'message': 'Expense removed successfully!'})