from app.extensions import db
from datetime import datetime


class Diagnosis(db.Model):
    __tablename__ = "diagnoses"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, nullable=False)
    doctor_id = db.Column(db.Integer, nullable=False)

    image_path = db.Column(db.String(255), nullable=False)
    heatmap_path = db.Column(db.String(255), nullable=False)

    result = db.Column(db.String(50), nullable=False)
    confidence = db.Column(db.Numeric(5, 2))

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )