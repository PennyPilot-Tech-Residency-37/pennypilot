from flask import request, jsonify
from plaid_client_config import client
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
from key_utils import validate_key
from models import AccessToken
from datetime import datetime, timedelta
from config import db

def setup_get_transactions(app, session):
    @app.route("/api/transactions", methods=["GET"])
    def get_transactions():
        user_id = request.args.get("user_id")
        account_id = request.args.get("account_id")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        input_key = request.headers.get("key")

        if not validate_key(session, input_key):
            return jsonify({"error": "Invalid key"}), 403

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400

        try:
            token_entry = AccessToken.query.filter_by(user_id=user_id).first()
            if not token_entry:
                return jsonify({"error": "Access token not found"}), 404

            access_token = token_entry.access_token

            end = datetime.strptime(end_date, "%Y-%m-%d") if end_date else datetime.today()
            start = datetime.strptime(start_date, "%Y-%m-%d") if start_date else end - timedelta(days=30)

            request_obj = TransactionsGetRequest(
                access_token=access_token,
                start_date=start.date(),
                end_date=end.date(),
                options=TransactionsGetRequestOptions(
                    account_ids=[account_id] if account_id else None,
                    count=100,
                    offset=0
                )
            )

            response = client.transactions_get(request_obj)
            transactions = response["transactions"]

            total_income = sum(t["amount"] for t in transactions if t["amount"] < 0)
            total_expenses = sum(t["amount"] for t in transactions if t["amount"] > 0)
            total_savings = 0

            return jsonify({
                "transactions": transactions,
                "analytics": {
                    "totalIncome": abs(total_income),
                    "totalExpenses": total_expenses,
                    "totalSavings": total_savings,
                    "categoryBreakdown": [],
                    "monthlyTrend": []
                }
            })

        except Exception as e:
            app.logger.error("Error fetching transactions", exc_info=True)
            return jsonify({"error": "Failed to fetch transactions"}), 500
