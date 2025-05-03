import hashlib
import os
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker

Base = sa.orm.declarative_base()

class KeyStorage(Base):
    __tablename__ = 'keys'
    id = sa.Column(sa.Integer, primary_key=True)
    salt = sa.Column(sa.String, nullable=False)
    hashed_key = sa.Column(sa.String, nullable=False)

def generate_salt() -> str:
    return os.urandom(16).hex()

def hash_key(key: str, salt: str) -> str:
    return hashlib.sha256((salt + key).encode()).hexdigest()

def store_key(session, key: str):
    salt = generate_salt()
    hashed = hash_key(key, salt)
    new_entry = KeyStorage(salt=salt, hashed_key=hashed)
    session.add(new_entry)
    session.commit()

def validate_key(session, input_key: str) -> bool:
    stored_entry = session.query(KeyStorage).filter_by(hashed_key=hash_key(input_key, stored_entry.salt)).first()
    return stored_entry is not None if stored_entry else False