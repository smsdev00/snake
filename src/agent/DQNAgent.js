import * as tf from '@tensorflow/tfjs';

export default class DQNAgent {
  constructor() {
    this.inputSize = 11;
    this.outputSize = 4;
    this.replayBuffer = [];
    this.bufferSize = 50000;
    this.batchSize = 64;
    this.gamma = 0.95;
    this.epsilon = 1.0;
    this.epsilonMin = 0.01;
    this.epsilonDecay = 0.995;
    this.learningRate = 0.001;
    this.model = this._buildModel();
  }

  _buildModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [this.inputSize], units: 256, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: this.outputSize, activation: 'linear' }));
    model.compile({ optimizer: tf.train.adam(this.learningRate), loss: 'meanSquaredError' });
    return model;
  }

  act(features) {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.outputSize);
    }
    return tf.tidy(() => {
      const input = tf.tensor2d([features]);
      const prediction = this.model.predict(input);
      return prediction.argMax(1).dataSync()[0];
    });
  }

  remember(state, action, reward, nextState, done) {
    this.replayBuffer.push({ state, action, reward, nextState, done });
    if (this.replayBuffer.length > this.bufferSize) {
      this.replayBuffer.shift();
    }
  }

  async train() {
    if (this.replayBuffer.length < this.batchSize) return;

    const batch = [];
    for (let i = 0; i < this.batchSize; i++) {
      batch.push(this.replayBuffer[Math.floor(Math.random() * this.replayBuffer.length)]);
    }

    const states = batch.map(b => b.state);
    const nextStates = batch.map(b => b.nextState);

    const [currentQs, nextQs] = tf.tidy(() => {
      const sTensor = tf.tensor2d(states);
      const nsTensor = tf.tensor2d(nextStates);
      return [
        this.model.predict(sTensor).arraySync(),
        this.model.predict(nsTensor).arraySync(),
      ];
    });

    const xBatch = [];
    const yBatch = [];

    for (let i = 0; i < this.batchSize; i++) {
      const { action, reward, done } = batch[i];
      const target = [...currentQs[i]];
      target[action] = done
        ? reward
        : reward + this.gamma * Math.max(...nextQs[i]);
      xBatch.push(states[i]);
      yBatch.push(target);
    }

    const xs = tf.tensor2d(xBatch);
    const ys = tf.tensor2d(yBatch);
    await this.model.fit(xs, ys, { epochs: 1, verbose: 0 });
    xs.dispose();
    ys.dispose();

    if (this.epsilon > this.epsilonMin) {
      this.epsilon *= this.epsilonDecay;
    }
  }

  async save() {
    await this.model.save('localstorage://snake-dqn');
    localStorage.setItem('snake-dqn-meta', JSON.stringify({ epsilon: this.epsilon }));
  }

  async load() {
    try {
      this.model = await tf.loadLayersModel('localstorage://snake-dqn');
      this.model.compile({ optimizer: tf.train.adam(this.learningRate), loss: 'meanSquaredError' });
      const meta = JSON.parse(localStorage.getItem('snake-dqn-meta') || '{}');
      this.epsilon = meta.epsilon ?? this.epsilonMin;
      return true;
    } catch {
      return false;
    }
  }

  async exportToFile() {
    // Save to a virtual IOHandler that captures the artifacts
    let modelJSON, weightData;
    await this.model.save(tf.io.withSaveHandler(async (artifacts) => {
      modelJSON = artifacts.modelTopology;
      const specs = artifacts.weightSpecs;
      weightData = Array.from(new Uint8Array(artifacts.weightData));
      return { modelArtifactsInfo: { dateSaved: new Date() } };
    }));
    return JSON.stringify({
      modelTopology: modelJSON,
      weightSpecs: this.model.getWeights().map(w => ({ name: w.name, shape: w.shape, dtype: w.dtype })),
      weightData,
      meta: { epsilon: this.epsilon },
    });
  }

  async importFromFile(jsonString) {
    const data = JSON.parse(jsonString);
    const weightData = new Uint8Array(data.weightData).buffer;
    const modelArtifacts = {
      modelTopology: data.modelTopology,
      weightSpecs: data.weightSpecs,
      weightData,
    };
    this.model.dispose();
    this.model = await tf.loadLayersModel(tf.io.fromMemory(modelArtifacts));
    this.model.compile({ optimizer: tf.train.adam(this.learningRate), loss: 'meanSquaredError' });
    this.epsilon = data.meta?.epsilon ?? this.epsilonMin;
  }

  dispose() {
    this.model.dispose();
  }
}
