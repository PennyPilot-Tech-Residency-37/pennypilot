from config import app, db
from routes.user import setup_user_routes
from routes.linked_account import setup_linked_account_routes
from routes.goal import setup_goal_routes
from routes.tax_info import setup_tax_info_routes
from routes.home import setup_home_route
from routes.create_link_token import setup_create_link_token
from key_utils import validate_key
from routes.transaction import setup_transaction_routes
from routes.exchange_token import setup_exchange_token
from routes.plaid_routes import setup_plaid_routes
import os

os.environ['REQUESTS_CA_BUNDLE'] = '/etc/ssl/cert.pem'

setup_create_link_token(app, db.session)
setup_exchange_token(app, db.session)
setup_transaction_routes(app)
setup_user_routes(app)
setup_plaid_routes(app)
setup_linked_account_routes(app)
setup_goal_routes(app)
setup_home_route(app)
setup_tax_info_routes(app)

if __name__ == "__main__":
    app.run(debug=True)