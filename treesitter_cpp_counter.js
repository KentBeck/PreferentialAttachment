const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

// Install with: npm install tree-sitter tree-sitter-cpp
let Parser, CPP;
try {
  Parser = require('tree-sitter');
  CPP = require('tree-sitter-cpp');
} catch (e) {
  console.log("Please install tree-sitter dependencies:");
  console.log("npm install tree-sitter tree-sitter-cpp");
  process.exit(1);
}

/**
 * Counts lines in C++ functions using tree-sitter AST parsing
 * @param {string} filePath - Path to the C++ file
 * @returns {Array} - Array of line counts
 */
function countFunctionLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  const parser = new Parser();
  parser.setLanguage(CPP);
  
  const tree = parser.parse(content);
  const lineCounts = [];
  
  function traverseNode(node) {
    // Look for function definitions
    if (node.type === 'function_definition' || 
        node.type === 'function_declarator' ||
        node.type === 'method_definition') {
      
      const startLine = node.startPosition.row;
      const endLine = node.endPosition.row;
      const lineCount = endLine - startLine + 1;
      
      if (lineCount > 1) { // Skip one-liners
        lineCounts.push(lineCount);
      }
    }
    
    // Recursively check children
    for (const child of node.children) {
      traverseNode(child);
    }
  }
  
  traverseNode(tree.rootNode);
  return lineCounts;
}

/**
 * Downloads repo and analyzes C++ function line counts using tree-sitter
 * @param {string} repoUrl - Git repository URL  
 */
function analyzeRepo(repoUrl) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cpp-treesitter-"));
  
  try {
    console.log(`Cloning ${repoUrl}...`);
    execSync(`git clone ${repoUrl} ${tempDir}`, { stdio: "ignore" });
    
    // Find C++ source files (not headers to avoid duplicates)
    const cppFiles = execSync(`find . -name "*.cpp" -o -name "*.cxx" -o -name "*.cc" -o -name "*.c"`, { 
      cwd: tempDir, 
      encoding: 'utf8' 
    }).trim().split('\n').filter(f => f.length > 0);

    if (cppFiles.length === 0) {
      console.log("No C++ files found");
      return;
    }

    console.log(`Analyzing ${cppFiles.length} C++ files with tree-sitter...`);
    
    const allLineCounts = [];
    
    for (const file of cppFiles) {
      try {
        const lineCounts = countFunctionLines(path.join(tempDir, file));
        allLineCounts.push(...lineCounts);
      } catch (e) {
        // Skip files that can't be parsed
        console.error(`Error parsing ${file}: ${e.message}`);
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
  console.log("Usage: node treesitter_cpp_counter.js <repo-url>");
  console.log("First run: npm install tree-sitter tree-sitter-cpp");
  process.exit(1);
}

analyzeRepo(repoUrl);
