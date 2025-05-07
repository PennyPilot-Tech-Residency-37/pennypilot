from config import db, app

class AccessToken(db.Model):
    __tablename__ = 'access_tokens'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String, nullable=False)
    access_token = db.Column(db.String, nullable=False)
    item_id = db.Column(db.String, nullable=False)

with app.app_context():
    db.create_all()