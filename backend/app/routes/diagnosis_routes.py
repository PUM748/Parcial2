import os
import uuid
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.diagnosis import Diagnosis
from app.ml.covid_predictor import predict_image

diagnosis_bp = Blueprint("diagnosis", __name__)

UPLOAD_FOLDER = "media/uploads/x-ray"
HEATMAP_FOLDER = "media/heatmap"

@diagnosis_bp.route("/", methods=["GET"])
@jwt_required()
def get_diagnoses():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Filtros
    patient_id = request.args.get('patient_id')
    result_filter = request.args.get('result')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    query = Diagnosis.query

    if patient_id:
        query = query.filter_by(patient_id=patient_id)
    
    if result_filter:
        if request.args.get('result') == "NO COVID":
            query = query.filter(Diagnosis.result.ilike("%NORMAL%"))
        else:
            query = query.filter(Diagnosis.result.ilike(f"%{result_filter}%"))
        
    if date_from:
        query = query.filter(Diagnosis.created_at >= date_from)
        
    if date_to:
        query = query.filter(Diagnosis.created_at <= date_to)

    # Ordenar por defecto descendente
    query = query.order_by(Diagnosis.id.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    diagnoses = pagination.items
    
    base_url = request.host_url.rstrip("/")
    data = []
    
    for d in diagnoses:
        # Obtener nombre del paciente si es posible
        patient_name = d.patient.full_name if d.patient else "Desconocido"
        
        data.append({
            "id": d.id,
            "patient_name": patient_name,
            "result": d.result,
            "confidence": float(d.confidence),
            "image_url": f"{base_url}/media/{d.image_path}",
            "heatmap_url": f"{base_url}/media/{d.heatmap_path}",
            "created_at": d.created_at.isoformat() if d.created_at else None
        })
        
    return jsonify({
        "page": pagination.page,
        "per_page": per_page,
        "total": pagination.total,
        "data": data
    }), 200

@diagnosis_bp.route("/predict", methods=["POST"])
def predict():
    # 1️⃣ Validar imagen
    if "image" not in request.files:
        return {"error": "No image provided"}, 400

    image = request.files["image"]
    patient_id = request.form.get("patient_id")
    doctor_id = request.form.get("doctor_id")

    if not patient_id or not doctor_id:
        return {"error": "patient_id and doctor_id required"}, 400

    # 2️⃣ Guardar imagen original
    filename = f"{uuid.uuid4().hex}.png"
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    image_path = os.path.join(UPLOAD_FOLDER, filename)
    image.save(image_path)

    # 3️⃣ Generar ruta heatmap
    os.makedirs(HEATMAP_FOLDER, exist_ok=True)
    heatmap_path = os.path.join(HEATMAP_FOLDER, filename)

    # 4️⃣ 🔥 PREDICCIÓN REAL (AQUÍ SÍ EXISTEN LAS VARIABLES)
    label, confidence = predict_image(image_path, heatmap_path)

    # 5️⃣ Guardar en BD (rutas relativas)
    diagnosis = Diagnosis(
        patient_id=patient_id,
        doctor_id=doctor_id,
        image_path=f"uploads/x-ray/{filename}",
        heatmap_path=f"heatmap/{filename}",
        result=label,
        confidence=confidence
    )

    db.session.add(diagnosis)
    db.session.commit()

    base_url = request.host_url.rstrip("/")

    return jsonify({
        "result": label,
        "confidence": confidence,
        "image_url": f"{base_url}/media/uploads/x-ray/{filename}",
        "heatmap_url": f"{base_url}/media/heatmap/{filename}"
    })
