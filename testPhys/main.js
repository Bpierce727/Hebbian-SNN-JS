// main.js

/* -------------------- Input Control Elements -------------------- */

const input1Checkbox = document.getElementById('input1');
const input2Checkbox = document.getElementById('input2');
const randomInputCheckbox = document.getElementById('randomInput');
const manualInputCheckbox = document.getElementById('manualInput');

// Variable to track manual input
let manualInputActive = false;

// Event listener for manual input
window.addEventListener('keydown', function(event) {
    if (event.key === 'm' || event.key === 'M') {
        if (manualInputCheckbox.checked) {
            manualInputActive = true;
        }
    }
});


/* -------------------- Neural Network Visualization Setup -------------------- */

// Access and initialize the network and reward canvases
const networkCanvas = document.getElementById('network');
const networkCtx = networkCanvas.getContext('2d');

const rewardCanvas = document.getElementById('reward');
const rewardCtx = rewardCanvas.getContext('2d');

/* -------------------- Resize Canvases Dynamically -------------------- */

function resizeCanvases() {
    // Resize world canvas
    const worldContainer = document.querySelector('.canvas-container');
    const worldCanvas = document.getElementById('world');
    worldCanvas.width = worldContainer.clientWidth;
    worldCanvas.height = worldContainer.clientHeight;

    // Resize reward canvas
    rewardCanvas.width = rewardCanvas.clientWidth;
    rewardCanvas.height = rewardCanvas.clientHeight;

    // Resize network canvas
    networkCanvas.width = networkCanvas.parentElement.clientWidth;
    networkCanvas.height = networkCanvas.parentElement.clientHeight;
}

// Initial resize
resizeCanvases();

// Resize canvases on window resize
window.addEventListener('resize', resizeCanvases);

/* -------------------- SNN Initialization -------------------- */

// Define Neural Network Parameters
const numInputs = 2;                 // Input neurons: sine and cosine of time (CPG)
const numHiddenExcitatory = 6;       // Number of excitatory neurons in the hidden layer
const numHiddenInhibitory = 2;       // Number of inhibitory neurons in the hidden layer
const totalHiddenNeurons = numHiddenExcitatory + numHiddenInhibitory; // Total hidden neurons
const numOutputs = 4;                // Output neurons: joint torques (two upper and two lower legs)

// Initialize the SNN with inhibitory neurons
const snn = new SNN(numInputs, numHiddenExcitatory, numHiddenInhibitory, numOutputs);

// Time variable for rhythmic input
let time = 0;

// Current reward
let currentReward = 0;

// Neuron visualization positions
let neuronPositions = []; // Ensure this is declared before it's used

/* -------------------- Calculate Neuron Positions -------------------- */

function calculateNeuronPositions() {
    const layerCounts = [
        numInputs,
        totalHiddenNeurons, // Total hidden neurons
        numOutputs
    ];
    const layerY = [100, Physics.render.options.height / 2, Physics.render.options.height - 100]; // Y positions for each layer

    let index = 0;
    for (let l = 0; l < layerCounts.length; l++) {
        const count = layerCounts[l];
        const xSpacing = networkCanvas.width / (count + 1);
        for (let i = 0; i < count; i++) {
            neuronPositions[index] = {
                x: (i + 1) * xSpacing,
                y: layerY[l]
            };
            index++;
        }
    }
}

// Initialize neuron positions after defining the function
calculateNeuronPositions();

/* -------------------- Neural Network Visualization -------------------- */

function drawNeuralNetwork() {
    networkCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);

    // Draw synapses (connections)
    snn.synapses.forEach(syn => {
        const preIndex = snn.neurons.indexOf(syn.pre);
        const postIndex = snn.neurons.indexOf(syn.post);
        const prePos = neuronPositions[preIndex];
        const postPos = neuronPositions[postIndex];
        const weight = syn.weight;

        if (Math.abs(weight) > 0.02) { // Threshold to display
            networkCtx.beginPath();
            networkCtx.moveTo(prePos.x, prePos.y);
            networkCtx.lineTo(postPos.x, postPos.y);
            networkCtx.strokeStyle = weight > 0 ? 'rgba(0, 0, 255, 0.5)' : 'rgba(255, 0, 0, 0.5)';
            networkCtx.lineWidth = Math.min(Math.abs(weight) * 10, 5); // Cap line width
            networkCtx.stroke();
        }
    });

    // Draw neurons with activation-based coloring
    snn.neurons.forEach((neuron, index) => {
        networkCtx.beginPath();
        networkCtx.arc(neuronPositions[index].x, neuronPositions[index].y, 10, 0, 2 * Math.PI);

        // Determine activation level
        let activation = neuron.spiked ? 1.0 : 0.0;

        if (neuron.id.startsWith('Input')) {
            // Input neurons
            networkCtx.fillStyle = `rgba(144, 238, 144, ${activation})`; // Light Green
        } else if (neuron.id.startsWith('HiddenExc')) {
            // Hidden excitatory neurons
            networkCtx.fillStyle = `rgba(250, 128, 114, ${activation})`; // Light Salmon
        } else if (neuron.id.startsWith('HiddenInh')) {
            // Hidden inhibitory neurons
            networkCtx.fillStyle = `rgba(255, 192, 203, ${activation})`; // Pink
        } else if (neuron.id.startsWith('Output')) {
            // Output neurons
            networkCtx.fillStyle = `rgba(135, 206, 250, ${activation})`; // Light Sky Blue
        }

        networkCtx.fill();
        networkCtx.strokeStyle = '#000000';
        networkCtx.stroke();
    });

    // Add labels for each layer
    networkCtx.fillStyle = '#000000';
    networkCtx.font = '14px Arial';
    networkCtx.fillText('Input Layer', 10, 90);
    networkCtx.fillText('Hidden Layer', 10, Physics.render.options.height / 2 - 10);
    networkCtx.fillText('Output Layer', 10, Physics.render.options.height - 10);
}

/* -------------------- Motor Output Application -------------------- */

// Assuming you have defined `Body`, `upperLegLeft`, etc., in physics.js

function applyMotorOutputs(spikedOutputs) {
    const torqueScale = 0.05;
    // Map spikes to joint torques
    // For simplicity, each spike adds a force in the y-direction

    spikedOutputs.forEach(neuron => {
        const outputIndex = snn.neurons.indexOf(neuron) - (numInputs + totalHiddenNeurons);
        switch (outputIndex) {
            case 0:
                Physics.Body.applyForce(Physics.upperLegLeft, Physics.upperLegLeft.position, { x: 0, y: -torqueScale });
                break;
            case 1:
                Physics.Body.applyForce(Physics.lowerLegLeft, Physics.lowerLegLeft.position, { x: 0, y: -torqueScale });
                break;
            case 2:
                Physics.Body.applyForce(Physics.upperLegRight, Physics.upperLegRight.position, { x: 0, y: -torqueScale });
                break;
            case 3:
                Physics.Body.applyForce(Physics.lowerLegRight, Physics.lowerLegRight.position, { x: 0, y: -torqueScale });
                break;
            default:
                break;
        }
    });
}

/* -------------------- Simulation Update -------------------- */

// Update function for each simulation step

function update(currentTime, dt) {
    // Increment time
    time += dt;

    // Initialize input array
    let input = [0.0, 0.0];

    // Generate rhythmic input (CPG) if enabled
    if (input1Checkbox.checked || input2Checkbox.checked) {
        const sineFrequency = 0.05; // You can make this adjustable
        const inputSignal = Math.sin(time * sineFrequency);
        if (input1Checkbox.checked) {
            input[0] = inputSignal > 0 ? 1.0 : 0.0;
        }
        if (input2Checkbox.checked) {
            input[1] = inputSignal < 0 ? 1.0 : 0.0;
        }
    }

    // Add random input if enabled
    if (randomInputCheckbox.checked) {
        input[0] = Math.random() > 0.95 ? 1.0 : input[0]; // 5% chance to spike
        input[1] = Math.random() > 0.95 ? 1.0 : input[1];
    }

    // Add manual input if active
    if (manualInputActive) {
        input[0] = 1.0;
        input[1] = 1.0;
        manualInputActive = false; // Reset after use
    }

    // Inject inputs into the SNN
    snn.injectInputs(input);

    // Update the SNN
    const spikedNeurons = snn.update(currentTime, dt);

    // Calculate the starting index of the output neurons
    const outputStartIndex = numInputs + totalHiddenNeurons;

    // Extract output spikes
    const spikedOutputs = snn.neurons.slice(outputStartIndex, outputStartIndex + numOutputs).filter(n => n.spiked);

    // Apply motor outputs based on spikes
    applyMotorOutputs(spikedOutputs);

    // Calculate reward (forward movement)
    const reward = Physics.torso.position.x;
    currentReward = reward;

    // Draw the neural network visualization
    drawNeuralNetwork();

    // Draw the current reward
    drawReward();
}

/* -------------------- Reward Display -------------------- */

function drawReward() {
    rewardCtx.clearRect(0, 0, rewardCanvas.width, rewardCanvas.height);
    rewardCtx.font = '16px Arial';
    rewardCtx.fillStyle = '#000000';
    rewardCtx.fillText(`Current Reward: ${currentReward.toFixed(2)}`, 10, 30);
}

/* -------------------- Event Listeners -------------------- */

// Attach an event listener to update the neural network before each physics update
Physics.Events.on(Physics.engine, 'beforeUpdate', function(event) {
    // Calculate the current simulation time in seconds
    const currentTime = Physics.engine.timing.timestamp / 1000; // Convert to seconds
    const dt = Physics.engine.timing.delta / 1000; // Convert to seconds

    update(currentTime, dt);
});

// Handle window resize within JavaScript
window.addEventListener('resize', function() {
    // Update renderer dimensions
    Physics.Render.lookAt(Physics.render, {
        min: { x: 0, y: 0 },
        max: { x: document.querySelector('.canvas-container').clientWidth, y: document.querySelector('.canvas-container').clientHeight }
    });

    // Optionally, reposition bodies if necessary
    Physics.Body.setPosition(Physics.ground, { x: document.querySelector('.canvas-container').clientWidth / 2, y: document.querySelector('.canvas-container').clientHeight - 30 });

    Physics.Body.setPosition(Physics.topWall, { x: document.querySelector('.canvas-container').clientWidth / 2, y: -10 });
    Physics.Body.setPosition(Physics.leftWall, { x: -10, y: document.querySelector('.canvas-container').clientHeight / 2 });
    Physics.Body.setPosition(Physics.rightWall, { x: document.querySelector('.canvas-container').clientWidth + 10, y: document.querySelector('.canvas-container').clientHeight / 2 });

    // Recalculate neuron positions for visualization
    calculateNeuronPositions();
});
