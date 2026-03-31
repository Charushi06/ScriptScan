from flask import Flask, render_template, request, jsonify
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import io
import base64
import os

app = Flask(__name__)

# Use absolute path so it works regardless of working directory
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mnist_model.h5')

try:
    model = load_model(MODEL_PATH)
    print(f"Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"ERROR loading model: {e}")
    model = None

def get_model():
    return model

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    model = get_model()
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500

    try:
        data = request.get_json()
        image_data = data['image']
        
        # Decode base64 image
        # Remove data:image/png;base64, header
        header, encoded = image_data.split(",", 1)
        binary_data = base64.b64decode(encoded)
        
        # Open image with PIL
        img = Image.open(io.BytesIO(binary_data))
        
        # Convert to grayscale and resize to 28x28
        img = img.convert('L')
        img = img.resize((28, 28))
        
        # Invert colors (MNIST is white on black, canvas is black on white usually)
        # But if canvas is black background with white brush, then no inversion needed.
        # Let's assume user draws with white on black canvas to match MNIST.
        
        img_array = np.array(img)
        
        # Normalize
        img_array = img_array / 255.0
        
        # Reshape for model
        img_array = img_array.reshape(1, 28, 28, 1)
        
        # Predict
        prediction = model.predict(img_array)
        predicted_digit = np.argmax(prediction)
        confidence = float(np.max(prediction))
        
        return jsonify({
            'digit': int(predicted_digit),
            'confidence': confidence
        })

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)
