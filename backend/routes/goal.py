from config import db
from flask import jsonify, request
from marshmallow import ValidationError
from models import Goal
from schemas import goal_schema

def setup_goal_routes(app):
    # Create goal
    @app.route('/goals', methods=['POST'])
    def create_goal():
        try:
            goal_data = goal_schema.load(request.json)
        except ValidationError as e:
            return jsonify(e.messages), 400
        
        new_goal = Goal(target_amount=goal_data['target_amount'], current_amount=goal_data['current_amount'], deadline=goal_data['deadline'])

        db.session.add(new_goal)
        db.session.commit()

        return jsonify({"message": "Goal created!"}), 201

    # Read goal
    @app.route('/goals/<int:id>', methods=['GET'])
    def read_goal(id):
        goal = Goal.query.filter(Goal.id == id).first_or_404()

        return goal_schema.jsonify(goal)

    # Update goal
    @app.route('/goals/<int:id>', methods=['PUT'])
    def update_goal(id):
        goal = Goal.query.get_or_404(id)

        try:
            goal_data = goal_schema.load(request.json)
        except ValidationError as e:
            return jsonify(e.messages), 400
        
        goal.target_amount = goal_data['target_amount']
        goal.current_amount = goal_data['current_amount']
        goal.deadline = goal_data['deadline']

        db.session.commit()

        return jsonify({'message': 'Goal updated successfully!'}), 200

    # Delete goal
    @app.route('/goals/<int:id>', methods=['DELETE'])
    def delete_goal(id):
        goal = Goal.query.get_or_404(id)

        db.session.delete(goal)
        db.session.commit()

        return jsonify({'message': 'Goal removed successfully!'})