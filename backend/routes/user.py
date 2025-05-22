from config import db
from flask import jsonify, request
from marshmallow import ValidationError
from models import User
from schemas import user_schema

def setup_user_routes(app):
    # Create user
    @app.route('/users', methods=['POST'])
    def create_user():
        try:
            user_data = user_schema.load(request.json)
        except ValidationError as e:
            app.logger.warning(f"User validation failed: {e.messages}")
            return jsonify({"error": "Invalid user data."}), 400

        
        new_user = User(name=user_data['name'], email=user_data['email'], phone=user_data['phone'])

        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User added!"}), 201

    # Read user
    @app.route('/users/<int:id>', methods=['GET'])
    def read_user(id):
        user = User.query.filter(User.id == id).first_or_404()

        return user_schema.jsonify(user)

    # Update user
    @app.route('/users/<int:id>', methods=['PUT'])
    def update_user(id):
        user = User.query.get_or_404(id)

        try:
            user_data = user_schema.load(request.json)
        except ValidationError as e:
            app.logger.warning(f"User validation failed: {e.messages}")
            return jsonify({"error": "Invalid user data."}), 400
        
        user.name = user_data['name']
        user.email = user_data['email']
        user.phone = user_data['phone']

        db.session.commit()

        return jsonify({'message': 'User updated successfully!'}), 200

    # Delete user
    @app.route('/users/<int:id>', methods=['DELETE'])
    def delete_user(id):
        user = User.query.get_or_404(id)

        db.session.delete(user)
        db.session.commit()

        return jsonify({'message': 'User removed successfully!'})