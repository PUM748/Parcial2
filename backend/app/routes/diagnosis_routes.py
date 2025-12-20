import os
import uuid
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.diagnosis import Diagnosis
from app.ml.covid_predictor import predict_image

diagnosis_bp = Blueprint("diagnosis", __name__)

UPLOAD_FOLDER = "media/uploads/x-ray"
HEATMAP_FOLDER = "media/heatmap"


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
