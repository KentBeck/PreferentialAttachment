/**
 * Generates the number of iterations for a sample to exceed a random threshold
 * @param {number} growthRate - Percentage growth rate (e.g., 0.1 for 10% growth)
 * @param {number} initialSample - Starting sample value (default: 0.01)
 * @returns {number} - Number of iterations until sample exceeds random threshold
 */
function generateIterations(growthRate, initialSample = 0.01) {
  let sample = initialSample;
  let iterations = 0;

  while (sample <= Math.random()) {
    sample *= 1 + growthRate;
    iterations++;
  }

  return iterations;
}

/**
 * Performs one step of preferential attachment
 * @param {number[]} values - Current array of values
 * @param {number} alpha - Power law exponent
 * @param {number} newElementProbability - Probability of adding new element (default: 0.1)
 * @returns {number[]} - Updated values array
 */
function preferentialAttachmentStep(
  values,
  alpha,
  newElementProbability = 0.1
) {
  // Calculate probabilities proportional to value^(1/(alpha-1))
  const weights = values.map((v) => Math.pow(v, 1 / (alpha - 1)));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // Choose element to increment based on weights
  let r = Math.random() * totalWeight;
  let cumsum = 0;

  for (let i = 0; i < values.length; i++) {
    cumsum += weights[i];
    if (r <= cumsum) {
      values[i]++;
      break;
    }
  }

  // Occasionally add new elements
  if (Math.random() < newElementProbability) {
    values.push(1);
  }

  return values;
}

/**
 * Generates a complete power law distribution using preferential attachment
 * @param {number} alpha - Power law exponent
 * @param {number} xMin - Minimum value (default: 1)
 * @param {number} steps - Number of growth steps (default: 1000)
 * @param {number} newElementProbability - Probability of adding new element (default: 0.1)
 * @returns {number[]} - Complete array of values from the power law distribution
 */
function generatePowerLawPreferential(
  alpha,
  xMin = 1,
  steps = 1000,
  newElementProbability = 0.1
) {
  // Create initial population
  let values = Array(Math.floor(xMin)).fill(1);

  // Growth process
  for (let step = 0; step < steps; step++) {
    values = preferentialAttachmentStep(values, alpha, newElementProbability);
  }

  // Return the complete distribution
  return values;
}

// Test both functions
console.log("=== Testing generateIterations ===");
console.log("Sample runs with 10% growth rate:");
for (let i = 0; i < 10; i++) {
  console.log(`Run ${i + 1}: ${generateIterations(0.1)} iterations`);
}

console.log("\n=== Testing generatePowerLawPreferential ===");
console.log("Single simulation with alpha=2.5:");
const powerLawDistribution = generatePowerLawPreferential(2.5);
console.log(`Generated ${powerLawDistribution.length} elements`);
console.log(
  `Sample values: ${powerLawDistribution.slice(0, 10).join(", ")}...`
);
console.log(
  `Value range: ${Math.min(...powerLawDistribution)} to ${Math.max(
    ...powerLawDistribution
  )}`
);

// Compare distributions
console.log("\n=== Comparing Distributions ===");

// Generate samples from iteration function (1000 samples)
const iterationSamples = [];
for (let i = 0; i < 1000; i++) {
  iterationSamples.push(generateIterations(0.1));
}

// Use the complete power law distribution
const powerLawSamples = powerLawDistribution;

// Calculate statistics
function getStats(samples, label) {
  const sum = samples.reduce((a, b) => a + b, 0);
  const avg = sum / samples.length;
  const max = Math.max(...samples);
  const min = Math.min(...samples);

  console.log(`\n${label}:`);
  console.log(`  Average: ${avg.toFixed(3)}`);
  console.log(`  Min: ${min}, Max: ${max}`);
  console.log(`  Range: ${max - min}`);
}

getStats(iterationSamples, "generateIterations (0.1 growth)");
getStats(powerLawSamples, "generatePowerLawPreferential (alpha=2.5)");

// Show frequency distributions
function showFrequency(samples, label, maxShow = 20) {
  const freq = new Map();
  samples.forEach((val) => {
    freq.set(val, (freq.get(val) || 0) + 1);
  });

  const sorted = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]);

  console.log(`\n${label} - Top ${maxShow} frequencies:`);
  for (let i = 0; i < Math.min(maxShow, sorted.length); i++) {
    const [value, count] = sorted[i];
    const pct = ((count / samples.length) * 100).toFixed(1);
    console.log(`  ${value}: ${count} (${pct}%)`);
  }
}

showFrequency(iterationSamples, "generateIterations");
showFrequency(powerLawSamples, "generatePowerLawPreferential");

// Create ASCII graphs
function createHistogramGraph(samples, title, maxBars = 50) {
  console.log(`\n=== ${title} Histogram ===`);

  // Create frequency map
  const freq = new Map();
  samples.forEach((val) => {
    freq.set(val, (freq.get(val) || 0) + 1);
  });

  // Sort by value
  const sorted = Array.from(freq.entries()).sort((a, b) => a[0] - b[0]);

  // Find max frequency for scaling
  const maxFreq = Math.max(...freq.values());
  const maxBarLength = 60;

  // Show histogram
  for (const [value, count] of sorted.slice(0, maxBars)) {
    const barLength = Math.floor((count / maxFreq) * maxBarLength);
    const bar = "█".repeat(Math.max(1, barLength));
    const pct = ((count / samples.length) * 100).toFixed(1);
    console.log(`${value.toString().padStart(3)}: ${bar} ${count} (${pct}%)`);
  }

  if (sorted.length > maxBars) {
    console.log(
      `... (showing first ${maxBars} of ${sorted.length} unique values)`
    );
  }
}

createHistogramGraph(iterationSamples, "generateIterations Distribution");
createHistogramGraph(
  powerLawSamples,
  "generatePowerLawPreferential Distribution"
);

// Create log-log plot data for power law analysis
function analyzeLogLog(samples, title) {
  console.log(`\n=== ${title} Log-Log Analysis ===`);

  // Create frequency map
  const freq = new Map();
  samples.forEach((val) => {
    freq.set(val, (freq.get(val) || 0) + 1);
  });

  // Convert to log-log data
  const logData = Array.from(freq.entries())
    .filter(([value, count]) => value > 0 && count > 0)
    .map(([value, count]) => ({
      value,
      count,
      logValue: Math.log10(value),
      logCount: Math.log10(count),
    }))
    .sort((a, b) => a.value - b.value);

  console.log("Value\tCount\tlog(Value)\tlog(Count)");
  logData.slice(0, 20).forEach(({ value, count, logValue, logCount }) => {
    console.log(
      `${value}\t${count}\t${logValue.toFixed(3)}\t\t${logCount.toFixed(3)}`
    );
  });

  return logData;
}

const iterationsLogData = analyzeLogLog(iterationSamples, "generateIterations");
const powerLawLogData = analyzeLogLog(
  powerLawSamples,
  "generatePowerLawPreferential"
);

// Generate CSV data for external plotting
function generateCSV(samples, filename) {
  const freq = new Map();
  samples.forEach((val) => {
    freq.set(val, (freq.get(val) || 0) + 1);
  });

  const sorted = Array.from(freq.entries()).sort((a, b) => a[0] - b[0]);

  console.log(`\n=== ${filename} CSV Data ===`);
  console.log("value,frequency,percentage");

  sorted.forEach(([value, count]) => {
    const pct = ((count / samples.length) * 100).toFixed(3);
    console.log(`${value},${count},${pct}`);
  });
}

console.log("\n" + "=".repeat(60));
console.log("CSV DATA FOR EXTERNAL PLOTTING");
console.log("=".repeat(60));

generateCSV(iterationSamples, "generateIterations");
generateCSV(powerLawSamples, "generatePowerLawPreferential");

// Export functions
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    generateIterations,
    generatePowerLawPreferential,
  };
}
