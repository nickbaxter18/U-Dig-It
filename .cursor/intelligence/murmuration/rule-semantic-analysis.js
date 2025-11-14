#!/usr/bin/env node

/**
 * Murmuration AI: Rule Semantic Analysis Engine
 *
 * Analyzes all 27 rules to create semantic similarity matrix and identify
 * seven-neighbor networks for exponential performance gains.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RuleSemanticAnalyzer {
  constructor() {
    this.rulesDir = path.join(__dirname, "../../rules");
    this.rules = [];
    this.semanticMatrix = {};
    this.neighborNetworks = {};
  }

  /**
   * Extract semantic features from a rule file
   */
  extractSemanticFeatures(ruleContent, ruleName) {
    const features = {
      name: ruleName,
      domains: [],
      capabilities: [],
      focus: [],
      complexity: "medium",
      activation: "auto",
      keywords: [],
    };

    // Extract description
    const descMatch = ruleContent.match(/description:\s*"([^"]+)"/);
    if (descMatch) {
      features.description = descMatch[1];
      features.keywords.push(...descMatch[1].toLowerCase().split(/[,\s]+/));
    }

    // Extract globs to determine context
    const globsMatch = ruleContent.match(/globs:\s*([^\n]+)/);
    if (globsMatch) {
      features.context = globsMatch[1];
      if (globsMatch[1].includes("backend")) features.domains.push("backend");
      if (globsMatch[1].includes("frontend")) features.domains.push("frontend");
      if (globsMatch[1].includes("test")) features.domains.push("testing");
      if (globsMatch[1].includes("auth")) features.domains.push("security");
    }

    // Extract alwaysApply
    const alwaysMatch = ruleContent.match(/alwaysApply:\s*(true|false)/);
    if (alwaysMatch) {
      features.activation = alwaysMatch[1] === "true" ? "always" : "contextual";
    }

    // Extract JSON content for detailed parsing
    const jsonMatch = ruleContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const ruleJson = JSON.parse(jsonMatch[0]);

        // Extract from prePrompt
        if (ruleJson.prePrompt) {
          ruleJson.prePrompt.forEach(prompt => {
            features.keywords.push(...prompt.toLowerCase().split(/\s+/));
            // Extract domain hints from prePrompt
            if (prompt.includes("backend") || prompt.includes("NestJS") || prompt.includes("API")) {
              features.domains.push("backend");
            }
            if (prompt.includes("frontend") || prompt.includes("React") || prompt.includes("UI")) {
              features.domains.push("frontend");
            }
            if (prompt.includes("test") || prompt.includes("testing")) {
              features.domains.push("testing");
            }
            if (prompt.includes("security") || prompt.includes("auth")) {
              features.domains.push("security");
            }
            if (prompt.includes("design") || prompt.includes("UI") || prompt.includes("UX")) {
              features.domains.push("design");
            }
            if (prompt.includes("performance") || prompt.includes("optimization")) {
              features.domains.push("performance");
            }
          });
        }

        // Extract from metaAffirmations
        if (ruleJson.metaAffirmations) {
          ruleJson.metaAffirmations.forEach(affirmation => {
            features.keywords.push(...affirmation.toLowerCase().split(/\s+/));
          });
        }

        // Extract capabilities from metaRules
        if (ruleJson.metaRules) {
          ruleJson.metaRules.forEach(rule => {
            // Extract capability name (first part before colon)
            const capabilityMatch = rule.match(/^([^:]+):/);
            if (capabilityMatch) {
              const capability = capabilityMatch[1].trim();
              features.capabilities.push(capability);
              features.keywords.push(...capability.toLowerCase().split(/\s+/));
            }
          });
        }

        // Extract contextFiles for additional domain hints
        if (ruleJson.contextFiles) {
          ruleJson.contextFiles.forEach(file => {
            if (file.includes("backend")) features.domains.push("backend");
            if (file.includes("frontend")) features.domains.push("frontend");
            if (file.includes("test")) features.domains.push("testing");
            if (file.includes("auth")) features.domains.push("security");
            if (file.includes("design")) features.domains.push("design");
            if (file.includes("performance")) features.domains.push("performance");
          });
        }
      } catch (e) {
        console.error(`Error parsing JSON for rule ${ruleName}:`, e.message);
      }
    }

    // Remove duplicates from arrays
    features.domains = [...new Set(features.domains)];
    features.capabilities = [...new Set(features.capabilities)];
    features.keywords = [...new Set(features.keywords)];

    // Determine complexity based on metaRules count and content depth
    const ruleCount = features.capabilities.length;
    if (ruleCount > 15) features.complexity = "high";
    else if (ruleCount < 8) features.complexity = "low";

    return features;
  }

  /**
   * Calculate semantic similarity between two rules
   */
  calculateSimilarity(rule1, rule2) {
    let score = 0;
    let factors = 0;

    // Domain overlap (40% weight)
    const domainOverlap = this.calculateOverlap(rule1.domains, rule2.domains);
    score += domainOverlap * 0.4;
    factors += 0.4;

    // Keyword overlap (30% weight)
    const keywordOverlap = this.calculateOverlap(rule1.keywords, rule2.keywords);
    score += keywordOverlap * 0.3;
    factors += 0.3;

    // Capability overlap (20% weight)
    const capabilityOverlap = this.calculateOverlap(rule1.capabilities, rule2.capabilities);
    score += capabilityOverlap * 0.2;
    factors += 0.2;

    // Activation type similarity (10% weight)
    if (rule1.activation === rule2.activation) {
      score += 0.1;
    }
    factors += 0.1;

    return factors > 0 ? score / factors : 0;
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
   * Find seven nearest neighbors for each rule
   */
  findSevenNeighbors(ruleName) {
    const similarities = Object.entries(this.semanticMatrix[ruleName] || {})
      .filter(([neighbor, score]) => neighbor !== ruleName && score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([neighbor, score]) => ({ neighbor, score }));

    return similarities;
  }

  /**
   * Analyze all rules and build semantic network
   */
  async analyzeRules() {
    console.log("🔍 Analyzing 27 rules for semantic relationships...");

    const ruleFiles = fs
      .readdirSync(this.rulesDir)
      .filter(file => file.endsWith(".mdc"))
      .sort();

    // Extract features from all rules
    for (const file of ruleFiles) {
      const content = fs.readFileSync(path.join(this.rulesDir, file), "utf8");
      const ruleName = file.replace(".mdc", "");
      const features = this.extractSemanticFeatures(content, ruleName);
      this.rules.push(features);
    }

    console.log(`✅ Extracted features from ${this.rules.length} rules`);

    // Build semantic similarity matrix
    for (let i = 0; i < this.rules.length; i++) {
      const rule1 = this.rules[i];
      this.semanticMatrix[rule1.name] = {};

      for (let j = 0; j < this.rules.length; j++) {
        const rule2 = this.rules[j];
        const similarity = this.calculateSimilarity(rule1, rule2);
        this.semanticMatrix[rule1.name][rule2.name] = similarity;
      }
    }

    console.log("✅ Built semantic similarity matrix");

    // Find seven neighbors for each rule
    for (const rule of this.rules) {
      this.neighborNetworks[rule.name] = this.findSevenNeighbors(rule.name);
    }

    console.log("✅ Identified seven-neighbor networks");

    return {
      rules: this.rules,
      semanticMatrix: this.semanticMatrix,
      neighborNetworks: this.neighborNetworks,
    };
  }

  /**
   * Generate performance metrics
   */
  generateMetrics() {
    const metrics = {
      totalRules: this.rules.length,
      averageNeighborScore: 0,
      networkDensity: 0,
      activationDistribution: { always: 0, contextual: 0 },
      domainDistribution: {},
      complexityDistribution: { low: 0, medium: 0, high: 0 },
    };

    // Calculate average neighbor scores
    let totalScore = 0;
    let totalNeighbors = 0;

    for (const neighbors of Object.values(this.neighborNetworks)) {
      for (const neighbor of neighbors) {
        totalScore += neighbor.score;
        totalNeighbors++;
      }
    }

    metrics.averageNeighborScore = totalNeighbors > 0 ? totalScore / totalNeighbors : 0;

    // Calculate network density
    const maxPossibleConnections = this.rules.length * 7;
    metrics.networkDensity = totalNeighbors / maxPossibleConnections;

    // Distribution analysis
    for (const rule of this.rules) {
      metrics.activationDistribution[rule.activation]++;
      metrics.complexityDistribution[rule.complexity]++;

      for (const domain of rule.domains) {
        metrics.domainDistribution[domain] = (metrics.domainDistribution[domain] || 0) + 1;
      }
    }

    return metrics;
  }

  /**
   * Save analysis results
   */
  async saveResults() {
    const results = await this.analyzeRules();
    const metrics = this.generateMetrics();

    // Save rule network graph
    fs.writeFileSync(
      path.join(__dirname, "rule-network-graph.json"),
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          metrics,
          rules: results.rules,
          semanticMatrix: results.semanticMatrix,
          neighborNetworks: results.neighborNetworks,
        },
        null,
        2
      )
    );

    // Generate human-readable summary
    const summary = this.generateSummary(results, metrics);
    fs.writeFileSync(path.join(__dirname, "network-analysis-summary.md"), summary);

    console.log("🎯 Murmuration network analysis complete!");
    console.log(`📊 Network density: ${(metrics.networkDensity * 100).toFixed(1)}%`);
    console.log(`🔗 Average neighbor score: ${metrics.averageNeighborScore.toFixed(3)}`);
    console.log(`📁 Results saved to: ${__dirname}`);

    return results;
  }

  /**
   * Generate human-readable summary
   */
  generateSummary(results, metrics) {
    let summary = `# Murmuration AI Network Analysis\n\n`;
    summary += `**Generated:** ${new Date().toISOString()}\n\n`;

    summary += `## Network Metrics\n\n`;
    summary += `- **Total Rules:** ${metrics.totalRules}\n`;
    summary += `- **Network Density:** ${(metrics.networkDensity * 100).toFixed(1)}%\n`;
    summary += `- **Average Neighbor Score:** ${metrics.averageNeighborScore.toFixed(3)}\n\n`;

    summary += `## Activation Distribution\n\n`;
    for (const [type, count] of Object.entries(metrics.activationDistribution)) {
      summary += `- **${type}:** ${count} rules\n`;
    }

    summary += `\n## Domain Distribution\n\n`;
    for (const [domain, count] of Object.entries(metrics.domainDistribution)) {
      summary += `- **${domain}:** ${count} rules\n`;
    }

    summary += `\n## Seven-Neighbor Networks\n\n`;
    for (const [ruleName, neighbors] of Object.entries(results.neighborNetworks)) {
      summary += `### ${ruleName}\n\n`;
      for (const neighbor of neighbors) {
        summary += `- **${neighbor.neighbor}** (${neighbor.score.toFixed(3)})\n`;
      }
      summary += `\n`;
    }

    return summary;
  }
}

// Execute analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new RuleSemanticAnalyzer();
  analyzer.saveResults().catch(console.error);
}

export default RuleSemanticAnalyzer;
