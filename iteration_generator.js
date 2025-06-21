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

function printHistogram(results, label) {
  const frequencyMap = new Map();
  let sum = 0;

  results.forEach((iter) => {
    frequencyMap.set(iter, (frequencyMap.get(iter) || 0) + 1);
    sum += iter;
  });

  const avg = sum / results.length;
  console.log(`\n${label}: ${avg.toFixed(6)}`);

  // Sort and display top frequencies
  const sortedFreqs = Array.from(frequencyMap.entries()).sort(
    (a, b) => a[0] - b[0]
  ); // Sort by iteration count

  console.log("Histogram:");
  for (const [iterations, count] of sortedFreqs) {
    const percentage = ((count / results.length) * 100).toFixed(3);
    const bar = "█".repeat(
      Math.max(1, Math.floor(count / Math.max(1, results.length / 50)))
    );
    console.log(`${iterations}: ${count} (${percentage}%) ${bar}`);
  }
}

// Run 100K samples
console.log("Running 100,000 samples...");
const results100K = [];
for (let i = 0; i < 100000; i++) {
  results100K.push(generateIterations(0.1));
}
printHistogram(results100K, "100K samples");

// Run 1M samples
console.log("\nRunning 1,000,000 samples...");
const results1M = [];
for (let i = 0; i < 1000000; i++) {
  results1M.push(generateIterations(0.1));
}
printHistogram(results1M, "1M samples");

// Run 10M samples
console.log("\nRunning 10,000,000 samples...");
const results10M = [];
for (let i = 0; i < 10000000; i++) {
  results10M.push(generateIterations(0.1));
}
printHistogram(results10M, "10M samples");

// Just show the averages for larger samples without full histograms
console.log("\n=== Larger Sample Averages ===");

// 110M samples (average only)
console.log("\nRunning 110,000,000 samples...");
let sum = 0;
for (let i = 0; i < 110000000; i++) {
  sum += generateIterations(0.1);
  if ((i + 1) % 10000000 === 0) {
    console.log(`  Completed ${(i + 1) / 1000000}M samples...`);
  }
}
const avg110M = sum / 110000000;
console.log(`Average with 110M samples: ${avg110M.toFixed(6)}`);
