from flask import request, jsonify
import plaid
from plaid_client_config import client
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
from key_utils import validate_key
from config import db

def setup_create_link_token(app, session):
    @app.route('/api/create_link_token', methods=['POST'])
    def create_link_token():
        data = request.get_json()
        input_key = data.get("key")

        if not validate_key(session, input_key):
            return jsonify({"error": "Invalid key"}), 403

        request_data = LinkTokenCreateRequest(
            client_name="PennyPilot",
            country_codes=[CountryCode('US')],
            language="en",
            products=[Products("auth")],
            user=LinkTokenCreateRequestUser(client_user_id="unique_user_id")
        )
        response = client.link_token_create(request_data)
        return jsonify(response.to_dict())