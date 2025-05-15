from config import db
from flask import jsonify, request
from marshmallow import ValidationError
from models import Budget
from schemas import budget_schema

def setup_budget_routes(app):
    # Create budget
    @app.route('/budget', methods=['POST'])
    def create_budget():
        try:
            budget_data = budget_schema.load(request.json)
        except ValidationError as e:
            return jsonify(e.messages), 400
        
        new_budget = Budget(category=budget_data['category'], target_amount=budget_data['target_amount'], month=budget_data['month'], year=budget_data['year'])

        db.session.add(new_budget)
        db.session.commit()

        return jsonify({"message": "Budget created!"}), 201

    # Read budget
    @app.route('/budgets/<int:id>', methods=['GET'])
    def read_budget(id):
        budget = Budget.query.filter(Budget.id == id).first_or_404()

        return budget_schema.jsonify(budget)

    # Update budget
    @app.route('/budgets/<int:id>', methods=['PUT'])
    def update_budget(id):
        budget = Budget.query.get_or_404(id)

        try:
            budget_data = budget_schema.load(request.json)
        except ValidationError as e:
            return jsonify(e.messages), 400
        
        budget.category = budget_data['category']
        budget.target_amount = budget_data['target_amount']
        budget.month = budget_data['month']
        budget.year = budget_data['year']

        db.session.commit()

        return jsonify({'message': 'Budget updated successfully!'}), 200

    # Delete budget
    @app.route('/budgets/<int:id>', methods=['DELETE'])
    def delete_budget(id):
        budget = Budget.query.get_or_404(id)

        db.session.delete(budget)
        db.session.commit()

        return jsonify({'message': 'Budget removed successfully!'})