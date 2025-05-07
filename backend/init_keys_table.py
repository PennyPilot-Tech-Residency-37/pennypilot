from key_utils import KeyStorage
from config import db, app
from base import Base

with app.app_context():
    Base.metadata.create_all(db.engine)
    print("✅ 'keys' table created in the database.")
