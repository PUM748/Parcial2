import os
import uuid
import random
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.diagnosis import Diagnosis
from app.models.patient import Patient
from app.ml.covid_predictor import predict_image

diagnosis_bp = Blueprint("diagnosis", __name__)

UPLOAD_FOLDER = "media/uploads/x-ray"
HEATMAP_FOLDER = "media/heatmap"

@diagnosis_bp.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    # 1️⃣ Validar datos básicos
    if "image" not in request.files:
        return {"error": "No image provided"}, 400
    
    patient_id = request.form.get("patient_id")
    disease_type = request.form.get("disease_type", "COVID") # Default a COVID

    if not patient_id:
        return {"error": "patient_id required"}, 400
        
    doctor_id = get_jwt_identity()

    # Verificar que el paciente exista
    patient = Patient.query.get(patient_id)
    if not patient:
        return {"error": "Paciente no encontrado"}, 404

    image = request.files["image"]

    # 2️⃣ Preparar carpetas
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(HEATMAP_FOLDER, exist_ok=True)

    filename = f"{uuid.uuid4().hex}.png"
    image_path = os.path.join(UPLOAD_FOLDER, filename)
    heatmap_path = os.path.join(HEATMAP_FOLDER, filename)
    
    # Guardar imagen original
    image.save(image_path)

    # 3️⃣ Lógica de Predicción según enfermedad
    label = "Desconocido"
    confidence = 0.0
    
    # Rutas relativas para DB
    db_image_path = f"uploads/x-ray/{filename}"
    db_heatmap_path = f"heatmap/{filename}"

    try:
        if disease_type.upper() == "COVID":
            # Predicción REAL
            label, confidence = predict_image(image_path, heatmap_path)
        
        elif disease_type.upper() in ["IRA", "EDA", "HIPERTENSION", "DIABETES"]:
            # --- MOCK / SIMULACIÓN ---
            # Aquí se conectarán los modelos reales en el futuro.
            # Por ahora, simulamos un procesamiento copiando la imagen como "heatmap"
            # y devolviendo un resultado aleatorio.
            
            # Simular heatmap copiando la original (o creando una imagen vacía si se prefiere)
            import shutil
            shutil.copy(image_path, heatmap_path)
            
            # Resultados simulados
            possible_outcomes = ["Positivo", "Negativo", "Riesgo Alto", "Riesgo Bajo"]
            label = random.choice(possible_outcomes)
            confidence = round(random.uniform(70.0, 99.0), 2)
            
        else:
            return {"error": f"Tipo de enfermedad '{disease_type}' no soportado"}, 400

        # 4️⃣ Guardar en BD
        diagnosis = Diagnosis(
            patient_id=patient_id,
            doctor_id=doctor_id,
            image_path=db_image_path,
            heatmap_path=db_heatmap_path,
            result=f"{disease_type}: {label}", # Guardamos el tipo junto con el resultado
            confidence=confidence
        )

        db.session.add(diagnosis)
        db.session.commit()

        base_url = request.host_url.rstrip("/")

        return jsonify({
            "diagnosis_id": diagnosis.id,
            "disease_type": disease_type,
            "result": label,
            "confidence": float(confidence),
            "image_url": f"{base_url}/media/{db_image_path}",
            "heatmap_url": f"{base_url}/media/{db_heatmap_path}"
        })

    except Exception as e:
        print(f"Error en predicción: {e}")
        return {"error": "Error interno durante el procesamiento"}, 500

@diagnosis_bp.route("/patient/<int:patient_id>", methods=["GET"])
@jwt_required()
def get_patient_history(patient_id):
    diagnoses = Diagnosis.query.filter_by(patient_id=patient_id).order_by(Diagnosis.id.desc()).all()
    
    base_url = request.host_url.rstrip("/")
    result = []
    
    for d in diagnoses:
        result.append({
            "id": d.id,
            "date": "Fecha no registrada", # Idealmente agregar created_at al modelo Diagnosis
            "result": d.result,
            "confidence": float(d.confidence),
            "image_url": f"{base_url}/media/{d.image_path}",
            "heatmap_url": f"{base_url}/media/{d.heatmap_path}"
        })
        
    return jsonify(result), 200
