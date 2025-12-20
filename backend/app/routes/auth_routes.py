from flask import Blueprint, request, jsonify
from app.models.doctor import Doctor
from app.extensions import db
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validar campos requeridos
    required_fields = ['email', 'password', 'full_name']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Falta el campo {field}"}), 400

    if Doctor.query.filter_by(email=data['email']).first():
        return jsonify({"error": "El email ya está registrado"}), 400

    hashed_password = generate_password_hash(data['password'])
    
    new_doctor = Doctor(
        email=data['email'],
        password=hashed_password,
        full_name=data['full_name'],
        specialty=data.get('specialty', '')
    )

    try:
        db.session.add(new_doctor)
        db.session.commit()
        return jsonify({"message": "Doctor registrado exitosamente"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"error": "Email y contraseña son requeridos"}), 400

    doctor = Doctor.query.filter_by(email=data['email']).first()

    if doctor and check_password_hash(doctor.password, data['password']):
        access_token = create_access_token(identity=str(doctor.id))
        return jsonify({
            "message": "Login exitoso",
            "access_token": access_token,
            "doctor": {
                "id": doctor.id,
                "full_name": doctor.full_name,
                "email": doctor.email
            }
        }), 200

    return jsonify({"error": "Credenciales inválidas"}), 401

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    current_doctor_id = get_jwt_identity()
    doctor = Doctor.query.get(current_doctor_id)

    if not doctor:
        return jsonify({"error": "Doctor no encontrado"}), 404

    return jsonify({
        "id": doctor.id,
        "email": doctor.email,
        "full_name": doctor.full_name,
        "specialty": doctor.specialty,
        "is_active": doctor.is_active,
        "created_at": doctor.created_at.isoformat() if doctor.created_at else None
    }), 200
