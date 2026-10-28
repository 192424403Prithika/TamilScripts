/**
 * Web Worker for client-side TensorFlow.js real-time character recognition.
 * Keeps UI 100% responsive at 60 FPS while running WebGL/WASM inference.
 */

import * as tf from '@tensorflow/tfjs';

let model: tf.LayersModel | null = null;
let unicodeMap: any[] = [];

// Load unicode map and TF.js model on worker boot
async function initWorker() {
  try {
    const mapRes = await fetch('/unicode_map.json');
    unicodeMap = await mapRes.json();

    model = await tf.loadLayersModel('/models/recognizer/model.json');
    // Warm up model
    const dummy = tf.zeros([1, 64, 64, 1]);
    const out = model.predict(dummy) as tf.Tensor;
    out.dispose();
    dummy.dispose();

    self.postMessage({ type: 'READY' });
  } catch (err: any) {
    self.postMessage({ type: 'ERROR', error: err.message });
  }
}

initWorker();

self.onmessage = async (e: MessageEvent) => {
  const { type, pixels, timestamp } = e.data;

  if (type === 'PREDICT') {
    const t0 = performance.now();

    if (!model || unicodeMap.length === 0) {
      self.postMessage({ type: 'PREDICTION_RESULT', error: 'Model not initialized' });
      return;
    }

    try {
      tf.tidy(() => {
        // pixels: Float32Array of length 64 * 64 (values 0.0 to 1.0)
        const tensor = tf.tensor4d(pixels, [1, 64, 64, 1], 'float32');
        const logits = model!.predict(tensor) as tf.Tensor;
        const probs = tf.softmax(logits).dataSync();

        // Get top 5 indices
        const indices = Array.from(probs.keys())
          .sort((a, b) => probs[b] - probs[a])
          .slice(0, 5);

        const predictions = indices.map((idx) => {
          const info = unicodeMap[idx] || {
            char: 'அ',
            transliteration: 'a',
            unicode: 'U+0B85',
            category: 'vowel',
            meaning: 'Tamil character',
            stroke_count: 2
          };
          return {
            class_id: idx,
            char: info.char,
            transliteration: info.transliteration,
            confidence: Number(probs[idx].toFixed(4)),
            unicode: info.unicode,
            category: info.category,
            meaning: info.meaning,
            stroke_count: info.stroke_count
          };
        });

        const latency_ms = Number((performance.now() - t0).toFixed(2));

        self.postMessage({
          type: 'PREDICTION_RESULT',
          predictions,
          top_prediction: predictions[0],
          latency_ms,
          modality: 'tfjs_webgl_worker',
          timestamp
        });
      });
    } catch (err: any) {
      self.postMessage({ type: 'PREDICTION_RESULT', error: err.message });
    }
  }
};
