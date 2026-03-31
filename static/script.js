document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const clearBtn = document.getElementById('clearBtn');
    const predictBtn = document.getElementById('predictBtn');
    const resultBox = document.getElementById('predictionResult');
    const confidenceText = document.getElementById('confidenceScore');

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // Set initial canvas background to black to match MNIST training data (if we inverted, we'd use white)
    // But in app.py we assumed we might invert. Let's stick to black background, white lines.
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function draw(e) {
        if (!isDrawing) return;
        
        // Get mouse position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        [lastX, lastY] = [x, y];
    }

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];
    });

    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    clearBtn.addEventListener('click', () => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        resultBox.textContent = '?';
        confidenceText.textContent = 'Confidence: -';
    });

    predictBtn.addEventListener('click', () => {
        const dataURL = canvas.toDataURL('image/png');
        
        fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: dataURL }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
                return;
            }
            resultBox.textContent = data.digit;
            confidenceText.textContent = `Confidence: ${(data.confidence * 100).toFixed(2)}%`;
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Something went wrong!');
        });
    });
});
