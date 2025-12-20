import os
import pickle
import numpy as np
import tensorflow as tf
from keras.applications.densenet import DenseNet169, preprocess_input
from keras.preprocessing.image import load_img, img_to_array
from cv2 import resize, imread
import matplotlib.cm as cm
from tensorflow import keras

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "models", "xgb_model.pkl")


# ---------- CARGA DE MODELOS (UNA SOLA VEZ) ----------

DNN_MODEL = DenseNet169(
    include_top=False,
    input_shape=(224, 224, 3),
    pooling="avg",
    weights="imagenet"
)

with open(MODEL_PATH, "rb") as f:
    XGB_MODEL = pickle.load(f)


# ---------- PREDICCIÓN ----------

def predict_image(image_path, heatmap_output_path):
    # Leer imagen
    img = imread(image_path)
    img = resize(img, (224, 224))
    img_array = np.expand_dims(img, axis=0)

    # Extraer características
    features = DNN_MODEL.predict(img_array)

    # Predicción
    prediction = XGB_MODEL.predict(features)[0]
    confidence = float(np.max(XGB_MODEL.predict_proba(features)) * 100)

    label = "COVID" if prediction == 1 else "NORMAL"

    # Grad-CAM
    heatmap = generate_gradcam(image_path)
    save_gradcam(image_path, heatmap, heatmap_output_path)

    return label, confidence


# ---------- GRAD-CAM ----------

def generate_gradcam(img_path):
    img_size = (224, 224)
    last_conv_layer = "conv5_block32_concat"

    img = load_img(img_path, target_size=img_size)
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)

    grad_model = tf.keras.models.Model(
        [DNN_MODEL.inputs],
        [DNN_MODEL.get_layer(last_conv_layer).output, DNN_MODEL.output]
    )

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array)
        loss = predictions[:, 0]

    grads = tape.gradient(loss, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
    return heatmap.numpy()


def save_gradcam(img_path, heatmap, output_path, alpha=0.4):
    img = keras.preprocessing.image.load_img(img_path)
    img = keras.preprocessing.image.img_to_array(img)

    heatmap = np.uint8(255 * heatmap)
    jet = cm.get_cmap("jet")
    jet_colors = jet(np.arange(256))[:, :3]
    jet_heatmap = jet_colors[heatmap]

    jet_heatmap = keras.preprocessing.image.array_to_img(jet_heatmap)
    jet_heatmap = jet_heatmap.resize((img.shape[1], img.shape[0]))
    jet_heatmap = keras.preprocessing.image.img_to_array(jet_heatmap)

    superimposed_img = jet_heatmap * alpha + img
    superimposed_img = keras.preprocessing.image.array_to_img(superimposed_img)
    superimposed_img.save(output_path)
