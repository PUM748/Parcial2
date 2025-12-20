from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.patient import Patient
from app.extensions import db

patient_bp = Blueprint('patients', __name__)

@patient_bp.route('/', methods=['GET'])
@jwt_required()
def get_patients():
    # Opción: Filtrar por doctor o ver todos. 
    # Por ahora mostramos todos para facilitar la búsqueda en atención primaria.
    patients = Patient.query.order_by(Patient.created_at.desc()).all()
    
    result = []
    for p in patients:
        result.append({
            "id": p.id,
            "full_name": p.full_name,
            "dni": p.dni,
            "age": p.age,
            "gender": p.gender,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "doctor_id": p.doctor_id
        })
    
    return jsonify(result), 200

@patient_bp.route('/', methods=['POST'])
@jwt_required()
def create_patient():
    current_doctor_id = get_jwt_identity()
    data = request.get_json()
    
    required_fields = ['full_name', 'dni', 'age', 'gender']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Falta el campo {field}"}), 400

    # Verificar DNI duplicado
    if Patient.query.filter_by(dni=data['dni']).first():
        return jsonify({"error": "Ya existe un paciente con este DNI"}), 400

    new_patient = Patient(
        doctor_id=current_doctor_id,
        full_name=data['full_name'],
        dni=data['dni'],
        age=data['age'],
        gender=data['gender']
    )

    try:
        db.session.add(new_patient)
        db.session.commit()
        return jsonify({
            "message": "Paciente creado exitosamente", 
            "patient": {
                "id": new_patient.id,
                "full_name": new_patient.full_name
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@patient_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_patient(id):
    patient = Patient.query.get_or_404(id)
    return jsonify({
        "id": patient.id,
        "full_name": patient.full_name,
        "dni": patient.dni,
        "age": patient.age,
        "gender": patient.gender,
        "doctor_id": patient.doctor_id,
        "created_at": patient.created_at.isoformat() if patient.created_at else None
    }), 200

@patient_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_patient(id):
    patient = Patient.query.get_or_404(id)
    data = request.get_json()

    if 'full_name' in data:
        patient.full_name = data['full_name']
    if 'age' in data:
        patient.age = data['age']
    if 'gender' in data:
        patient.gender = data['gender']
    # DNI generalmente no se cambia, pero se puede agregar si es necesario

    try:
        db.session.commit()
        return jsonify({"message": "Paciente actualizado"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@patient_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_patient(id):
    patient = Patient.query.get_or_404(id)
    
    try:
        db.session.delete(patient)
        db.session.commit()
        return jsonify({"message": "Paciente eliminado"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
