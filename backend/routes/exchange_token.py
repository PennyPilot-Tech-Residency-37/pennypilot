from flask import request, jsonify
from plaid_client_config import client
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from key_utils import validate_key
from models import AccessToken
from config import db

def setup_exchange_token(app, session):
    @app.route("/api/exchange_public_token", methods=["POST"])
    def exchange_public_token():
        data = request.get_json()
        public_token = data.get("public_token")
        input_key = data.get("key")
        user_id = data.get("user_id")

        if not validate_key(session, input_key):
            return jsonify({"error": "Invalid key"}), 403

        try:
            exchange_request = ItemPublicTokenExchangeRequest(public_token=public_token)
            exchange_response = client.item_public_token_exchange(exchange_request)
            access_token = exchange_response["access_token"]
            item_id = exchange_response["item_id"]

            # Store the access token and item ID
            token_entry = AccessToken(user_id=user_id, access_token=access_token, item_id=item_id)
            db.session.add(token_entry)
            db.session.commit()

            return jsonify({
                "message": "Access token stored successfully"
            }), 200

        except Exception as e:
            app.logger.error("Plaid token exchange failed", exc_info=True)
            return jsonify({"error": "Plaid token exchange failed"}), 500


    @app.route("/api/remove_bank_account", methods=["POST"])
    def remove_bank_account():
        data = request.get_json()
        user_id = data.get("user_id")
        input_key = data.get("key")

        if not validate_key(session, input_key):
            return jsonify({"error": "Invalid key"}), 403

        try:
            token_entry = AccessToken.query.filter_by(user_id=user_id).first()
            if not token_entry:
                return jsonify({"message": "No bank account found for this user"}), 404

            db.session.delete(token_entry)
            db.session.commit()

            return jsonify({"message": "Bank account removed successfully"}), 200

        except Exception as e:
            app.logger.error("Failed to remove bank account", exc_info=True)
            return jsonify({"error": "Failed to remove bank account"}), 500
