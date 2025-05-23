from config import db
from flask import jsonify, request
from marshmallow import ValidationError
from models import LinkedAccount
from schemas import linked_account_schema
from key_utils import validate_key
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid_client_config import client
from models import AccessToken

def setup_linked_account_routes(app):
    @app.route('/linked_accounts', methods=['POST'])
    def create_linked_account():
        try:
            linked_account_data = linked_account_schema.load(request.json)
        except ValidationError as e:
            app.logger.warning(f"Linked account validation failed: {e.messages}")
            return jsonify({"error": "Invalid linked account data"}), 400
        
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
            app.logger.warning(f"Linked account validation failed: {e.messages}")
            return jsonify({"error": "Invalid linked account data"}), 400

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
    def get_linked_accounts(user_id):
        app.logger.info("Fetching linked accounts for user")

        key = request.headers.get("key")
        if not key or not validate_key(db.session, key):
            return jsonify({"error": "Unauthorized access"}), 403

        access_token_entry = AccessToken.query.filter_by(user_id=user_id).first()
        if not access_token_entry:
            app.logger.info("Fetching linked accounts for user")
            return jsonify({"error": "Access token not found"}), 404

        try:
            plaid_request = AccountsGetRequest(access_token=access_token_entry.access_token)
            response = client.accounts_get(plaid_request)
            accounts = response.to_dict()["accounts"]

            print(f"✅ Found {len(accounts)} account(s)")
            return jsonify(accounts), 200

        except Exception as e:
            app.logger.error("Error fetching linked accounts", exc_info=True)
            return jsonify({"error": str(e)}), 500