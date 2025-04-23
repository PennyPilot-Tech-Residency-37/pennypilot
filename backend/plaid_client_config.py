import plaid
from plaid.api import plaid_api
from dotenv import load_dotenv
import os

load_dotenv()
CLIENT_ID = os.getenv('PLAID_CLIENT_ID')
SECRET = os.getenv('PLAID_SECRET')
ENV = os.getenv('PLAID_ENV')

configuration = plaid.Configuration(
    host=getattr(plaid.Environment, ENV),
    api_key={'clientId': CLIENT_ID, 'secret': SECRET}
)

client = plaid_api.PlaidApi(plaid.ApiClient(configuration))