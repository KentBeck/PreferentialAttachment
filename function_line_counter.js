const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

/**
 * Downloads repo to temp directory and analyzes function line counts using ESLint
 * @param {string} repoUrl - Git repository URL
 */
function analyzeRepo(repoUrl) {
  // Create temp directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "repo-analysis-"));

  try {
    console.log(`Cloning ${repoUrl}...`);
    execSync(`git clone ${repoUrl} ${tempDir}`, { stdio: "ignore" });

    // Check if ESLint is already available
    let eslintAvailable = false;
    try {
      execSync("npx eslint --version", { cwd: tempDir, stdio: "ignore" });
      eslintAvailable = true;
      console.log('ESLint already available in repo');
    } catch (error) {
      console.log('Installing ESLint...');
      execSync("npm init -y", { cwd: tempDir, stdio: "ignore" });
      execSync("npm install eslint --save-dev", { cwd: tempDir, stdio: "ignore" });
    }

    // Always update package.json to specify ES module type for our config
    const packageJsonPath = path.join(tempDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      packageJson.type = 'module';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    // Create ESLint config (v9+ format)
    const eslintConfig = `export default [
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        module: 'writable',
        require: 'readonly',
        global: 'readonly'
      }
    },
    rules: {
      'max-lines-per-function': ['error', 1]
    }
  }
];`;

    fs.writeFileSync(
      path.join(tempDir, "eslint.config.js"),
      eslintConfig
    );

    console.log("Running ESLint analysis...");

    // Check what JS files exist
    try {
      const jsFiles = execSync(`find . -name "*.js" -o -name "*.jsx" | head -10`, { 
        cwd: tempDir, 
        encoding: 'utf8' 
      });
      console.log("Sample JS/JSX files found:", jsFiles.trim());
    } catch (e) {
      console.log("Error checking for JS files:", e.message);
    }

    // Run ESLint and capture output
    let eslintOutput;
    try {
      execSync(`npx eslint "**/*.{js,jsx}" --format json --config eslint.config.js`, {
        cwd: tempDir,
        stdio: "pipe",
        maxBuffer: 1024 * 1024 * 100 // 100MB buffer
      });
    } catch (error) {
      // ESLint exits with error code when violations found - this is expected
      eslintOutput = error.stdout.toString();
      if (error.stderr) {
        console.log("ESLint stderr:", error.stderr.toString());
      }
    }

    if (!eslintOutput) {
      console.log("No ESLint output received.");
      return;
    }

    console.log("ESLint output length:", eslintOutput.length);
    console.log("First 1000 chars of output:", eslintOutput.substring(0, 1000));

    // Parse ESLint results with error handling
    let results;
    try {
      results = JSON.parse(eslintOutput);
    } catch (parseError) {
      console.log("Failed to parse ESLint output:");
      console.log("Parse error:", parseError.message);
      console.log("Output length:", eslintOutput.length);
      console.log("First 500 chars:", eslintOutput.substring(0, 500));
      console.log("Last 500 chars:", eslintOutput.substring(eslintOutput.length - 500));
      return;
    }
    const allLineCounts = [];

    for (const file of results) {
      for (const message of file.messages) {
        if (message.ruleId === "max-lines-per-function") {
          // Extract actual line count from message
          const match = message.message.match(/too many lines \((\d+)\)/);
          if (match) {
            allLineCounts.push(parseInt(match[1]));
          }
        }
      }
    }

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });

    if (allLineCounts.length === 0) {
      console.log("No JavaScript functions found or analyzed.");
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
  console.log("Usage: node function_line_counter.js <repo-url>");
  process.exit(1);
}

analyzeRepo(repoUrl);
