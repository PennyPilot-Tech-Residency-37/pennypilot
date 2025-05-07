from config import app, db
from routes.create_link_token import setup_create_link_token
from key_utils import validate_key
from routes.exchange_token import setup_exchange_token
import os

os.environ['REQUESTS_CA_BUNDLE'] = '/etc/ssl/cert.pem'

setup_create_link_token(app, db.session)
setup_exchange_token(app, db.session)

if __name__ == "__main__":
    app.run(debug=True)