from config import db
from flask import jsonify, request
from marshmallow import ValidationError
from models import Income
from schemas import income_schema

def setup_income_routes(app):
    # Create income
    @app.route('/income', methods=['POST'])
    def create_income():
        try:
            income_data = income_schema.load(request.json)
        except ValidationError as e:
            app.logger.warning(f"Income validation failed: {e.messages}")
            return jsonify({"error": "Invalid income data"}), 400
        
        new_income = Income(amount=income_data['amount'], source=income_data['source'], date=income_data['date'], description=income_data['description'])

        db.session.add(new_income)
        db.session.commit()

        return jsonify({"message": "Income created!"}), 201

    # Read income
    @app.route('/incomes/<int:id>', methods=['GET'])
    def read_income(id):
        income = Income.query.filter(Income.id == id).first_or_404()

        return income_schema.jsonify(income)

    # Update income
    @app.route('/incomes/<int:id>', methods=['PUT'])
    def update_income(id):
        income = Income.query.get_or_404(id)

        try:
            income_data = income_schema.load(request.json)
        except ValidationError as e:
            app.logger.warning(f"Income validation failed: {e.messages}")
            return jsonify({"error": "Invalid income data"}), 400
        
        income.amount = income_data['amount']
        income.source = income_data['source']
        income.date = income_data['date']
        income.description = income_data['description']

        db.session.commit()

        return jsonify({'message': 'Income updated successfully!'}), 200

    # Delete income
    @app.route('/incomes/<int:id>', methods=['DELETE'])
    def delete_income(id):
        income = Income.query.get_or_404(id)

        db.session.delete(income)
        db.session.commit()

        return jsonify({'message': 'Income removed successfully!'})