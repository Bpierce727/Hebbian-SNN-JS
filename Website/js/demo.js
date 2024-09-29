// Select Canvas and Context
const canvas = document.getElementById('networkCanvas');
const ctx = canvas.getContext('2d');

// Set Canvas Dimensions
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Control Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');

// Simulation Variables
let animationId;
let simulationSpeed = 5; // Default speed

// Update Speed Display
speedSlider.addEventListener('input', (e) => {
    simulationSpeed = parseInt(e.target.value);
    speedValue.textContent = `${simulationSpeed}x`;
});

// Placeholder for Neural Network Model
// Replace this with your actual Hebbian learning model
class NeuralNetwork {
    constructor() {
        this.neurons = [];
        this.synapses = [];
        this.initializeNetwork();
    }

    initializeNetwork() {
        const neuronCount = 20;
        const radius = Math.min(canvas.width, canvas.height) / 2 - 50;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Create Neurons in a Circular Layout
        for (let i = 0; i < neuronCount; i++) {
            const angle = (i / neuronCount) * (2 * Math.PI);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            this.neurons.push(new Neuron(x, y, 15));
        }

        // Create Synapses (Fully Connected)
        for (let i = 0; i < neuronCount; i++) {
            for (let j = i + 1; j < neuronCount; j++) {
                this.synapses.push(new Synapse(this.neurons[i], this.neurons[j]));
            }
        }
    }

    update() {
        // Update neurons based on your Hebbian learning model
        // Example: Randomly activate neurons
        this.neurons.forEach(neuron => neuron.update());
    }

    draw() {
        // Draw Synapses
        this.synapses.forEach(synapse => synapse.draw());

        // Draw Neurons
        this.neurons.forEach(neuron => neuron.draw());
    }
}

class Neuron {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.active = false;
        this.activationTimer = 0;
    }

    update() {
        // Simple activation logic (for demonstration)
        if (Math.random() < 0.01) { // 1% chance to activate
            this.active = true;
            this.activationTimer = 30; // Frames to stay active
        }

        if (this.active) {
            this.activationTimer--;
            if (this.activationTimer <= 0) {
                this.active = false;
            }
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = this.active ? '#ff5722' : '#00adb5';
        ctx.fill();
        ctx.strokeStyle = '#eeeeee';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class Synapse {
    constructor(neuronA, neuronB) {
        this.neuronA = neuronA;
        this.neuronB = neuronB;
        this.weight = Math.random(); // Initial synaptic weight
    }

    draw() {
        const alpha = this.weight; // Use weight as opacity
        ctx.beginPath();
        ctx.moveTo(this.neuronA.x, this.neuronA.y);
        ctx.lineTo(this.neuronB.x, this.neuronB.y);
        ctx.strokeStyle = `rgba(0, 173, 181, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Initialize Neural Network
let neuralNetwork = new NeuralNetwork();

// Animation Loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    neuralNetwork.update();
    neuralNetwork.draw();

    // Control Simulation Speed
    for (let i = 0; i < simulationSpeed; i++) {
        // You can adjust how many updates per frame based on speed
        // For more accurate control, consider using delta time
    }

    animationId = requestAnimationFrame(animate);
}

// Start Simulation
startBtn.addEventListener('click', () => {
    if (!animationId) {
        animate();
    }
});

// Stop Simulation
stopBtn.addEventListener('click', () => {
    cancelAnimationFrame(animationId);
    animationId = null;
});

// Initial Draw
neuralNetwork.draw();
