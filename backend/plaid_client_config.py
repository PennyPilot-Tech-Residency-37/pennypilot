import plaid
from plaid.api import plaid_api
from dotenv import load_dotenv
import os
from key_utils import validate_key
from config import db

load_dotenv()
CLIENT_ID = os.getenv('PLAID_CLIENT_ID', 'your_client_id')
SECRET = os.getenv('PLAID_SECRET', 'your_secret')
ENV = os.getenv('PLAID_ENV', 'Sandbox')  # Default to Sandbox environment

# key validation already being handled in create_link_token file, no need for this
# if not validate_key(db.session, SECRET):  
#     raise ValueError("Invalid Plaid API secret key.")

configuration = plaid.Configuration(
    host=getattr(plaid.Environment, ENV),
    api_key={'clientId': CLIENT_ID, 'secret': SECRET}
)

client = plaid_api.PlaidApi(plaid.ApiClient(configuration))