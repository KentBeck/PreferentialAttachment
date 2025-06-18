const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

/**
 * Downloads repo and analyzes C++ function line counts using clang-tidy
 * @param {string} repoUrl - Git repository URL
 */
function analyzeRepo(repoUrl) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cpp-analysis-"));
  
  try {
    console.log(`Cloning ${repoUrl}...`);
    execSync(`git clone ${repoUrl} ${tempDir}`, { stdio: "ignore" });
    
    // Check what C++ files exist
    try {
      const cppFiles = execSync(`find . -name "*.cpp" -o -name "*.cxx" -o -name "*.cc" -o -name "*.c" | head -10`, { 
        cwd: tempDir, 
        encoding: 'utf8' 
      });
      console.log("Sample C++ files found:", cppFiles.trim());
    } catch (e) {
      console.log("Error checking for C++ files:", e.message);
    }

    // Create .clang-tidy config
    const clangTidyConfig = `---
Checks: 'readability-function-size'
CheckOptions:
  - key: readability-function-size.LineThreshold
    value: 1
  - key: readability-function-size.StatementThreshold
    value: 1000
  - key: readability-function-size.BranchThreshold  
    value: 1000
  - key: readability-function-size.ParameterThreshold
    value: 1000
  - key: readability-function-size.NestingThreshold
    value: 1000
  - key: readability-function-size.VariableThreshold
    value: 1000
`;

    fs.writeFileSync(path.join(tempDir, ".clang-tidy"), clangTidyConfig);

    console.log("Running clang-tidy analysis...");
    
    // Get list of C++ files
    let cppFileList;
    try {
      cppFileList = execSync(`find . -name "*.cpp" -o -name "*.cxx" -o -name "*.cc" -o -name "*.c"`, { 
        cwd: tempDir, 
        encoding: 'utf8' 
      }).trim().split('\n').filter(f => f.length > 0);
    } catch (e) {
      console.log("No C++ files found");
      return;
    }

    if (cppFileList.length === 0) {
      console.log("No C++ files found");
      return;
    }

    const allLineCounts = [];
    
    // Process files in batches to avoid command line length limits
    const batchSize = 10;
    for (let i = 0; i < cppFileList.length; i += batchSize) {
      const batch = cppFileList.slice(i, i + batchSize);
      
      try {
        const output = execSync(`clang-tidy ${batch.join(' ')} -- -std=c++17`, {
          cwd: tempDir,
          encoding: 'utf8',
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        
        // Parse clang-tidy output for function size violations
        const lines = output.split('\n');
        for (const line of lines) {
          const match = line.match(/readability-function-size.*has (\d+) lines/);
          if (match) {
            allLineCounts.push(parseInt(match[1]));
          }
        }
      } catch (error) {
        // clang-tidy outputs warnings to stderr, but we still get violations
        if (error.stdout) {
          const lines = error.stdout.split('\n');
          for (const line of lines) {
            const match = line.match(/readability-function-size.*has (\d+) lines/);
            if (match) {
              allLineCounts.push(parseInt(match[1]));
            }
          }
        }
        
        if (error.stderr) {
          const lines = error.stderr.split('\n');
          for (const line of lines) {
            const match = line.match(/readability-function-size.*has (\d+) lines/);
            if (match) {
              allLineCounts.push(parseInt(match[1]));
            }
          }
        }
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
  console.log("Usage: node cpp_function_line_counter.js <repo-url>");
  process.exit(1);
}

analyzeRepo(repoUrl);
