from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.patient import Patient
from app.models.diagnosis import Diagnosis
from app.extensions import db
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_dashboard_summary():
    doctor_id = get_jwt_identity()
    
    # 1. Total Pacientes del Doctor
    total_patients = Patient.query.filter_by(doctor_id=doctor_id).count()
    
    # 2. Total Diagnósticos del Doctor
    total_diagnoses = Diagnosis.query.filter_by(doctor_id=doctor_id).count()
    
    # 3. Estadísticas generales (ej. conteo por tipo de resultado)
    # Agrupamos por el texto del resultado (ej. "COVID: Positivo")
    # Nota: Si el resultado es complejo, esto podría necesitar ajuste.
    stats_query = db.session.query(
        Diagnosis.result, func.count(Diagnosis.id)
    ).filter_by(doctor_id=doctor_id).group_by(Diagnosis.result).all()
    
    stats = {r[0]: r[1] for r in stats_query}
    
    # 4. Actividad reciente (últimos 5 diagnósticos)
    recent_diagnoses = Diagnosis.query.filter_by(doctor_id=doctor_id)\
        .order_by(Diagnosis.created_at.desc())\
        .limit(5).all()
        
    recent_activity = []
    for d in recent_diagnoses:
        recent_activity.append({
            "id": d.id,
            "patient_name": d.patient.full_name if d.patient else "Desconocido",
            "result": d.result,
            "date": d.created_at.isoformat() if d.created_at else None
        })
        
    return jsonify({
        "total_patients": total_patients,
        "total_diagnoses": total_diagnoses,
        "stats": stats,
        "recent_activity": recent_activity
    }), 200
