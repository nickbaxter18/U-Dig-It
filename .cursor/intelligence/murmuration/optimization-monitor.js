/**
 * Optimization Monitor
 *
 * Real-time monitoring and visualization of Murmuration AI optimizations
 * Shows exactly what optimizations are being applied and their impact
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { recordActivation } from "./metrics-collector.js";
import MurmurationAISystem from "./murmuration-ai-system.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OptimizationMonitor {
  constructor() {
    this.system = null;
    this.optimizationLog = [];
    this.beforeMetrics = null;
    this.afterMetrics = null;
    this.isMonitoring = false;
  }

  /**
   * Start monitoring optimizations
   */
  async startMonitoring() {
    console.log("🔍 Starting Optimization Monitor...\n");

    this.system = new MurmurationAISystem();
    await this.system.initialize();

    // Capture baseline metrics
    this.beforeMetrics = await this.captureSystemMetrics();
    console.log("📊 Baseline metrics captured");

    this.isMonitoring = true;

    // Start background monitoring
    this.startBackgroundMonitoring();

    console.log("✅ Optimization Monitor started - watching for improvements...\n");
  }

  /**
   * Capture current system metrics
   */
  async captureSystemMetrics() {
    const metrics = {
      timestamp: Date.now(),
      networkDensity: this.system.components.semanticAnalyzer.networkMetrics?.density || 0,
      averageNeighborScore:
        this.system.components.semanticAnalyzer.networkMetrics?.averageNeighborScore || 0,
      ruleCount: this.system.components.semanticAnalyzer.rules?.length || 0,
      neighborNetworks: this.system.components.semanticAnalyzer.neighborNetworks
        ? Object.keys(this.system.components.semanticAnalyzer.neighborNetworks).length
        : 0,
      backgroundAgents: this.system.backgroundAgents ? this.system.backgroundAgents.length : 0,
      systemHealth: "healthy",
    };

    return metrics;
  }

  /**
   * Start background monitoring
   */
  startBackgroundMonitoring() {
    setInterval(async () => {
      if (!this.isMonitoring) return;

      const currentMetrics = await this.captureSystemMetrics();
      const changes = this.detectChanges(this.beforeMetrics, currentMetrics);

      if (changes.length > 0) {
        this.logOptimization("background", changes);
      }

      this.beforeMetrics = currentMetrics;
    }, 5000); // Check every 5 seconds
  }

  /**
   * Detect changes between metrics
   */
  detectChanges(before, after) {
    const changes = [];

    if (before.networkDensity !== after.networkDensity) {
      changes.push({
        type: "network-density",
        before: before.networkDensity,
        after: after.networkDensity,
        improvement: after.networkDensity - before.networkDensity,
      });
    }

    if (before.averageNeighborScore !== after.averageNeighborScore) {
      changes.push({
        type: "neighbor-score",
        before: before.averageNeighborScore,
        after: after.averageNeighborScore,
        improvement: after.averageNeighborScore - before.averageNeighborScore,
      });
    }

    if (before.neighborNetworks !== after.neighborNetworks) {
      changes.push({
        type: "neighbor-networks",
        before: before.neighborNetworks,
        after: after.neighborNetworks,
        improvement: after.neighborNetworks - before.neighborNetworks,
      });
    }

    return changes;
  }

  /**
   * Log an optimization
   */
  logOptimization(source, changes) {
    const logEntry = {
      timestamp: Date.now(),
      source: source,
      changes: changes,
      impact: this.calculateImpact(changes),
    };

    this.optimizationLog.push(logEntry);

    console.log(`🔧 OPTIMIZATION DETECTED (${source}):`);
    changes.forEach(change => {
      const direction = change.improvement > 0 ? "📈" : "📉";
      console.log(
        `   ${direction} ${change.type}: ${change.before.toFixed(3)} → ${change.after.toFixed(3)} (${change.improvement > 0 ? "+" : ""}${change.improvement.toFixed(3)})`
      );
    });
    console.log(`   💪 Impact: ${logEntry.impact}\n`);
  }

  /**
   * Calculate optimization impact
   */
  calculateImpact(changes) {
    let totalImpact = 0;

    changes.forEach(change => {
      switch (change.type) {
        case "network-density":
          totalImpact += change.improvement * 100; // High impact
          break;
        case "neighbor-score":
          totalImpact += change.improvement * 50; // Medium impact
          break;
        case "neighbor-networks":
          totalImpact += change.improvement * 25; // Lower impact
          break;
      }
    });

    if (totalImpact > 0.1) return "HIGH";
    if (totalImpact > 0.05) return "MEDIUM";
    if (totalImpact > 0) return "LOW";
    return "NEGLIGIBLE";
  }

  /**
   * Test optimization with a real request
   */
  async testOptimization(requestType, keywords, domains) {
    console.log(`🧪 Testing optimization with ${requestType} request...\n`);

    const request = {
      type: requestType,
      keywords: keywords,
      context: {
        domains: domains,
        activationType: "contextual",
        complexity: "medium",
      },
    };

    // Capture metrics before request
    const beforeRequest = await this.captureSystemMetrics();

    // Process request
    const startTime = Date.now();
    const result = await this.system.processRequest(request, request.context);
    const processingTime = Date.now() - startTime;

    // Capture metrics after request
    const afterRequest = await this.captureSystemMetrics();

    // Record activation
    recordActivation({
      responseTime: processingTime,
      relevantRulesFound: result.response.recommendations.length,
      insightsGenerated: result.response.insights.length,
      recommendationsGenerated: result.response.recommendations.length,
      confidence: result.response.confidence,
      neighborNetworkUsed: true,
    });

    // Analyze results
    console.log("📊 REQUEST PROCESSING RESULTS:");
    console.log(`   ⚡ Processing time: ${processingTime.toFixed(2)}ms`);
    console.log(`   🎯 Confidence: ${(result.response.confidence * 100).toFixed(1)}%`);
    console.log(`   💡 Insights: ${result.response.insights.length}`);
    console.log(`   📋 Recommendations: ${result.response.recommendations.length}`);

    // Check for optimizations applied
    const changes = this.detectChanges(beforeRequest, afterRequest);
    if (changes.length > 0) {
      this.logOptimization("request-processing", changes);
    }

    // Show insights
    if (result.response.insights.length > 0) {
      console.log("\n💡 GENERATED INSIGHTS:");
      result.response.insights.forEach((insight, i) => {
        console.log(`   ${i + 1}. ${insight.title}`);
        console.log(`      ${insight.description}`);
        console.log(`      Confidence: ${(insight.confidence * 100).toFixed(1)}%`);
      });
    }

    // Show recommendations
    if (result.response.recommendations.length > 0) {
      console.log("\n📋 GENERATED RECOMMENDATIONS:");
      result.response.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec.rule}`);
        console.log(`      Confidence: ${(rec.confidence * 100).toFixed(1)}%`);
        console.log(`      Description: ${rec.description}`);
      });
    }

    console.log("\n");
    return result;
  }

  /**
   * Run comprehensive optimization test
   */
  async runOptimizationTest() {
    console.log("🚀 RUNNING COMPREHENSIVE OPTIMIZATION TEST\n");

    const testCases = [
      {
        type: "backend-development",
        keywords: ["nestjs", "api", "database", "security"],
        domains: ["backend", "security"],
      },
      {
        type: "frontend-development",
        keywords: ["react", "component", "typescript", "ui"],
        domains: ["frontend", "design"],
      },
      {
        type: "testing-strategy",
        keywords: ["jest", "cypress", "testing", "coverage"],
        domains: ["testing", "quality-assurance"],
      },
    ];

    for (const testCase of testCases) {
      await this.testOptimization(testCase.type, testCase.keywords, testCase.domains);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    }

    // Show optimization summary
    this.showOptimizationSummary();
  }

  /**
   * Show optimization summary
   */
  showOptimizationSummary() {
    console.log("📊 OPTIMIZATION SUMMARY\n");

    if (this.optimizationLog.length === 0) {
      console.log("❌ No optimizations detected during testing");
      return;
    }

    console.log(`✅ Total optimizations detected: ${this.optimizationLog.length}`);

    const highImpact = this.optimizationLog.filter(log => log.impact === "HIGH").length;
    const mediumImpact = this.optimizationLog.filter(log => log.impact === "MEDIUM").length;
    const lowImpact = this.optimizationLog.filter(log => log.impact === "LOW").length;

    console.log(`   📈 High impact: ${highImpact}`);
    console.log(`   📊 Medium impact: ${mediumImpact}`);
    console.log(`   📉 Low impact: ${lowImpact}`);

    console.log("\n🔧 OPTIMIZATION DETAILS:");
    this.optimizationLog.forEach((log, i) => {
      console.log(`   ${i + 1}. ${log.source} (${log.impact} impact)`);
      log.changes.forEach(change => {
        console.log(
          `      ${change.type}: ${change.before.toFixed(3)} → ${change.after.toFixed(3)}`
        );
      });
    });

    // Save optimization log
    this.saveOptimizationLog();
  }

  /**
   * Save optimization log to file
   */
  async saveOptimizationLog() {
    try {
      const logFile = path.join(__dirname, "optimization-log.json");
      const logData = {
        timestamp: Date.now(),
        totalOptimizations: this.optimizationLog.length,
        optimizations: this.optimizationLog,
        summary: {
          highImpact: this.optimizationLog.filter(log => log.impact === "HIGH").length,
          mediumImpact: this.optimizationLog.filter(log => log.impact === "MEDIUM").length,
          lowImpact: this.optimizationLog.filter(log => log.impact === "LOW").length,
        },
      };

      await fs.promises.writeFile(logFile, JSON.stringify(logData, null, 2));
      console.log("\n💾 Optimization log saved to optimization-log.json");
    } catch (error) {
      console.error("❌ Failed to save optimization log:", error.message);
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    console.log("🛑 Optimization monitoring stopped");
  }
}

// Export for use
export default OptimizationMonitor;

// Run optimization test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new OptimizationMonitor();
  monitor
    .startMonitoring()
    .then(() => {
      monitor.runOptimizationTest().then(() => {
        monitor.stopMonitoring();
      });
    })
    .catch(console.error);
}
