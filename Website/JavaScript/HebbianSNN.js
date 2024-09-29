/**
 * 
 * 
 *          Define the Neuron and Synapse Classes
 * 
 * 
 */

// Neuron class representing a single neuron in the network
class Neuron {
    constructor() {
        this.potential = 0; // Membrane potential
        this.threshold = 1; // Threshold for firing
        this.refractory = 5; // Refractory period in time steps
        this.refractoryTimer = 0;
        this.spike = false;
    }

    // Update the neuron's state
    update(inputs) {
        if (this.refractoryTimer > 0) {
            this.refractoryTimer--;
            this.spike = false;
            return false;
        }

        // Integrate inputs
        this.potential += inputs;

        // Check for spike
        if (this.potential >= this.threshold) {
            this.spike = true;
            this.potential = 0;
            this.refractoryTimer = this.refractory;
            return true;
        } else {
            this.spike = false;
            return false;
        }
    }

    // Reset neuron state
    reset() {
        this.potential = 0;
        this.spike = false;
        this.refractoryTimer = 0;
    }
}

// Synapse class representing a connection between two neurons
class Synapse {
    constructor(preNeuron, postNeuron, weight = Math.random()) {
        this.preNeuron = preNeuron;
        this.postNeuron = postNeuron;
        this.weight = weight;
    }

    // Transmit spike from preNeuron to postNeuron
    transmit() {
        if (this.preNeuron.spike) {
            this.postNeuron.potential += this.weight;
            return this.weight;
        }
        return 0;
    }

    // Hebbian learning rule: Δw = η * preSpike * postSpike
    hebbianUpdate(eta) {
        if (this.preNeuron.spike && this.postNeuron.spike) {
            this.weight += eta;
        }
    }
}


/**
 * 
 * 
 *                  Create the network
 * 
 * 
 */


// Network class containing neurons and synapses
class Network {
    constructor(numNeurons, numSynapses, eta = 0.01) {
        this.neurons = [];
        this.synapses = [];
        this.eta = eta; // Learning rate

        // Initialize neurons
        for (let i = 0; i < numNeurons; i++) {
            this.neurons.push(new Neuron());
        }

        // Initialize synapses with random connections
        for (let i = 0; i < numSynapses; i++) {
            const pre = this.neurons[Math.floor(Math.random() * numNeurons)];
            const post = this.neurons[Math.floor(Math.random() * numNeurons)];
            if (pre !== post) { // Avoid self-connections
                this.synapses.push(new Synapse(pre, post));
            }
        }
    }

    // Step the network by one time step
    step(inputNeurons = []) {
        // Inject external spikes
        inputNeurons.forEach(idx => {
            if (this.neurons[idx]) {
                this.neurons[idx].potential += this.neurons[idx].threshold;
            }
        });

        // Transmit spikes
        const transmitted = this.synapses.map(syn => syn.transmit());

        // Update neurons
        this.neurons.forEach((neuron, idx) => {
            neuron.update(0); // Inputs are already added via synapses
        });

        // Apply Hebbian learning
        this.synapses.forEach(syn => syn.hebbianUpdate(this.eta));
    }

    // Reset the network state
    reset() {
        this.neurons.forEach(neuron => neuron.reset());
    }
}

/**
 * 
 * 
 *           Optimize with Typed Arrays
 * 
 * 
 */

// Optimized Network using Typed Arrays
class OptimizedNetwork {
    constructor(numNeurons, numSynapses, eta = 0.01) {
        this.numNeurons = numNeurons;
        this.numSynapses = numSynapses;
        this.eta = eta;

        // Using Float32Array for neuron potentials
        this.potentials = new Float32Array(numNeurons);
        this.spikes = new Uint8Array(numNeurons);
        this.refractoryTimers = new Uint8Array(numNeurons);
        this.threshold = 1.0;
        this.refractoryPeriod = 5;

        // Synapse connections
        this.pre = new Uint32Array(numSynapses);
        this.post = new Uint32Array(numSynapses);
        this.weights = new Float32Array(numSynapses);

        // Initialize synapses with random connections and weights
        for (let i = 0; i < numSynapses; i++) {
            let preIdx, postIdx;
            do {
                preIdx = Math.floor(Math.random() * numNeurons);
                postIdx = Math.floor(Math.random() * numNeurons);
            } while (preIdx === postIdx); // Avoid self-connections
            this.pre[i] = preIdx;
            this.post[i] = postIdx;
            this.weights[i] = Math.random();
        }
    }

    // Step the network
    step(inputNeurons = []) {
        // Inject external spikes
        inputNeurons.forEach(idx => {
            this.potentials[idx] += this.threshold;
        });

        // Transmit spikes
        for (let i = 0; i < this.numSynapses; i++) {
            const preIdx = this.pre[i];
            if (this.spikes[preIdx]) {
                this.potentials[this.post[i]] += this.weights[i];
            }
        }

        // Update neurons and determine spikes
        this.spikes.fill(0); // Reset spikes
        for (let i = 0; i < this.numNeurons; i++) {
            if (this.refractoryTimers[i] > 0) {
                this.refractoryTimers[i]--;
                continue;
            }

            if (this.potentials[i] >= this.threshold) {
                this.spikes[i] = 1;
                this.potentials[i] = 0;
                this.refractoryTimers[i] = this.refractoryPeriod;
            }
        }

        // Hebbian learning
        for (let i = 0; i < this.numSynapses; i++) {
            const preIdx = this.pre[i];
            const postIdx = this.post[i];
            if (this.spikes[preIdx] && this.spikes[postIdx]) {
                this.weights[i] += this.eta;
                // Optional: Clamp weights to prevent runaway growth
                if (this.weights[i] > 1.0) this.weights[i] = 1.0;
            }
        }
    }

    // Reset the network state
    reset() {
        this.potentials.fill(0);
        this.spikes.fill(0);
        this.refractoryTimers.fill(0);
    }
}
