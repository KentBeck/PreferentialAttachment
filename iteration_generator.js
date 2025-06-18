/**
 * Generates the number of iterations for a sample to exceed a random threshold
 * @param {number} growthRate - Percentage growth rate (e.g., 0.1 for 10% growth)
 * @param {number} initialSample - Starting sample value (default: 0.01)
 * @returns {number} - Number of iterations until sample exceeds random threshold
 */
function iterations(initialSample = 0.01, growthRate) {
  let sample = initialSample;
  let iterations = 0;

  while (sample > Math.random()) {
    sample *= 1 + growthRate;
    iterations++;
  }

  return iterations;
}

const samples = [];
for (let i = 0; i < 1000000; i++) {
  samples.push(iterations(0.05, 0.1));
}

// Generate histogram data
const histogram = {};
for (const sample of samples) {
  histogram[sample] = (histogram[sample] || 0) + 1;
}

// Print histogram data
for (const [value, count] of Object.entries(histogram).sort(
  (a, b) => parseInt(a[0]) - parseInt(b[0])
)) {
  console.log(`${value}: ${count}`);
}
