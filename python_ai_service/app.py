"""
Food Rescue AI Service - REST API Server
Provides endpoints for Node.js Express backend and direct AI client requests.
Endpoints:
- POST /api/ai/predict-shelf-life
- POST /api/ai/smart-match
- POST /api/ai/calculate-impact
- GET  /api/ai/health
"""

import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

from shelf_life_model import calculate_shelf_life
from smart_matcher import match_donation_with_recipients
from impact_calculator import calculate_impact

app = Flask(__name__)
CORS(app) # Allow Cross-Origin Requests from Express / React frontend

@app.route('/', methods=['GET'])
@app.route('/api/ai/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ONLINE',
        'service': 'Food Rescue AI & Logistics Microservice',
        'version': '1.0.0',
        'endpoints': [
            '/api/ai/predict-shelf-life',
            '/api/ai/smart-match',
            '/api/ai/calculate-impact'
        ]
    }), 200

@app.route('/api/ai/predict-shelf-life', methods=['POST'])
def predict_shelf_life_endpoint():
    try:
        data = request.get_json() or {}
        food_type = data.get('food_type', 'COOKED_MEALS')
        storage_condition = data.get('storage_condition', 'REFRIGERATED')
        ambient_temp = data.get('ambient_temp_celsius')
        packaging = data.get('packaging_type', 'SEALED_CONTAINERS')
        hours_elapsed = data.get('hours_since_prepared', 0.0)
        freshness = data.get('initial_freshness_rating', 10.0)

        result = calculate_shelf_life(
            food_type=food_type,
            storage_condition=storage_condition,
            ambient_temp_celsius=ambient_temp,
            packaging_type=packaging,
            hours_since_prepared=hours_elapsed,
            initial_freshness_rating=freshness
        )
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/ai/smart-match', methods=['POST'])
def smart_match_endpoint():
    try:
        data = request.get_json() or {}
        donation = data.get('donation', {})
        shelters = data.get('shelters', [])
        volunteers = data.get('volunteers', [])

        result = match_donation_with_recipients(donation, shelters, volunteers)
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/ai/calculate-impact', methods=['POST'])
def calculate_impact_endpoint():
    try:
        data = request.get_json() or {}
        quantity_kg = data.get('quantity_kg', 10.0)
        food_type = data.get('food_type', 'COOKED_MEALS')

        result = calculate_impact(quantity_kg=quantity_kg, food_type=food_type)
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"🚀 Food Rescue AI Service starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
