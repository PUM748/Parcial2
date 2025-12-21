from flask import Flask, send_from_directory
from .config import Config
from .extensions import db, migrate, jwt, cors
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})


    # 👇 ESTA LÍNEA ES OBLIGATORIA
    from app import models  

    MEDIA_ROOT = os.path.join(os.getcwd(), "media")

    @app.route("/media/<path:filename>")
    def media_files(filename):
        return send_from_directory(MEDIA_ROOT, filename)

    from app.routes.diagnosis_routes import diagnosis_bp
    app.register_blueprint(diagnosis_bp, url_prefix="/api/diagnoses")

    return app
