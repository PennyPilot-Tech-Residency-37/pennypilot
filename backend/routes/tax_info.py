from config import db
from flask import jsonify, request
from marshmallow import ValidationError
from models import TaxInfo
from schemas import tax_info_schema

def setup_tax_info_routes(app):
    # Create tax_info
    @app.route('/tax_info', methods=['POST'])
    def create_tax_info():
        try:
            tax_info_data = tax_info_schema.load(request.json)
        except ValidationError as e:
            app.logger.warning(f"Tax info validation failed: {e.messages}")
            return jsonify({"error": "Invalid tax info data."}), 400

        
        new_tax_info = TaxInfo(income1=tax_info_data['income1'],
                               income2=tax_info_data['income2'],
                                income3=tax_info_data['income3'],
                                income4=tax_info_data['income4'], 
                                income5=tax_info_data['income5'], 
                                tax_rate=tax_info_data['tax_rate'], 
                                total_income=tax_info_data['total_income'], 
                                tax_to_save=tax_info_data['tax_to_save'], 
                                total_saved=tax_info_data['total_saved'])

        db.session.add(new_tax_info)
        db.session.commit()

        return jsonify({"message": "Tax info added!"}), 201

    # Read tax_info
    @app.route('/tax_info/<int:id>', methods=['GET'])
    def read_tax_info(id):
        tax_info = TaxInfo.query.filter(TaxInfo.id == id).first_or_404()

        return tax_info_schema.jsonify(tax_info)

    # Update tax_info
    @app.route('/tax_info/<int:id>', methods=['PUT'])
    def update_tax_info(id):
        tax_info = TaxInfo.query.get_or_404(id)

        try:
            tax_info_data = tax_info_schema.load(request.json)
        except ValidationError as e:
            app.logger.warning(f"Tax info validation failed: {e.messages}")
            return jsonify({"error": "Invalid tax info data."}), 400

        
        tax_info.income1 = tax_info_data['income1']
        tax_info.income2 = tax_info_data['income2']
        tax_info.income3 = tax_info_data['income3']
        tax_info.income4 = tax_info_data['income4']
        tax_info.income5 = tax_info_data['income5']
        tax_info.tax_rate = tax_info_data['tax_rate']
        tax_info.total_income = tax_info_data['total_income']
        tax_info.tax_to_save = tax_info_data['tax_to_save']
        tax_info.total_saved = tax_info_data['total_saved']

        db.session.commit()

        return jsonify({'message': 'Tax info updated successfully!'}), 200

    # Delete tax_info
    @app.route('/tax_info/<int:id>', methods=['DELETE'])
    def delete_tax_info(id):
        tax_info = TaxInfo.query.get_or_404(id)

        db.session.delete(tax_info)
        db.session.commit()

        return jsonify({'message': 'Tax info removed successfully!'})