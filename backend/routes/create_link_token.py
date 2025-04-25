import plaid
from flask import jsonify
from plaid_client_config import client
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.country_code import CountryCode

def setup_create_link_token(app):
    @app.route('/create_link_token', methods=['POST'])
    def create_link_token():
        request_data = LinkTokenCreateRequest(
            client_name="PennyPilot",
            country_codes=[CountryCode('US')],
            language="en",
            user=LinkTokenCreateRequestUser(client_user_id="unique_user_id")
        )
        response = client.link_token_create(request_data)
        return jsonify(response.to_dict())