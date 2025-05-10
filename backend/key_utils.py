import hashlib
import os
import sqlalchemy as sa
from base import Base
from sqlalchemy.orm import sessionmaker

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
    entries = session.query(KeyStorage).all()
    for entry in entries:
        if hash_key(input_key, entry.salt) == entry.hashed_key:
            return True
    return False
