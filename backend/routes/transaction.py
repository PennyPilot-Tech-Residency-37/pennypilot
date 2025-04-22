'''
from config import db
from flask import jsonify, request
from marshmallow import ValidationError
from models import Transaction
from schemas import transaction_schema

def setup_transaction_routes(app):
    # Create transaction
    @app.route('/transactions', methods=['POST'])
    def create_transaction():
        try:
            transaction_data = transaction_schema.load(request.json)
        except ValidationError as e:
            return jsonify(e.messages), 400
        
        new_transaction = Transaction(transaction_date=transaction_data['transaction_date'], transaction_amount=transaction_data['transaction_amount'])

        db.session.add(new_transaction)
        db.session.commit()

        return jsonify({"message": "Transaction complete!"}), 201

    # Read transaction
    @app.route('/transactions/<int:id>', methods=['GET'])
    def read_transaction(id):
        transaction = Transaction.query.filter(Transaction.id == id).first_or_404()

        return transaction_schema.jsonify(transaction)

    # Update transaction
    @app.route('/transactions/<int:id>', methods=['PUT'])
    def update_transaction(id):
        transaction = Transaction.query.get_or_404(id)

        try:
            transaction_data = transaction_schema.load(request.json)
        except ValidationError as e:
            return jsonify(e.messages), 400
        
        transaction.transaction_date = transaction_data['transaction_date']
        transaction.transaction_amount = transaction_data['transaction_amount']

        db.session.commit()

        return jsonify({'message': 'Transaction updated successfully!'}), 200

    # Delete transaction
    @app.route('/transactions/<int:id>', methods=['DELETE'])
    def delete_transaction(id):
        transaction = Transaction.query.get_or_404(id)

        db.session.delete(transaction)
        db.session.commit()

        return jsonify({'message': 'Transaction cancelled successfully!'})
'''