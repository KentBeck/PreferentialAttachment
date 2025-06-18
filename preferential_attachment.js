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
 * Basic preferential attachment sampler - returns one sample index
 * @param {number[]} counts - Current count array
 * @returns {number} - Selected index
 */
function samplePreferentialAttachment(counts) {
  const totalSum = counts.reduce((sum, count) => sum + count, 0);

  if (totalSum === 0) {
    // If all values are 0, select randomly
    return Math.floor(Math.random() * counts.length);
  }

  // Use preferential attachment: probability proportional to current value
  const random = Math.random() * totalSum;
  let cumulativeSum = 0;

  for (let j = 0; j < counts.length; j++) {
    cumulativeSum += counts[j];
    if (random <= cumulativeSum) {
      return j;
    }
  }

  // Fallback (should never reach here)
  return counts.length - 1;
}

/**
 * Run preferential attachment simulation collecting N samples
 * @param {number} arraySize - Size of the array
 * @param {number} iterations - Number of samples to collect
 * @returns {number[]} - Final counts array
 */
function preferentialAttachment(arraySize = 10, iterations = 1000) {
  // Initialize array with all zeros
  const counts = new Array(arraySize).fill(0);

  console.log("Initial state:", counts);

  // Collect N samples
  for (let i = 0; i < iterations; i++) {
    // Get one sample
    const selectedIndex = samplePreferentialAttachment(counts);

    // Increment the selected index
    counts[selectedIndex]++;

    // Log progress every 100 iterations
    if ((i + 1) % 100 === 0) {
      console.log(`After ${i + 1} iterations:`, counts);
    }
  }

  console.log("\nFinal result:", counts);
  console.log(
    "Total iterations:",
    counts.reduce((sum, count) => sum + count, 0)
  );

  // Show the distribution as percentages
  const total = counts.reduce((sum, count) => sum + count, 0);
  const percentages = counts.map(
    (count) => ((count / total) * 100).toFixed(1) + "%"
  );
  console.log("Distribution:", percentages);

  // Sort and display histogram
  displaySortedHistogram(counts);

  return counts;
}

/**
 * Basic preferential attachment sampler with initial weights - returns one sample index
 * @param {number[]} counts - Current count array
 * @returns {number} - Selected index
 */
function samplePreferentialAttachmentWithWeights(counts) {
  // Calculate probabilities based on current counts
  const totalWeight = counts.reduce((sum, count) => sum + count, 0);

  // Select index based on weighted probability
  const random = Math.random();
  let cumulativeProbability = 0;

  for (let j = 0; j < counts.length; j++) {
    cumulativeProbability += counts[j] / totalWeight;
    if (random <= cumulativeProbability) {
      return j;
    }
  }

  // Fallback (should never reach here)
  return counts.length - 1;
}

/**
 * Alternative implementation with explicit probability calculation and initial weights
 * @param {number} arraySize - Size of the array
 * @param {number} iterations - Number of samples to collect
 * @param {number} initialWeight - Initial weight for each index
 * @returns {number[]} - Final counts array
 */
function preferentialAttachmentWithWeights(
  arraySize = 10,
  iterations = 1000,
  initialWeight = 1
) {
  // Initialize array with small initial weights to avoid division by zero
  const counts = new Array(arraySize).fill(initialWeight);

  console.log("Initial state (with base weights):", counts);

  // Collect N samples
  for (let i = 0; i < iterations; i++) {
    // Get one sample
    const selectedIndex = samplePreferentialAttachmentWithWeights(counts);

    // Increment the selected index
    counts[selectedIndex]++;

    // Log progress every 200 iterations
    if ((i + 1) % 200 === 0) {
      console.log(`After ${i + 1} iterations:`, counts);
    }
  }

  console.log("\nFinal result:", counts);

  // Sort and display histogram
  displaySortedHistogram(counts);

  return counts;
}

/**
 * Display a sorted histogram of the frequency distribution
 */
function displaySortedHistogram(counts) {
  console.log("\n=== SORTED HISTOGRAM ===");

  // Create array of {index, count} objects and sort by count (descending)
  const sortedData = counts
    .map((count, index) => ({ index, count }))
    .sort((a, b) => b.count - a.count);

  console.log("Sorted by frequency (highest to lowest):");
  const maxCount = Math.max(...counts);
  const maxBarLength = 40; // Maximum bar length for 80-char terminal

  sortedData.forEach(({ index, count }, rank) => {
    const barLength = Math.max(
      1,
      Math.floor((count / maxCount) * maxBarLength)
    );
    const bar = "█".repeat(barLength);
    const percentage = (
      (count / counts.reduce((sum, c) => sum + c, 0)) *
      100
    ).toFixed(1);
    console.log(
      `Rank ${
        rank + 1
      }: Index ${index} = ${count.toLocaleString()} (${percentage}%) ${bar}`
    );
  });

  // Create frequency histogram (how many indices got each count value)
  console.log("\n=== FREQUENCY HISTOGRAM ===");
  const frequencyMap = new Map();

  counts.forEach((count) => {
    frequencyMap.set(count, (frequencyMap.get(count) || 0) + 1);
  });

  // Sort frequency data by count value
  const sortedFrequencies = Array.from(frequencyMap.entries()).sort(
    (a, b) => a[0] - b[0]
  );

  console.log("How many indices got each number of iterations:");
  const maxFrequency = Math.max(...Array.from(frequencyMap.values()));
  const maxFreqBarLength = 20; // Shorter bars for frequency histogram

  sortedFrequencies.forEach(([iterationCount, frequency]) => {
    const barLength = Math.max(
      1,
      Math.floor((frequency / maxFrequency) * maxFreqBarLength)
    );
    const bar = "▓".repeat(barLength);
    console.log(
      `${iterationCount.toLocaleString()} iterations: ${frequency} indices ${bar}`
    );
  });

  // Show statistics
  const minCount = Math.min(...counts);
  const avgCount =
    counts.reduce((sum, count) => sum + count, 0) / counts.length;

  console.log("\n=== STATISTICS ===");
  console.log(`Maximum: ${maxCount} iterations`);
  console.log(`Minimum: ${minCount} iterations`);
  console.log(`Average: ${avgCount.toFixed(1)} iterations`);
  console.log(`Range: ${maxCount - minCount}`);

  // Calculate and show the Gini coefficient (measure of inequality)
  const giniCoefficient = calculateGini(counts);
  console.log(
    `Gini Coefficient: ${giniCoefficient.toFixed(
      3
    )} (0 = perfect equality, 1 = maximum inequality)`
  );
}

/**
 * Calculate Gini coefficient to measure inequality in the distribution
 */
function calculateGini(values) {
  const n = values.length;
  const sortedValues = [...values].sort((a, b) => a - b);
  const sum = sortedValues.reduce((acc, val) => acc + val, 0);

  if (sum === 0) return 0;

  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (2 * (i + 1) - n - 1) * sortedValues[i];
  }

  return numerator / (n * sum);
}

// Run the demonstration
/**
 * Demonstrate the generateIterations function
 * @param {number} numSamples - Number of samples to generate
 * @param {number} growthRate - Growth rate for the sample
 */
function demonstrateIterationGeneration(numSamples = 1000, growthRate = 0.1) {
  console.log(`=== Iteration Generation Demo ===`);
  console.log(`Growth rate: ${(growthRate * 100).toFixed(1)}%`);
  console.log(`Initial sample: 0.01`);
  console.log(`Generating ${numSamples} samples...\n`);

  const iterations = [];
  for (let i = 0; i < numSamples; i++) {
    iterations.push(generateIterations(growthRate));
  }

  // Create frequency distribution
  const maxIterations = Math.max(...iterations);
  const frequency = new Array(maxIterations + 1).fill(0);

  iterations.forEach((iter) => frequency[iter]++);

  console.log("Frequency distribution:");
  for (let i = 0; i <= maxIterations; i++) {
    if (frequency[i] > 0) {
      const bar = "█".repeat(Math.max(1, Math.floor(frequency[i] / 5)));
      console.log(`${i} iterations: ${frequency[i]} samples ${bar}`);
    }
  }

  const avg =
    iterations.reduce((sum, iter) => sum + iter, 0) / iterations.length;
  console.log(`\nAverage iterations: ${avg.toFixed(2)}`);
  console.log(`Max iterations: ${maxIterations}`);
  console.log(`Min iterations: ${Math.min(...iterations)}`);

  return iterations;
}

console.log("=== Million Iteration Generation Test ===\n");

console.log(
  "Running generateIterations 1,000,000 times with 10% growth rate..."
);
const startTime = Date.now();
const results = [];

for (let i = 0; i < 1000000; i++) {
  results.push(generateIterations(0.1)); // 10% growth rate
}

const endTime = Date.now();
console.log(`Completed in ${endTime - startTime}ms\n`);

// Create frequency distribution
let maxIterations = 0;
const frequencyMap = new Map();

results.forEach((iter) => {
  maxIterations = Math.max(maxIterations, iter);
  frequencyMap.set(iter, (frequencyMap.get(iter) || 0) + 1);
});

console.log("Distribution of iteration counts:");
const maxFreq = Math.max(...frequencyMap.values());
const maxBarLength = 50;

// Sort and display frequency data
const sortedFrequencies = Array.from(frequencyMap.entries()).sort(
  (a, b) => a[0] - b[0]
);

for (const [iterations, count] of sortedFrequencies) {
  const barLength = Math.max(1, Math.floor((count / maxFreq) * maxBarLength));
  const bar = "█".repeat(barLength);
  const percentage = ((count / 1000000) * 100).toFixed(2);
  console.log(
    `${iterations} iterations: ${count.toLocaleString()} samples (${percentage}%) ${bar}`
  );
}

// Statistics
const avg = results.reduce((sum, iter) => sum + iter, 0) / results.length;

// Find min without spread operator
let minIterations = Infinity;
results.forEach((iter) => {
  if (iter < minIterations) minIterations = iter;
});

// Calculate median and percentiles efficiently
results.sort((a, b) => a - b);
const median = results[Math.floor(results.length / 2)];

console.log("\n=== STATISTICS ===");
console.log(`Total samples: ${results.length.toLocaleString()}`);
console.log(`Average iterations: ${avg.toFixed(3)}`);
console.log(`Median iterations: ${median}`);
console.log(`Maximum iterations: ${maxIterations}`);
console.log(`Minimum iterations: ${minIterations}`);
console.log(
  `Standard deviation: ${Math.sqrt(
    results.reduce((sum, x) => sum + Math.pow(x - avg, 2), 0) / results.length
  ).toFixed(3)}`
);

// Show percentiles (results is already sorted)
const p25 = results[Math.floor(results.length * 0.25)];
const p75 = results[Math.floor(results.length * 0.75)];
const p90 = results[Math.floor(results.length * 0.9)];
const p95 = results[Math.floor(results.length * 0.95)];
const p99 = results[Math.floor(results.length * 0.99)];

console.log("\n=== PERCENTILES ===");
console.log(`25th percentile: ${p25} iterations`);
console.log(`50th percentile (median): ${median} iterations`);
console.log(`75th percentile: ${p75} iterations`);
console.log(`90th percentile: ${p90} iterations`);
console.log(`95th percentile: ${p95} iterations`);
console.log(`99th percentile: ${p99} iterations`);

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    generateIterations,
    demonstrateIterationGeneration,
    samplePreferentialAttachment,
    samplePreferentialAttachmentWithWeights,
    preferentialAttachment,
    preferentialAttachmentWithWeights,
    displaySortedHistogram,
    calculateGini,
  };
}
