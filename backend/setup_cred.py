import os
import firebase_admin
from firebase_admin import credentials
from dotenv import load_dotenv

# Load the .env file
load_dotenv()

# Get the path to the JSON file from the .env
cred_path = os.getenv("GOOGLE_CREDENTIALS")

# Initialize Firebase using the file directly
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)