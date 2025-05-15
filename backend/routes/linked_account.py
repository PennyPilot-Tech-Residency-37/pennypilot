from config import db
from flask import jsonify, request
from marshmallow import ValidationError
from models import LinkedAccount
from schemas import linked_account_schema

def setup_linked_account_routes(app):
    # Create linked_account
    @app.route('/linked_accounts', methods=['POST'])
    def create_linked_account():
        try:
            linked_account_data = linked_account_schema.load(request.json)
        except ValidationError as e:
            return jsonify(e.messages), 400
        
        new_linked_account = LinkedAccount(username=linked_account_data['username'], password=linked_account_data['password'], associated_user=linked_account_data['associated_user'])

        db.session.add(new_linked_account)
        db.session.commit()

        return jsonify({"message": "Account created!"}), 201

    # Read linked_account
    @app.route('/linked_accounts/<int:id>', methods=['GET'])
    def read_linked_account(id):
        linked_account = LinkedAccount.query.filter(LinkedAccount.id == id).first_or_404()

        return linked_account_schema.jsonify(linked_account)

    # Update linked_account
    @app.route('/linked_accounts/<int:id>', methods=['PUT'])
    def update_linked_account(id):
        linked_account = LinkedAccount.query.get_or_404(id)

        try:
            linked_account_data = linked_account_schema.load(request.json)
        except ValidationError as e:
            return jsonify(e.messages), 400
        
        linked_account.username = linked_account_data['username']
        linked_account.password = linked_account_data['password']
        linked_account.associated_user = linked_account_data['associated_user']

        db.session.commit()

        return jsonify({'message': 'Account updated successfully!'}), 200

    # Delete linked_account
    @app.route('/linked_accounts/<int:id>', methods=['DELETE'])
    def delete_linked_account(id):
        linked_account = LinkedAccount.query.get_or_404(id)

        db.session.delete(linked_account)
        db.session.commit()

        return jsonify({'message': 'Account removed successfully!'})