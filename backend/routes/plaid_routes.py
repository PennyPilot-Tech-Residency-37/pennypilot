from flask import request, jsonify
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
from plaid_client_config import client
from models import AccessToken
from key_utils import validate_key
from config import db
from datetime import datetime
import traceback

def setup_plaid_routes(app):

    @app.route('/api/transactions', methods=['GET'])
    def get_plaid_transactions():
        key = request.headers.get("key")
        if not key or not validate_key(db.session, key):
            return jsonify({"error": "Unauthorized access"}), 403

        user_id = request.args.get("user_id")
        start_date_str = request.args.get("start_date")
        end_date_str = request.args.get("end_date")

        if not user_id or not start_date_str or not end_date_str:
            return jsonify({"error": "Missing required parameters"}), 400

        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

        access_token_entry = AccessToken.query.filter_by(user_id=user_id).first()
        if not access_token_entry:
            return jsonify({"error": "Access token not found"}), 404

        try:
            request_data = TransactionsGetRequest(
                access_token=access_token_entry.access_token,
                start_date=start_date,
                end_date=end_date,
                options=TransactionsGetRequestOptions(count=100)
            )

            response = client.transactions_get(request_data)
            transactions = response.to_dict()["transactions"]

            return jsonify({
                "transactions": transactions,
                "analytics": {}
            })

        except Exception as e:
            app.logger.error("Error fetching transactions", exc_info=True)
            return jsonify({"error": "Failed to fetch transactions"}), 500
