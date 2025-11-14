#!/usr/bin/env node

/**
 * Murmuration AI: Error Learning System
 *
 * Tracks error patterns, failed solutions, and successful solutions
 * to provide better debugging guidance and avoid repeated failures.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ErrorLearning {
  constructor() {
    this.errorPatterns = new Map();
    this.failedSolutions = new Map();
    this.successfulSolutions = new Map();
    this.learningHistory = [];
    this.errorStats = {
      totalErrors: 0,
      totalSolutions: 0,
      successRate: 0,
      commonErrors: new Map(),
    };
  }

  /**
   * Initialize error learning system
   */
  async initialize() {
    console.log("🧠 Initializing Error Learning System...");

    // Load existing error patterns from file system
    await this.loadErrorPatterns();

    console.log(`✅ Error Learning initialized with ${this.errorPatterns.size} patterns`);
  }

  /**
   * Record an error and attempted solution
   */
  recordError(context, error, attemptedSolution) {
    const errorKey = this.generateErrorKey(context, error);
    const solutionKey = this.generateSolutionKey(attemptedSolution);

    const errorRecord = {
      errorType: error.type || "unknown",
      errorMessage: error.message || "unknown error",
      context: {
        filePath: context.filePath,
        domains: context.domains || [],
        workingPatterns: context.workingPatterns || [],
      },
      attemptedSolution: attemptedSolution,
      timestamp: Date.now(),
      success: false,
    };

    // Store error pattern
    if (!this.errorPatterns.has(errorKey)) {
      this.errorPatterns.set(errorKey, []);
    }
    this.errorPatterns.get(errorKey).push(errorRecord);

    // Store failed solution
    if (!this.failedSolutions.has(solutionKey)) {
      this.failedSolutions.set(solutionKey, []);
    }
    this.failedSolutions.get(solutionKey).push({
      errorKey,
      context,
      timestamp: Date.now(),
    });

    // Update statistics
    this.errorStats.totalErrors++;
    this.updateErrorStats(error.type || "unknown");

    // Add to learning history
    this.learningHistory.push({
      type: "error",
      ...errorRecord,
    });

    console.log(`📝 Recorded error: ${error.type || "unknown"} in ${context.filePath}`);
  }

  /**
   * Record a successful solution
   */
  recordSuccess(context, error, solution) {
    const errorKey = this.generateErrorKey(context, error);
    const solutionKey = this.generateSolutionKey(solution);

    const successRecord = {
      errorType: error.type || "unknown",
      errorMessage: error.message || "unknown error",
      context: {
        filePath: context.filePath,
        domains: context.domains || [],
        workingPatterns: context.workingPatterns || [],
      },
      solution: solution,
      timestamp: Date.now(),
      success: true,
    };

    // Store successful solution
    if (!this.successfulSolutions.has(solutionKey)) {
      this.successfulSolutions.set(solutionKey, []);
    }
    this.successfulSolutions.get(solutionKey).push({
      errorKey,
      context,
      timestamp: Date.now(),
    });

    // Update error pattern to mark as resolved
    if (this.errorPatterns.has(errorKey)) {
      const patterns = this.errorPatterns.get(errorKey);
      const lastPattern = patterns[patterns.length - 1];
      if (lastPattern) {
        lastPattern.success = true;
        lastPattern.successfulSolution = solution;
      }
    }

    // Update statistics
    this.errorStats.totalSolutions++;
    this.updateErrorStats(error.type || "unknown");

    // Add to learning history
    this.learningHistory.push({
      type: "success",
      ...successRecord,
    });

    console.log(
      `✅ Recorded successful solution for: ${error.type || "unknown"} in ${context.filePath}`
    );
  }

  /**
   * Get alternative solutions for an error
   */
  getAlternativeSolutions(context, error) {
    const errorKey = this.generateErrorKey(context, error);
    const errorPatterns = this.errorPatterns.get(errorKey) || [];

    // Find what didn't work
    const failedSolutions = errorPatterns.filter(p => !p.success).map(p => p.attemptedSolution);

    // Find what did work
    const successfulSolutions = errorPatterns.filter(p => p.success).map(p => p.successfulSolution);

    // Get similar error patterns
    const similarErrors = this.findSimilarErrors(context, error);

    const alternatives = {
      avoidSolutions: [...new Set(failedSolutions)],
      trySolutions: [...new Set(successfulSolutions)],
      similarErrors: similarErrors,
      confidence: this.calculateConfidence(errorPatterns),
      reasoning: this.generateReasoning(errorPatterns, failedSolutions, successfulSolutions),
    };

    return alternatives;
  }

  /**
   * Find similar errors based on context and error type
   */
  findSimilarErrors(context, error) {
    const similar = [];

    for (const [errorKey, patterns] of this.errorPatterns) {
      const firstPattern = patterns[0];
      if (!firstPattern) continue;

      // Check domain similarity
      const domainOverlap = this.calculateOverlap(
        context.domains || [],
        firstPattern.context.domains || []
      );

      // Check error type similarity
      const errorTypeMatch = firstPattern.errorType === error.type;

      // Check file path similarity
      const filePathSimilarity = this.calculateFileSimilarity(
        context.filePath || "",
        firstPattern.context.filePath || ""
      );

      const similarity =
        domainOverlap * 0.4 + (errorTypeMatch ? 0.4 : 0) + filePathSimilarity * 0.2;

      if (similarity > 0.6) {
        similar.push({
          errorKey,
          similarity,
          patterns: patterns.length,
          successRate: patterns.filter(p => p.success).length / patterns.length,
          lastOccurrence: Math.max(...patterns.map(p => p.timestamp)),
        });
      }
    }

    return similar.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }

  /**
   * Generate reasoning for alternative solutions
   */
  generateReasoning(errorPatterns, failedSolutions, successfulSolutions) {
    const reasoning = [];

    if (failedSolutions.length > 0) {
      const mostCommonFailure = this.getMostCommon(failedSolutions);
      reasoning.push(
        `Avoid: ${mostCommonFailure} (failed ${failedSolutions.filter(s => s === mostCommonFailure).length} times)`
      );
    }

    if (successfulSolutions.length > 0) {
      const mostCommonSuccess = this.getMostCommon(successfulSolutions);
      reasoning.push(
        `Try: ${mostCommonSuccess} (worked ${successfulSolutions.filter(s => s === mostCommonSuccess).length} times)`
      );
    }

    if (errorPatterns.length > 3) {
      reasoning.push(
        `This error has occurred ${errorPatterns.length} times - consider systematic approach`
      );
    }

    return reasoning;
  }

  /**
   * Calculate confidence in recommendations
   */
  calculateConfidence(errorPatterns) {
    if (errorPatterns.length === 0) return 0.1;

    const successCount = errorPatterns.filter(p => p.success).length;
    const totalCount = errorPatterns.length;

    // Base confidence on success rate and sample size
    const successRate = successCount / totalCount;
    const sampleSize = Math.min(totalCount / 10, 1); // More samples = higher confidence

    return Math.min(0.9, successRate * sampleSize);
  }

  /**
   * Generate error key for pattern matching
   */
  generateErrorKey(context, error) {
    const domains = (context.domains || []).sort().join("-");
    const errorType = error.type || "unknown";
    const fileType = path.extname(context.filePath || "");

    return `${domains}-${errorType}-${fileType}`;
  }

  /**
   * Generate solution key for pattern matching
   */
  generateSolutionKey(solution) {
    // Normalize solution for comparison
    const normalized = solution
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s]/g, "")
      .trim();

    return normalized;
  }

  /**
   * Calculate overlap between arrays
   */
  calculateOverlap(arr1, arr2) {
    if (arr1.length === 0 && arr2.length === 0) return 1;
    if (arr1.length === 0 || arr2.length === 0) return 0;

    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate file path similarity
   */
  calculateFileSimilarity(path1, path2) {
    if (!path1 || !path2) return 0;

    const parts1 = path1.split("/");
    const parts2 = path2.split("/");

    const commonParts = parts1.filter(part => parts2.includes(part));
    const totalParts = new Set([...parts1, ...parts2]).size;

    return commonParts.length / totalParts;
  }

  /**
   * Get most common item in array
   */
  getMostCommon(arr) {
    const counts = {};
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });

    return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
  }

  /**
   * Update error statistics
   */
  updateErrorStats(errorType) {
    const current = this.errorStats.commonErrors.get(errorType) || 0;
    this.errorStats.commonErrors.set(errorType, current + 1);

    // Update overall success rate
    if (this.errorStats.totalSolutions > 0) {
      this.errorStats.successRate =
        this.errorStats.totalSolutions /
        (this.errorStats.totalErrors + this.errorStats.totalSolutions);
    }
  }

  /**
   * Load error patterns from file system
   */
  async loadErrorPatterns() {
    try {
      const patternsPath = path.join(__dirname, "error-patterns.json");
      if (fs.existsSync(patternsPath)) {
        const data = fs.readFileSync(patternsPath, "utf8");
        const patterns = JSON.parse(data);

        this.errorPatterns = new Map(Object.entries(patterns.errorPatterns || {}));
        this.failedSolutions = new Map(Object.entries(patterns.failedSolutions || {}));
        this.successfulSolutions = new Map(Object.entries(patterns.successfulSolutions || {}));
        this.errorStats = patterns.errorStats || this.errorStats;

        console.log(`📚 Loaded ${this.errorPatterns.size} error patterns`);
      }
    } catch (error) {
      console.log("📚 No existing error patterns found, starting fresh");
    }
  }

  /**
   * Save error patterns to file system
   */
  async saveErrorPatterns() {
    try {
      const patternsPath = path.join(__dirname, "error-patterns.json");
      const patterns = {
        errorPatterns: Object.fromEntries(this.errorPatterns),
        failedSolutions: Object.fromEntries(this.failedSolutions),
        successfulSolutions: Object.fromEntries(this.successfulSolutions),
        errorStats: this.errorStats,
        timestamp: new Date().toISOString(),
      };

      fs.writeFileSync(patternsPath, JSON.stringify(patterns, null, 2));
      console.log("💾 Error patterns saved");
    } catch (error) {
      console.error("Failed to save error patterns:", error.message);
    }
  }

  /**
   * Get learning insights
   */
  getLearningInsights() {
    const insights = [];

    // Most common errors
    const commonErrors = Array.from(this.errorStats.commonErrors.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (commonErrors.length > 0) {
      insights.push({
        type: "common-errors",
        title: "Most Common Errors",
        description: `Top error types: ${commonErrors.map(([type, count]) => `${type} (${count})`).join(", ")}`,
        data: commonErrors,
      });
    }

    // Success rate analysis
    if (this.errorStats.totalSolutions > 0) {
      insights.push({
        type: "success-rate",
        title: "Error Resolution Success Rate",
        description: `${(this.errorStats.successRate * 100).toFixed(1)}% of errors have been successfully resolved`,
        successRate: this.errorStats.successRate,
      });
    }

    // Learning patterns
    const recentHistory = this.learningHistory.slice(-20);
    const errorTypes = recentHistory.filter(h => h.type === "error").map(h => h.errorType);
    const successTypes = recentHistory.filter(h => h.type === "success").map(h => h.errorType);

    if (errorTypes.length > 0) {
      insights.push({
        type: "learning-patterns",
        title: "Recent Learning Patterns",
        description: `Recent errors: ${errorTypes.join(", ")}. Recent successes: ${successTypes.join(", ")}`,
        recentErrors: errorTypes,
        recentSuccesses: successTypes,
      });
    }

    return insights;
  }

  /**
   * Generate error learning report
   */
  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      statistics: this.errorStats,
      insights: this.getLearningInsights(),
      totalPatterns: this.errorPatterns.size,
      totalFailedSolutions: this.failedSolutions.size,
      totalSuccessfulSolutions: this.successfulSolutions.size,
      learningHistory: this.learningHistory.slice(-50), // Last 50 entries
    };
  }
}

// Export for use
export default ErrorLearning;

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const errorLearning = new ErrorLearning();

  async function demo() {
    console.log("🧠 Error Learning System Demo\n");

    await errorLearning.initialize();

    // Simulate some errors and solutions
    const contexts = [
      {
        filePath: "/src/auth/auth.service.ts",
        domains: ["backend"],
        workingPatterns: ["api-development"],
      },
      {
        filePath: "/src/components/UserProfile.tsx",
        domains: ["frontend"],
        workingPatterns: ["component-development"],
      },
    ];

    const errors = [
      { type: "TypeError", message: "Cannot read property 'id' of undefined" },
      { type: "ValidationError", message: "Invalid email format" },
      { type: "TypeError", message: "Cannot read property 'id' of undefined" }, // Duplicate
      { type: "NetworkError", message: "Failed to fetch user data" },
    ];

    const solutions = [
      "Add null check before accessing user.id",
      "Validate email format before processing",
      "Check if user exists before accessing properties",
      "Implement retry logic for network requests",
    ];

    // Record some errors and solutions
    for (let i = 0; i < errors.length; i++) {
      const context = contexts[i % contexts.length];
      const error = errors[i];
      const solution = solutions[i];

      console.log(`\n📝 Recording error: ${error.type} in ${context.filePath}`);
      errorLearning.recordError(context, error, solution);

      // Simulate success for some solutions
      if (i % 2 === 0) {
        console.log(`✅ Recording successful solution: ${solution}`);
        errorLearning.recordSuccess(context, error, solution);
      }
    }

    // Get alternative solutions for a similar error
    console.log("\n🔍 Getting alternative solutions...");
    const alternatives = errorLearning.getAlternativeSolutions(contexts[0], errors[0]);
    console.log(`Avoid: ${alternatives.avoidSolutions.join(", ")}`);
    console.log(`Try: ${alternatives.trySolutions.join(", ")}`);
    console.log(`Confidence: ${(alternatives.confidence * 100).toFixed(1)}%`);

    // Generate report
    const report = errorLearning.generateReport();
    console.log(`\n📊 Learning Report:`);
    console.log(`   Total errors: ${report.statistics.totalErrors}`);
    console.log(`   Total solutions: ${report.statistics.totalSolutions}`);
    console.log(`   Success rate: ${(report.statistics.successRate * 100).toFixed(1)}%`);
    console.log(`   Total patterns: ${report.totalPatterns}`);

    // Save patterns
    await errorLearning.saveErrorPatterns();
  }

  demo().catch(console.error);
}



