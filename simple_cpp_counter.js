const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

/**
 * Counts lines in C/C++ functions by parsing braces
 * @param {string} filePath - Path to the C/C++ file
 * @returns {Array} - Array of line counts
 */
function countFunctionLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const lineCounts = [];
  
  let inFunction = false;
  let functionStartLine = 0;
  let braceCount = 0;
  let parenCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
      continue;
    }
    
    // Count parentheses and braces
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    
    parenCount += openParens - closeParens;
    
    // Look for function signatures (simplified heuristic)
    if (!inFunction && openParens > 0 && parenCount === 0 && openBraces > 0) {
      // Likely a function definition starting
      inFunction = true;
      functionStartLine = i;
      braceCount = openBraces - closeBraces;
    } else if (!inFunction && openParens > 0 && parenCount === 0 && line.includes(')') && !line.includes(';')) {
      // Function signature without opening brace on same line
      const nextLineIndex = i + 1;
      if (nextLineIndex < lines.length && lines[nextLineIndex].trim().startsWith('{')) {
        inFunction = true;
        functionStartLine = i;
        braceCount = 0; // Will be counted when we process the next line
      }
    }
    
    if (inFunction) {
      braceCount += openBraces - closeBraces;
      
      // Function ends when brace count returns to 0
      if (braceCount === 0 && (openBraces > 0 || closeBraces > 0)) {
        const lineCount = i - functionStartLine + 1;
        if (lineCount > 1) { // Ignore single-line functions
          lineCounts.push(lineCount);
        }
        inFunction = false;
        parenCount = 0; // Reset for next function
      }
    }
  }
  
  return lineCounts;
}

/**
 * Downloads repo and analyzes C++ function line counts
 * @param {string} repoUrl - Git repository URL  
 */
function analyzeRepo(repoUrl) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cpp-simple-"));
  
  try {
    console.log(`Cloning ${repoUrl}...`);
    execSync(`git clone ${repoUrl} ${tempDir}`, { stdio: "ignore" });
    
    // Find C++ files
    const cppFiles = execSync(`find . -name "*.cpp" -o -name "*.cxx" -o -name "*.cc" -o -name "*.c" -o -name "*.hpp" -o -name "*.h"`, { 
      cwd: tempDir, 
      encoding: 'utf8' 
    }).trim().split('\n').filter(f => f.length > 0);

    if (cppFiles.length === 0) {
      console.log("No C++ files found");
      return;
    }

    console.log(`Analyzing ${cppFiles.length} C++ files...`);
    
    const allLineCounts = [];
    
    for (const file of cppFiles) {
      try {
        const lineCounts = countFunctionLines(path.join(tempDir, file));
        allLineCounts.push(...lineCounts);
      } catch (e) {
        // Skip files that can't be read
        continue;
      }
    }

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    if (allLineCounts.length === 0) {
      console.log("No C++ functions found or analyzed.");
      return;
    }

    // Generate histogram
    const histogram = {};
    for (const lineCount of allLineCounts) {
      histogram[lineCount] = (histogram[lineCount] || 0) + 1;
    }

    // Report distribution
    console.log("\nFunction Line Count Distribution:");
    console.log("=================================");
    for (const [lines, count] of Object.entries(histogram).sort(
      (a, b) => parseInt(a[0]) - parseInt(b[0])
    )) {
      console.log(`${lines} ${count}`);
    }

    console.log(`\nTotal functions analyzed: ${allLineCounts.length}`);
    
  } catch (error) {
    // Clean up on error
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }
}

// Main execution
const repoUrl = process.argv[2];
if (!repoUrl) {
  console.log("Usage: node simple_cpp_counter.js <repo-url>");
  process.exit(1);
}

analyzeRepo(repoUrl);
