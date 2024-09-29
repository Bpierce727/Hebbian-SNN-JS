// snn.js

// Neuron class implementing Leaky Integrate-and-Fire model with adaptive threshold
class Neuron {
    constructor(id, threshold = 1.0, leak = 0.9, isInhibitory = false) {
        this.id = id;
        this.baseThreshold = threshold;
        this.threshold = threshold;
        this.leak = leak;
        this.potential = 0;
        this.spiked = false;
        this.outgoing = []; // Synapses
        this.incoming = []; // Synapses
        this.lastSpikeTime = -Infinity;
        this.isInhibitory = isInhibitory;
        this.firingRate = 0; // For homeostatic plasticity
    }

    receiveSpike(weight, currentTime) {
        // Adjust potential based on incoming spike and whether the neuron is inhibitory
        const effect = this.isInhibitory ? -weight : weight;
        this.potential += effect;
    }

    update(currentTime, dt) {
        // Leak the potential
        this.potential *= this.leak;

        // Adaptive threshold (homeostatic plasticity)
        this.threshold += (this.spiked ? 0.01 : -0.001);
        this.threshold = Math.max(this.baseThreshold * 0.5, Math.min(this.threshold, this.baseThreshold * 1.5));

        // Check for spike
        if (this.potential >= this.threshold) {
            this.spiked = true;
            this.potential = 0; // Reset after spike
            this.lastSpikeTime = currentTime;
            this.firingRate += 1;
        } else {
            this.spiked = false;
        }

        // Decay firing rate over time
        this.firingRate *= 0.99;

        return this.spiked;
    }

    reset() {
        this.spiked = false;
    }
}

// Synapse class with Spike-Timing-Dependent Plasticity (STDP)
class Synapse {
    constructor(pre, post, weight = Math.random() * 0.1 - 0.05, delay = 0) {
        this.pre = pre; // Pre-synaptic neuron
        this.post = post; // Post-synaptic neuron
        this.weight = weight;
        this.delay = delay; // Transmission delay in seconds
        this.spikeQueue = []; // Queue to handle delayed spikes
        this.maxWeight = 1.0;
        this.minWeight = -1.0;
        this.A_plus = 0.01; // STDP potentiation factor
        this.A_minus = 0.012; // STDP depression factor
        this.tau_plus = 20e-3; // STDP time constant for potentiation
        this.tau_minus = 20e-3; // STDP time constant for depression
    }

    transmitSpike(currentTime, dt) {
        // Handle queued spikes for delayed transmission
        this.spikeQueue = this.spikeQueue.filter(spike => {
            if (currentTime >= spike.time + this.delay) {
                this.post.receiveSpike(this.weight, currentTime);
                return false; // Remove spike from queue
            }
            return true;
        });

        if (this.pre.spiked) {
            // Add spike to queue with current time
            this.spikeQueue.push({ time: currentTime });
        }
    }

    stdpUpdate(currentTime, dt) {
        // Spike-Timing-Dependent Plasticity (STDP)
        if (this.pre.spiked) {
            const delta_t = this.post.lastSpikeTime - this.pre.lastSpikeTime;
            if (delta_t > 0) {
                // Pre before post -> Potentiation
                const deltaW = this.A_plus * Math.exp(-delta_t / this.tau_plus);
                this.weight += deltaW;
            }
        }

        if (this.post.spiked) {
            const delta_t = this.post.lastSpikeTime - this.pre.lastSpikeTime;
            if (delta_t < 0) {
                // Post before pre -> Depression
                const deltaW = -this.A_minus * Math.exp(delta_t / this.tau_minus);
                this.weight += deltaW;
            }
        }

        // Clamp weights to prevent runaway growth
        this.weight = Math.max(Math.min(this.weight, this.maxWeight), this.minWeight);
    }

    // For backward compatibility
    hebbianUpdate(currentTime, dt) {
        this.stdpUpdate(currentTime, dt);
    }
}

// SNN Network class
class SNN {
    constructor(numInputs, numHiddenExcitatory, numHiddenInhibitory, numOutputs) {
        this.numInputs = numInputs;
        this.numHiddenExcitatory = numHiddenExcitatory;
        this.numHiddenInhibitory = numHiddenInhibitory;
        this.numOutputs = numOutputs;

        this.neurons = [];
        this.synapses = [];

        // Create input neurons
        for (let i = 0; i < numInputs; i++) {
            this.neurons.push(new Neuron(`Input_${i}`));
        }

        // Create hidden excitatory neurons
        for (let i = 0; i < numHiddenExcitatory; i++) {
            this.neurons.push(new Neuron(`HiddenExc_${i}`));
        }

        // Create hidden inhibitory neurons
        for (let i = 0; i < numHiddenInhibitory; i++) {
            this.neurons.push(new Neuron(`HiddenInh_${i}`, 1.0, 0.9, true));
        }

        // Create output neurons
        for (let i = 0; i < numOutputs; i++) {
            this.neurons.push(new Neuron(`Output_${i}`));
        }

        const totalNeurons = this.neurons.length;

        // Fully connect all neurons (excluding inputs and outputs)
        for (let i = 0; i < totalNeurons; i++) {
            for (let j = 0; j < totalNeurons; j++) {
                if (i !== j) {
                    const preNeuron = this.neurons[i];
                    const postNeuron = this.neurons[j];

                    // No connections from outputs to others
                    if (preNeuron.id.startsWith('Output')) continue;

                    // No connections to inputs
                    if (postNeuron.id.startsWith('Input')) continue;

                    // Create synapse
                    const syn = new Synapse(preNeuron, postNeuron);
                    this.synapses.push(syn);
                    preNeuron.outgoing.push(syn);
                    postNeuron.incoming.push(syn);
                }
            }
        }
    }

    // Inject input spikes based on external input values
    injectInputs(inputValues) {
        for (let i = 0; i < this.numInputs; i++) {
            const input = inputValues[i];
            // Simple encoding: if input value > 0.5, emit a spike
            if (input > 0.5) {
                this.neurons[i].receiveSpike(1.0, this.currentTime);
            }
        }
    }

    update(currentTime, dt) {
        this.currentTime = currentTime;

        // First, transmit spikes from all synapses
        this.synapses.forEach(syn => syn.transmitSpike(currentTime, dt));

        // Update all neurons and collect spikes
        const spikedNeurons = [];
        this.neurons.forEach(neuron => {
            const spiked = neuron.update(currentTime, dt);
            if (spiked) {
                spikedNeurons.push(neuron);
            }
        });

        // Update synaptic weights based on STDP
        this.synapses.forEach(syn => syn.stdpUpdate(currentTime, dt));

        return spikedNeurons;
    }

    reset() {
        this.neurons.forEach(neuron => neuron.reset());
    }
}

// Make SNN accessible globally
window.SNN = SNN;
