from config import ma
from marshmallow import fields

class AccessTokenSchema(ma.Schema):
    user_id = fields.String(required=True)
    access_token = fields.String(required=True)
    item_id = fields.String(required=True)

    class Meta:
        fields = ('id', 'user_id', 'access_token', 'item_id')

access_token_schema = AccessTokenSchema()