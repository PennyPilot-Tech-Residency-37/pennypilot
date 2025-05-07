from config import db, app
from sqlalchemy.orm import sessionmaker
from key_utils import store_key
from base import Base

with app.app_context():
    Base.metadata.create_all(db.engine)

    Session = sessionmaker(bind=db.engine)
    session = Session()

    # Store the dev key
    store_key(session, "dev-test-key")
    print("✅ dev-test-key has been stored.")
