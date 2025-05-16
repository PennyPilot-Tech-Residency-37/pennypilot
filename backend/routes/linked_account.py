from config import db
from flask import jsonify, request
from marshmallow import ValidationError
from models import LinkedAccount
from schemas import linked_account_schema
from key_utils import validate_key

def setup_linked_account_routes(app):
    @app.route('/linked_accounts', methods=['POST'])
    def create_linked_account():
        try:
            linked_account_data = linked_account_schema.load(request.json)
        except ValidationError as e:
            return jsonify(e.messages), 400
        
        new_linked_account = LinkedAccount(
            username=linked_account_data['username'],
            password=linked_account_data['password'],
            associated_user=linked_account_data['associated_user']
        )

        db.session.add(new_linked_account)
        db.session.commit()

        return jsonify({"message": "Account created!"}), 201

    @app.route('/linked_accounts/<int:id>', methods=['GET'])
    def read_linked_account(id):
        linked_account = LinkedAccount.query.get_or_404(id)
        return linked_account_schema.jsonify(linked_account)

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

    @app.route('/linked_accounts/<int:id>', methods=['DELETE'])
    def delete_linked_account(id):
        linked_account = LinkedAccount.query.get_or_404(id)

        db.session.delete(linked_account)
        db.session.commit()

        return jsonify({'message': 'Account removed successfully!'})

    @app.route('/api/linked_accounts/<string:user_id>', methods=['GET'])
    def get_linked_account_by_user_id(user_id):
        print(f"📡 Received request for linked account of user_id: {user_id}")

        key = request.headers.get("key")
        if not key or not validate_key(db.session, key):
            print(f"🚫 Invalid or missing API key for user_id: {user_id}")
            return jsonify({"error": "Unauthorized access"}), 403

        linked_account = LinkedAccount.query.filter_by(associated_user=user_id).first()
        if not linked_account:
            print(f"❌ No linked account found for user_id: {user_id}")
            return jsonify({"error": "Linked account not found"}), 404

        print(f"✅ Found linked account: {linked_account.username}")
        return linked_account_schema.jsonify(linked_account), 200