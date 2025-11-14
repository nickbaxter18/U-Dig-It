/**
 * Metrics Collector
 *
 * Comprehensive performance tracking and analysis for the Murmuration AI system.
 * Tracks response times, accuracy, network efficiency, confidence, and insight generation.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MetricsCollector {
  constructor() {
    this.metrics = {
      responseTime: {
        p50: 0,
        p95: 0,
        p99: 0,
        average: 0,
        samples: [],
      },
      accuracy: {
        totalRequests: 0,
        relevantRulesFound: 0,
        accuracyPercentage: 0,
        targetAccuracy: 90,
      },
      networkEfficiency: {
        totalActivations: 0,
        neighborNetworkUsage: 0,
        efficiencyPercentage: 0,
        targetEfficiency: 80,
      },
      confidence: {
        totalRecommendations: 0,
        confidenceSum: 0,
        averageConfidence: 0,
        targetConfidence: 75,
      },
      insightGeneration: {
        totalActivations: 0,
        totalInsights: 0,
        insightsPerActivation: 0,
        targetInsightsPer100: 20,
      },
      predictionAccuracy: {
        totalPredictions: 0,
        correctPredictions: 0,
        accuracyPercentage: 0,
        targetAccuracy: 70,
      },
      systemHealth: {
        uptime: 0,
        errorRate: 0,
        lastError: null,
        status: "healthy",
      },
    };

    this.activationHistory = [];
    this.predictionHistory = [];
    this.errorLog = [];
    this.startTime = Date.now();

    // Performance targets
    this.targets = {
      responseTime: 2, // ms
      accuracy: 90, // %
      networkEfficiency: 80, // %
      confidence: 75, // %
      insightsPer100Activations: 20,
      predictionAccuracy: 70, // %
    };
  }

  /**
   * Record a request activation
   */
  recordActivation(activation) {
    const timestamp = Date.now();

    // Record response time
    this.metrics.responseTime.samples.push(activation.responseTime);
    this.updateResponseTimeMetrics();

    // Record accuracy
    this.metrics.accuracy.totalRequests++;
    if (activation.relevantRulesFound > 0) {
      this.metrics.accuracy.relevantRulesFound++;
    }
    this.updateAccuracyMetrics();

    // Record network efficiency
    this.metrics.networkEfficiency.totalActivations++;
    if (activation.neighborNetworkUsed) {
      this.metrics.networkEfficiency.neighborNetworkUsage++;
    }
    this.updateNetworkEfficiencyMetrics();

    // Record confidence
    if (activation.recommendations) {
      activation.recommendations.forEach(rec => {
        this.metrics.confidence.totalRecommendations++;
        this.metrics.confidence.confidenceSum += rec.confidence || 0;
      });
    }
    this.updateConfidenceMetrics();

    // Record insight generation
    this.metrics.insightGeneration.totalActivations++;
    this.metrics.insightGeneration.totalInsights += activation.insightsGenerated || 0;
    this.updateInsightGenerationMetrics();

    // Store in history
    this.activationHistory.push({
      timestamp,
      ...activation,
    });

    // Keep only last 1000 activations
    if (this.activationHistory.length > 1000) {
      this.activationHistory = this.activationHistory.slice(-1000);
    }
  }

  /**
   * Record a prediction and its outcome
   */
  recordPrediction(prediction, outcome) {
    const timestamp = Date.now();

    this.metrics.predictionAccuracy.totalPredictions++;
    if (outcome.correct) {
      this.metrics.predictionAccuracy.correctPredictions++;
    }
    this.updatePredictionAccuracyMetrics();

    this.predictionHistory.push({
      timestamp,
      prediction,
      outcome,
    });

    // Keep only last 500 predictions
    if (this.predictionHistory.length > 500) {
      this.predictionHistory = this.predictionHistory.slice(-500);
    }
  }

  /**
   * Record an error
   */
  recordError(error, context = {}) {
    const timestamp = Date.now();

    this.errorLog.push({
      timestamp,
      error: error.message || error,
      stack: error.stack,
      context,
    });

    this.metrics.systemHealth.lastError = {
      timestamp,
      message: error.message || error,
    };

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    this.updateSystemHealthMetrics();
  }

  /**
   * Update response time metrics
   */
  updateResponseTimeMetrics() {
    const samples = this.metrics.responseTime.samples;
    if (samples.length === 0) return;

    // Sort samples
    const sorted = [...samples].sort((a, b) => a - b);

    // Calculate percentiles
    this.metrics.responseTime.p50 = this.calculatePercentile(sorted, 50);
    this.metrics.responseTime.p95 = this.calculatePercentile(sorted, 95);
    this.metrics.responseTime.p99 = this.calculatePercentile(sorted, 99);

    // Calculate average
    this.metrics.responseTime.average =
      samples.reduce((sum, time) => sum + time, 0) / samples.length;

    // Keep only last 1000 samples
    if (samples.length > 1000) {
      this.metrics.responseTime.samples = samples.slice(-1000);
    }
  }

  /**
   * Update accuracy metrics
   */
  updateAccuracyMetrics() {
    const { totalRequests, relevantRulesFound } = this.metrics.accuracy;
    this.metrics.accuracy.accuracyPercentage =
      totalRequests > 0 ? (relevantRulesFound / totalRequests) * 100 : 0;
  }

  /**
   * Update network efficiency metrics
   */
  updateNetworkEfficiencyMetrics() {
    const { totalActivations, neighborNetworkUsage } = this.metrics.networkEfficiency;
    this.metrics.networkEfficiency.efficiencyPercentage =
      totalActivations > 0 ? (neighborNetworkUsage / totalActivations) * 100 : 0;
  }

  /**
   * Update confidence metrics
   */
  updateConfidenceMetrics() {
    const { totalRecommendations, confidenceSum } = this.metrics.confidence;
    this.metrics.confidence.averageConfidence =
      totalRecommendations > 0 ? (confidenceSum / totalRecommendations) * 100 : 0;
  }

  /**
   * Update insight generation metrics
   */
  updateInsightGenerationMetrics() {
    const { totalActivations, totalInsights } = this.metrics.insightGeneration;
    this.metrics.insightGeneration.insightsPerActivation =
      totalActivations > 0 ? totalInsights / totalActivations : 0;
  }

  /**
   * Update prediction accuracy metrics
   */
  updatePredictionAccuracyMetrics() {
    const { totalPredictions, correctPredictions } = this.metrics.predictionAccuracy;
    this.metrics.predictionAccuracy.accuracyPercentage =
      totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;
  }

  /**
   * Update system health metrics
   */
  updateSystemHealthMetrics() {
    this.metrics.systemHealth.uptime = Date.now() - this.startTime;

    const totalRequests = this.metrics.accuracy.totalRequests;
    const errorCount = this.errorLog.length;
    this.metrics.systemHealth.errorRate =
      totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    // Determine status
    if (this.metrics.systemHealth.errorRate > 5) {
      this.metrics.systemHealth.status = "degraded";
    } else if (this.metrics.systemHealth.errorRate > 1) {
      this.metrics.systemHealth.status = "warning";
    } else {
      this.metrics.systemHealth.status = "healthy";
    }
  }

  /**
   * Calculate percentile from sorted array
   */
  calculatePercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;

    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];

    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Get comprehensive metrics report
   */
  getMetricsReport() {
    this.updateSystemHealthMetrics();

    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      targets: this.targets,
      performance: this.calculatePerformanceScore(),
      trends: this.calculateTrends(),
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Calculate overall performance score (0-100)
   */
  calculatePerformanceScore() {
    const scores = {
      responseTime: Math.max(
        0,
        100 - (this.metrics.responseTime.average / this.targets.responseTime) * 100
      ),
      accuracy: this.metrics.accuracy.accuracyPercentage,
      networkEfficiency: this.metrics.networkEfficiency.efficiencyPercentage,
      confidence: this.metrics.confidence.averageConfidence,
      insightGeneration: Math.min(
        100,
        (this.metrics.insightGeneration.insightsPerActivation * 100) /
          (this.targets.insightsPer100Activations / 100)
      ),
      predictionAccuracy: this.metrics.predictionAccuracy.accuracyPercentage,
    };

    const overallScore =
      Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;

    return {
      overall: Math.round(overallScore),
      breakdown: scores,
    };
  }

  /**
   * Calculate trends over time
   */
  calculateTrends() {
    const recentActivations = this.activationHistory.slice(-100);
    const olderActivations = this.activationHistory.slice(-200, -100);

    if (recentActivations.length === 0 || olderActivations.length === 0) {
      return { responseTime: 0, accuracy: 0, confidence: 0 };
    }

    const recentAvgResponseTime =
      recentActivations.reduce((sum, a) => sum + a.responseTime, 0) / recentActivations.length;
    const olderAvgResponseTime =
      olderActivations.reduce((sum, a) => sum + a.responseTime, 0) / olderActivations.length;

    const recentAccuracy =
      (recentActivations.filter(a => a.relevantRulesFound > 0).length / recentActivations.length) *
      100;
    const olderAccuracy =
      (olderActivations.filter(a => a.relevantRulesFound > 0).length / olderActivations.length) *
      100;

    return {
      responseTime: ((recentAvgResponseTime - olderAvgResponseTime) / olderAvgResponseTime) * 100,
      accuracy: recentAccuracy - olderAccuracy,
      confidence: 0, // TODO: Calculate confidence trend
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.responseTime.average > this.targets.responseTime) {
      recommendations.push({
        type: "performance",
        priority: "high",
        message: `Response time (${this.metrics.responseTime.average.toFixed(2)}ms) exceeds target (${this.targets.responseTime}ms). Consider optimizing rule matching algorithms.`,
      });
    }

    if (this.metrics.accuracy.accuracyPercentage < this.targets.accuracy) {
      recommendations.push({
        type: "accuracy",
        priority: "high",
        message: `Rule matching accuracy (${this.metrics.accuracy.accuracyPercentage.toFixed(1)}%) below target (${this.targets.accuracy}%). Improve semantic feature extraction.`,
      });
    }

    if (this.metrics.networkEfficiency.efficiencyPercentage < this.targets.networkEfficiency) {
      recommendations.push({
        type: "efficiency",
        priority: "medium",
        message: `Network efficiency (${this.metrics.networkEfficiency.efficiencyPercentage.toFixed(1)}%) below target (${this.targets.networkEfficiency}%). Optimize neighbor activation.`,
      });
    }

    if (this.metrics.confidence.averageConfidence < this.targets.confidence) {
      recommendations.push({
        type: "confidence",
        priority: "medium",
        message: `Average confidence (${this.metrics.confidence.averageConfidence.toFixed(1)}%) below target (${this.targets.confidence}%). Improve consensus building.`,
      });
    }

    if (
      this.metrics.insightGeneration.insightsPerActivation <
      this.targets.insightsPer100Activations / 100
    ) {
      recommendations.push({
        type: "insights",
        priority: "low",
        message: `Insight generation (${(this.metrics.insightGeneration.insightsPerActivation * 100).toFixed(1)} per 100) below target (${this.targets.insightsPer100Activations}). Enhance emergent intelligence.`,
      });
    }

    return recommendations;
  }

  /**
   * Save metrics to file
   */
  async saveMetrics() {
    try {
      const report = this.getMetricsReport();
      const metricsFile = path.join(__dirname, "metrics-report.json");
      await fs.promises.writeFile(metricsFile, JSON.stringify(report, null, 2));
      console.log("📊 Metrics saved to metrics-report.json");
    } catch (error) {
      console.error("❌ Failed to save metrics:", error.message);
    }
  }

  /**
   * Load metrics from file
   */
  async loadMetrics() {
    try {
      const metricsFile = path.join(__dirname, "metrics-report.json");
      const data = await fs.promises.readFile(metricsFile, "utf8");
      const report = JSON.parse(data);

      // Restore metrics (but keep current session data)
      this.metrics = report.metrics;
      console.log("📊 Metrics loaded from file");
    } catch (error) {
      console.log("📊 No existing metrics file found, starting fresh");
    }
  }

  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.metrics = {
      responseTime: { p50: 0, p95: 0, p99: 0, average: 0, samples: [] },
      accuracy: {
        totalRequests: 0,
        relevantRulesFound: 0,
        accuracyPercentage: 0,
        targetAccuracy: 90,
      },
      networkEfficiency: {
        totalActivations: 0,
        neighborNetworkUsage: 0,
        efficiencyPercentage: 0,
        targetEfficiency: 80,
      },
      confidence: {
        totalRecommendations: 0,
        confidenceSum: 0,
        averageConfidence: 0,
        targetConfidence: 75,
      },
      insightGeneration: {
        totalActivations: 0,
        totalInsights: 0,
        insightsPerActivation: 0,
        targetInsightsPer100: 20,
      },
      predictionAccuracy: {
        totalPredictions: 0,
        correctPredictions: 0,
        accuracyPercentage: 0,
        targetAccuracy: 70,
      },
      systemHealth: { uptime: 0, errorRate: 0, lastError: null, status: "healthy" },
    };

    this.activationHistory = [];
    this.predictionHistory = [];
    this.errorLog = [];
    this.startTime = Date.now();

    console.log("🔄 Metrics reset");
  }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

// Export functions
export const recordActivation = activation => metricsCollector.recordActivation(activation);

export const recordPrediction = (prediction, outcome) =>
  metricsCollector.recordPrediction(prediction, outcome);

export const recordError = (error, context) => metricsCollector.recordError(error, context);

export const getMetricsReport = () => metricsCollector.getMetricsReport();

export const saveMetrics = () => metricsCollector.saveMetrics();

export const loadMetrics = () => metricsCollector.loadMetrics();

export const resetMetrics = () => metricsCollector.resetMetrics();

export default metricsCollector;
