#!/usr/bin/env node

/**
 * Murmuration AI: Cascading Intelligence System
 *
 * Implements signal propagation, predictive context loading, and dynamic
 * priority weighting based on the seven-neighbor murmuration model.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CascadingIntelligence {
  constructor() {
    this.networkData = null;
    this.activationHistory = [];
    this.predictionCache = new Map();
    this.performanceMetrics = {
      activationLatency: [],
      predictionAccuracy: [],
      networkEfficiency: [],
    };
  }

  /**
   * Load the rule network graph
   */
  async loadNetwork() {
    const networkPath = path.join(__dirname, "rule-network-graph.json");
    this.networkData = JSON.parse(fs.readFileSync(networkPath, "utf8"));
    console.log("✅ Loaded murmuration network with", this.networkData.rules.length, "rules");
  }

  /**
   * Signal propagation: When a rule activates, signal its neighbors
   */
  signalPropagation(activatedRule, context = {}) {
    const startTime = performance.now();
    const neighbors = this.networkData.neighborNetworks[activatedRule] || [];

    // Create signal cascade
    const signalChain = {
      primary: activatedRule,
      neighbors: neighbors.map(n => ({
        rule: n.neighbor,
        score: n.score,
        status: "standby",
        context: this.analyzeContext(n.neighbor, context),
      })),
      timestamp: Date.now(),
      context,
    };

    // Pre-load neighbor content based on context relevance
    const relevantNeighbors = signalChain.neighbors
      .filter(n => n.context.relevance > 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Pre-load top 3 most relevant neighbors

    const activationTime = performance.now() - startTime;
    this.performanceMetrics.activationLatency.push(activationTime);

    return {
      signalChain,
      relevantNeighbors,
      activationTime: Math.round(activationTime * 100) / 100,
    };
  }

  /**
   * Analyze context relevance for a neighbor rule
   */
  analyzeContext(ruleName, context) {
    const rule = this.networkData.rules.find(r => r.name === ruleName);
    if (!rule) return { relevance: 0, reason: "Rule not found" };

    let relevance = 0;
    const factors = [];

    // Check domain alignment
    if (context.domains && rule.domains.length > 0) {
      const domainOverlap = this.calculateOverlap(context.domains, rule.domains);
      relevance += domainOverlap * 0.4;
      factors.push(`Domain overlap: ${(domainOverlap * 100).toFixed(1)}%`);
    }

    // Check keyword alignment
    if (context.keywords && rule.keywords.length > 0) {
      const keywordOverlap = this.calculateOverlap(context.keywords, rule.keywords);
      relevance += keywordOverlap * 0.3;
      factors.push(`Keyword overlap: ${(keywordOverlap * 100).toFixed(1)}%`);
    }

    // Check activation pattern
    if (context.activationType === rule.activation) {
      relevance += 0.2;
      factors.push("Activation type match");
    }

    // Check complexity alignment
    if (context.complexity === rule.complexity) {
      relevance += 0.1;
      factors.push("Complexity match");
    }

    return {
      relevance: Math.min(relevance, 1),
      factors,
      rule: ruleName,
    };
  }

  /**
   * Calculate overlap between two arrays
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
   * Predictive context loading based on activation patterns
   */
  predictNextRules(currentRule, context) {
    const cacheKey = `${currentRule}-${JSON.stringify(context)}`;

    if (this.predictionCache.has(cacheKey)) {
      return this.predictionCache.get(cacheKey);
    }

    // Analyze activation history for patterns
    const recentActivations = this.activationHistory.slice(-10);
    const patternAnalysis = this.analyzeActivationPatterns(currentRule, recentActivations);

    // Get neighbors and score them for prediction
    const neighbors = this.networkData.neighborNetworks[currentRule] || [];
    const predictions = neighbors
      .map(neighbor => ({
        rule: neighbor.neighbor,
        score: neighbor.score,
        prediction: this.calculatePredictionScore(neighbor, patternAnalysis, context),
        confidence: this.calculateConfidence(neighbor, patternAnalysis),
      }))
      .sort((a, b) => b.prediction - a.prediction);

    const result = {
      predictions: predictions.slice(0, 5), // Top 5 predictions
      patternAnalysis,
      timestamp: Date.now(),
    };

    this.predictionCache.set(cacheKey, result);
    return result;
  }

  /**
   * Analyze activation patterns from history
   */
  analyzeActivationPatterns(currentRule, history) {
    const patterns = {
      frequentPairs: new Map(),
      sequencePatterns: [],
      contextPatterns: new Map(),
    };

    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const next = history[i + 1];

      // Track frequent pairs
      const pairKey = `${current.rule}-${next.rule}`;
      patterns.frequentPairs.set(pairKey, (patterns.frequentPairs.get(pairKey) || 0) + 1);

      // Track context patterns
      if (current.context) {
        const contextKey = JSON.stringify(current.context);
        if (!patterns.contextPatterns.has(contextKey)) {
          patterns.contextPatterns.set(contextKey, []);
        }
        patterns.contextPatterns.get(contextKey).push(next.rule);
      }
    }

    return patterns;
  }

  /**
   * Calculate prediction score for a neighbor
   */
  calculatePredictionScore(neighbor, patternAnalysis, context) {
    let score = neighbor.score; // Base similarity score

    // Boost score based on frequent pairing
    const pairKey = `${neighbor.neighbor}-${neighbor.neighbor}`;
    const pairFrequency = patternAnalysis.frequentPairs.get(pairKey) || 0;
    score += (pairFrequency / 10) * 0.2; // Up to 20% boost

    // Boost score based on context patterns
    if (context) {
      const contextKey = JSON.stringify(context);
      const contextPatterns = patternAnalysis.contextPatterns.get(contextKey) || [];
      if (contextPatterns.includes(neighbor.neighbor)) {
        score += 0.15; // 15% boost for context match
      }
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate confidence in prediction
   */
  calculateConfidence(neighbor, patternAnalysis) {
    const pairKey = `${neighbor.neighbor}-${neighbor.neighbor}`;
    const frequency = patternAnalysis.frequentPairs.get(pairKey) || 0;

    // Higher frequency = higher confidence
    return Math.min(frequency / 5, 1); // Max confidence at 5+ occurrences
  }

  /**
   * Dynamic priority weighting based on network state
   */
  calculateDynamicPriorities(activeRules, context) {
    const priorities = new Map();

    for (const rule of this.networkData.rules) {
      let priority = 0;

      // Base priority from activation type
      if (rule.activation === "always") {
        priority = 1.0;
      } else {
        priority = 0.5;
      }

      // Boost priority for active rules and their neighbors
      if (activeRules.includes(rule.name)) {
        priority += 0.3;
      }

      // Boost priority for context-relevant rules
      const contextRelevance = this.analyzeContext(rule.name, context);
      priority += contextRelevance.relevance * 0.2;

      // Boost priority for rules with high neighbor activity
      const neighbors = this.networkData.neighborNetworks[rule.name] || [];
      const activeNeighbors = neighbors.filter(n => activeRules.includes(n.neighbor)).length;
      priority += (activeNeighbors / 7) * 0.1; // Up to 10% boost

      priorities.set(rule.name, Math.min(priority, 1));
    }

    return priorities;
  }

  /**
   * Record activation for learning
   */
  recordActivation(rule, context, outcome) {
    this.activationHistory.push({
      rule,
      context,
      outcome,
      timestamp: Date.now(),
    });

    // Keep only last 100 activations
    if (this.activationHistory.length > 100) {
      this.activationHistory = this.activationHistory.slice(-100);
    }

    // Clear prediction cache periodically
    if (this.activationHistory.length % 20 === 0) {
      this.predictionCache.clear();
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    const avgActivationLatency =
      this.performanceMetrics.activationLatency.length > 0
        ? this.performanceMetrics.activationLatency.reduce((a, b) => a + b, 0) /
          this.performanceMetrics.activationLatency.length
        : 0;

    const report = {
      timestamp: new Date().toISOString(),
      metrics: {
        averageActivationLatency: Math.round(avgActivationLatency * 100) / 100,
        totalActivations: this.activationHistory.length,
        predictionCacheSize: this.predictionCache.size,
        networkEfficiency: this.calculateNetworkEfficiency(),
      },
      recommendations: this.generateRecommendations(),
    };

    return report;
  }

  /**
   * Calculate network efficiency
   */
  calculateNetworkEfficiency() {
    if (this.activationHistory.length < 2) return 0;

    const recentActivations = this.activationHistory.slice(-20);
    let efficientTransitions = 0;

    for (let i = 0; i < recentActivations.length - 1; i++) {
      const current = recentActivations[i];
      const next = recentActivations[i + 1];

      // Check if next rule is a neighbor of current rule
      const neighbors = this.networkData.neighborNetworks[current.rule] || [];
      if (neighbors.some(n => n.neighbor === next.rule)) {
        efficientTransitions++;
      }
    }

    return efficientTransitions / (recentActivations.length - 1);
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Check activation latency
    const avgLatency =
      this.performanceMetrics.activationLatency.length > 0
        ? this.performanceMetrics.activationLatency.reduce((a, b) => a + b, 0) /
          this.performanceMetrics.activationLatency.length
        : 0;

    if (avgLatency > 10) {
      recommendations.push({
        type: "performance",
        message: `Activation latency (${avgLatency.toFixed(2)}ms) exceeds target (10ms). Consider optimizing neighbor lookup.`,
        priority: "high",
      });
    }

    // Check network efficiency
    const efficiency = this.calculateNetworkEfficiency();
    if (efficiency < 0.7) {
      recommendations.push({
        type: "efficiency",
        message: `Network efficiency (${(efficiency * 100).toFixed(1)}%) below target (70%). Review neighbor relationships.`,
        priority: "medium",
      });
    }

    return recommendations;
  }

  /**
   * Save performance metrics
   */
  async saveMetrics() {
    const report = this.generatePerformanceReport();
    const metricsPath = path.join(__dirname, "network-performance-metrics.json");

    fs.writeFileSync(metricsPath, JSON.stringify(report, null, 2));
    console.log("📊 Performance metrics saved");

    return report;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const intelligence = new CascadingIntelligence();

  async function demo() {
    await intelligence.loadNetwork();

    // Simulate some activations
    console.log("\n🔄 Simulating murmuration intelligence...");

    const context1 = {
      domains: ["backend"],
      keywords: ["api", "database"],
      activationType: "contextual",
    };
    const result1 = intelligence.signalPropagation("backend-development", context1);
    console.log(`✅ Backend rule activated in ${result1.activationTime}ms`);
    console.log(`🔗 ${result1.relevantNeighbors.length} neighbors pre-loaded`);

    intelligence.recordActivation("backend-development", context1, "success");

    const predictions = intelligence.predictNextRules("backend-development", context1);
    console.log(
      `🔮 Top prediction: ${predictions.predictions[0]?.rule} (${(predictions.predictions[0]?.prediction * 100).toFixed(1)}%)`
    );

    await intelligence.saveMetrics();
  }

  demo().catch(console.error);
}

export default CascadingIntelligence;
