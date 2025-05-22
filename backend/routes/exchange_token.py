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

            token_entry = AccessToken(user_id=user_id, access_token=access_token, item_id=item_id)
            db.session.add(token_entry)
            db.session.commit()

            return jsonify({
                "message": "Access token stored successfully"
            })

        
        except Exception as e:
            app.logger.error("Plaid token exchange failed", exc_info=True)
            return jsonify({"error": "Plaid token exchange failed."}), 500
