from flask import request, jsonify
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
from plaid_client_config import client
from key_utils import validate_key
from config import db

def setup_create_link_token(app, session):
    @app.route('/api/create_link_token', methods=['POST'])
    def create_link_token():
        data = request.get_json()
        input_key = data.get("key")
        user_id = data.get("user_id")

        print("📦 Payload received:", data)
        print("🔐 user_id:", user_id)

        if not validate_key(session, input_key):
            return jsonify({"error": "Invalid API key"}), 403

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400

        request_data = LinkTokenCreateRequest(
            client_name="PennyPilot",
            country_codes=[CountryCode('US')],
            language="en",
            products=[Products("auth"), Products("transactions")],
            user=LinkTokenCreateRequestUser(client_user_id=user_id),
        )

        try:
            response = client.link_token_create(request_data)
            link_token_data = response.to_dict()

            print("✅ Link token created:", link_token_data.get("link_token"))
            return jsonify(link_token_data)

        except Exception as e:
            app.logger.error(f"❌ Plaid link token creation error: {str(e)}")
            return jsonify({"error": "Failed to create link token"}), 500
