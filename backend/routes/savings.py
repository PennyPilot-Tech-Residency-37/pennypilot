from config import db
from flask import jsonify, request
from marshmallow import ValidationError
from models import Savings
from schemas import savings_schema

def setup_savings_routes(app):
    # Create savings
    @app.route('/savings', methods=['POST'])
    def create_savings():
        try:
            savings_data = savings_schema.load(request.json)
        except ValidationError as e:
            app.logger.warning(f"Savings validation failed: {e.messages}")
            return jsonify({"error": "Invalid savings data"}), 400

        
        new_savings = Savings(amount=savings_data['amount'], goal_name=savings_data['goal_name'], target_amount=savings_data['target_amount'], date=savings_data['date'])

        db.session.add(new_savings)
        db.session.commit()

        return jsonify({"message": "Savings created!"}), 201

    # Read savings
    @app.route('/savings/<int:id>', methods=['GET'])
    def read_savings(id):
        savings = Savings.query.filter(Savings.id == id).first_or_404()

        return savings_schema.jsonify(savings)

    # Update savings
    @app.route('/savings/<int:id>', methods=['PUT'])
    def update_savings(id):
        savings = Savings.query.get_or_404(id)

        try:
            savings_data = savings_schema.load(request.json)
        except ValidationError as e:
            app.logger.warning(f"Savings validation failed: {e.messages}")
            return jsonify({"error": "Invalid savings data"}), 400

        
        savings.amount = savings_data['amount']
        savings.goal_name = savings_data['goal_name']
        savings.target_amount = savings_data['target_amount']
        savings.date = savings_data['date']

        db.session.commit()

        return jsonify({'message': 'Savings updated successfully!'}), 200

    # Delete savings
    @app.route('/savings/<int:id>', methods=['DELETE'])
    def delete_savings(id):
        savings = Savings.query.get_or_404(id)

        db.session.delete(savings)
        db.session.commit()

        return jsonify({'message': 'Savings removed successfully!'})