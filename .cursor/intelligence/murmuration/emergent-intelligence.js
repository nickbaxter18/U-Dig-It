#!/usr/bin/env node

/**
 * Murmuration AI: Emergent Intelligence Layer
 *
 * Creates cross-rule synthesis, emergent insights, and self-learning loops
 * that produce intelligence beyond individual rules.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmergentIntelligence {
  constructor() {
    this.networkData = null;
    this.synthesisPatterns = new Map();
    this.emergentInsights = [];
    this.learningHistory = [];
    this.knowledgeGraph = new Map();

    // Workflow chains for common development patterns
    this.workflowChains = {
      "api-creation": [
        { stage: "define", rules: ["api-database-standards", "backend-development"] },
        { stage: "implement", rules: ["backend-development", "security-compliance"] },
        { stage: "test", rules: ["testing-quality-assurance", "e2e-testing-quality-assurance"] },
        { stage: "document", rules: ["documentation-excellence", "api-database-standards"] },
      ],
      "component-creation": [
        { stage: "design", rules: ["design-components", "design-layout-spacing"] },
        { stage: "implement", rules: ["design-components", "design-accessibility"] },
        { stage: "test", rules: ["testing-quality-assurance", "e2e-testing-quality-assurance"] },
        { stage: "optimize", rules: ["performance-optimization", "design-accessibility"] },
      ],
      "bug-fix": [
        { stage: "investigate", rules: ["testing-quality-assurance", "backend-development"] },
        { stage: "diagnose", rules: ["testing-quality-assurance", "performance-optimization"] },
        { stage: "fix", rules: ["backend-development", "security-compliance"] },
        { stage: "test", rules: ["testing-quality-assurance", "e2e-testing-quality-assurance"] },
        { stage: "verify", rules: ["testing-quality-assurance", "performance-optimization"] },
      ],
      "feature-development": [
        { stage: "plan", rules: ["system-architecture", "backend-development"] },
        { stage: "implement", rules: ["backend-development", "api-database-standards"] },
        { stage: "test", rules: ["testing-quality-assurance", "e2e-testing-quality-assurance"] },
        { stage: "document", rules: ["documentation-excellence", "api-database-standards"] },
        { stage: "review", rules: ["security-compliance", "performance-optimization"] },
      ],
    };

    this.currentWorkflowStage = new Map(); // Track user progress through workflows
  }

  /**
   * Load network data and initialize knowledge graph
   */
  async initialize() {
    const networkPath = path.join(__dirname, "rule-network-graph.json");
    this.networkData = JSON.parse(fs.readFileSync(networkPath, "utf8"));

    // Initialize knowledge graph with rule relationships
    for (const rule of this.networkData.rules) {
      this.knowledgeGraph.set(rule.name, {
        rule,
        connections: new Set(),
        insights: [],
        patterns: [],
      });
    }

    console.log(
      "🧠 Emergent intelligence initialized with",
      this.networkData.rules.length,
      "rules"
    );
  }

  /**
   * Detect workflow stage from active rules and context
   */
  detectWorkflowStage(context, activeRules) {
    // Detect workflow from active rules
    for (const [workflow, stages] of Object.entries(this.workflowChains)) {
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const matchingRules = activeRules.filter(r => stage.rules.includes(r));

        if (matchingRules.length > 0) {
          // User is in this workflow stage
          const nextStage = stages[i + 1];
          if (nextStage) {
            return {
              workflow: workflow,
              currentStage: stage.stage,
              nextStage: nextStage.stage,
              suggestedRules: nextStage.rules,
              progress: (i + 1) / stages.length,
              matchingRules: matchingRules,
            };
          }
        }
      }
    }
    return null;
  }

  /**
   * Cross-rule synthesis: Combine insights from multiple active rules
   */
  synthesizeRules(activeRules, context) {
    const startTime = performance.now();

    // Get all active rules and their neighbors
    const synthesisSet = new Set(activeRules);
    for (const rule of activeRules) {
      const neighbors = this.networkData.neighborNetworks[rule] || [];
      neighbors.forEach(neighbor => synthesisSet.add(neighbor.neighbor));
    }

    const synthesisRules = Array.from(synthesisSet);

    // Identify synthesis patterns
    const patterns = this.identifySynthesisPatterns(synthesisRules, context);

    // Generate emergent insights
    const insights = this.generateEmergentInsights(patterns, context);

    // Add workflow detection
    const workflow = this.detectWorkflowStage(context, activeRules);
    if (workflow) {
      insights.push({
        type: "workflow-guidance",
        title: `Workflow Detected: ${workflow.workflow}`,
        description: `You're in the "${workflow.currentStage}" stage. Next: "${workflow.nextStage}"`,
        recommendation: `Consider applying rules: ${workflow.suggestedRules.join(", ")}`,
        workflow: workflow.workflow,
        currentStage: workflow.currentStage,
        nextStage: workflow.nextStage,
        suggestedRules: workflow.suggestedRules,
        progress: workflow.progress,
        confidence: 0.9,
      });
    }

    // Create synthesis result
    const synthesis = {
      activeRules,
      synthesisRules,
      patterns,
      insights,
      workflow,
      timestamp: Date.now(),
      processingTime: performance.now() - startTime,
    };

    // Store for learning
    this.recordSynthesis(synthesis);

    return synthesis;
  }

  /**
   * Identify patterns that emerge from rule combinations
   */
  identifySynthesisPatterns(rules, context) {
    const patterns = [];

    // Pattern 1: Domain Clustering
    const domainClusters = this.identifyDomainClusters(rules);
    if (domainClusters.length > 0) {
      patterns.push({
        type: "domain-clustering",
        description: "Rules cluster around specific domains",
        clusters: domainClusters,
        strength: this.calculatePatternStrength(domainClusters),
      });
    }

    // Pattern 2: Capability Synergy
    const capabilitySynergies = this.identifyCapabilitySynergies(rules);
    if (capabilitySynergies.length > 0) {
      patterns.push({
        type: "capability-synergy",
        description: "Rules create synergistic capabilities",
        synergies: capabilitySynergies,
        strength: this.calculatePatternStrength(capabilitySynergies),
      });
    }

    // Pattern 3: Context Amplification
    const contextAmplification = this.identifyContextAmplification(rules, context);
    if (contextAmplification.length > 0) {
      patterns.push({
        type: "context-amplification",
        description: "Rules amplify each other in current context",
        amplifications: contextAmplification,
        strength: this.calculatePatternStrength(contextAmplification),
      });
    }

    // Pattern 4: Activation Cascade
    const activationCascade = this.identifyActivationCascade(rules);
    if (activationCascade.length > 0) {
      patterns.push({
        type: "activation-cascade",
        description: "Rules activate in predictable sequences",
        cascades: activationCascade,
        strength: this.calculatePatternStrength(activationCascade),
      });
    }

    return patterns;
  }

  /**
   * Identify domain clusters in active rules
   */
  identifyDomainClusters(rules) {
    const domainMap = new Map();

    for (const ruleName of rules) {
      const rule = this.networkData.rules.find(r => r.name === ruleName);
      if (rule && rule.domains) {
        for (const domain of rule.domains) {
          if (!domainMap.has(domain)) {
            domainMap.set(domain, []);
          }
          domainMap.get(domain).push(ruleName);
        }
      }
    }

    return Array.from(domainMap.entries())
      .filter(([domain, rules]) => rules.length > 1)
      .map(([domain, rules]) => ({
        domain,
        rules,
        strength: rules.length / rules.length, // Normalize by total rules
      }));
  }

  /**
   * Identify capability synergies between rules
   */
  identifyCapabilitySynergies(rules) {
    const synergies = [];

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = this.networkData.rules.find(r => r.name === rules[i]);
        const rule2 = this.networkData.rules.find(r => r.name === rules[j]);

        if (rule1 && rule2) {
          const capabilityOverlap = this.calculateOverlap(rule1.capabilities, rule2.capabilities);
          if (capabilityOverlap > 0.3) {
            synergies.push({
              rule1: rules[i],
              rule2: rules[j],
              overlap: capabilityOverlap,
              combinedCapabilities: [...new Set([...rule1.capabilities, ...rule2.capabilities])],
            });
          }
        }
      }
    }

    return synergies;
  }

  /**
   * Identify context amplification patterns
   */
  identifyContextAmplification(rules, context) {
    const amplifications = [];

    for (const ruleName of rules) {
      const rule = this.networkData.rules.find(r => r.name === ruleName);
      if (rule && context) {
        const contextRelevance = this.calculateContextRelevance(rule, context);
        if (contextRelevance > 0.7) {
          amplifications.push({
            rule: ruleName,
            relevance: contextRelevance,
            amplificationFactor: this.calculateAmplificationFactor(rule, context),
          });
        }
      }
    }

    return amplifications;
  }

  /**
   * Identify activation cascade patterns
   */
  identifyActivationCascade(rules) {
    const cascades = [];

    // Look for sequential activation patterns
    for (let i = 0; i < rules.length - 1; i++) {
      const currentRule = rules[i];
      const nextRule = rules[i + 1];

      // Check if next rule is a neighbor of current rule
      const neighbors = this.networkData.neighborNetworks[currentRule] || [];
      const neighborMatch = neighbors.find(n => n.neighbor === nextRule);

      if (neighborMatch) {
        cascades.push({
          from: currentRule,
          to: nextRule,
          strength: neighborMatch.score,
          cascadeType: "neighbor-activation",
        });
      }
    }

    return cascades;
  }

  /**
   * Generate emergent insights from patterns
   */
  generateEmergentInsights(patterns, context) {
    const insights = [];

    for (const pattern of patterns) {
      switch (pattern.type) {
        case "domain-clustering":
          insights.push(this.generateDomainInsight(pattern, context));
          break;
        case "capability-synergy":
          insights.push(this.generateSynergyInsight(pattern, context));
          break;
        case "context-amplification":
          insights.push(this.generateAmplificationInsight(pattern, context));
          break;
        case "activation-cascade":
          insights.push(this.generateCascadeInsight(pattern, context));
          break;
      }
    }

    // Generate meta-insights from pattern combinations
    const metaInsights = this.generateMetaInsights(patterns, context);
    insights.push(...metaInsights);

    return insights;
  }

  /**
   * Generate domain-specific insights
   */
  generateDomainInsight(pattern, context) {
    const strongestCluster = pattern.clusters.reduce((max, cluster) =>
      cluster.strength > max.strength ? cluster : max
    );

    return {
      type: "domain-insight",
      title: `${strongestCluster.domain} Domain Optimization`,
      description: `Strong clustering around ${strongestCluster.domain} domain suggests focused expertise activation.`,
      recommendation: `Leverage ${strongestCluster.domain} domain knowledge for enhanced problem-solving.`,
      rules: strongestCluster.rules,
      confidence: strongestCluster.strength,
      impact: "high",
    };
  }

  /**
   * Generate synergy insights
   */
  generateSynergyInsight(pattern, context) {
    const strongestSynergy = pattern.synergies.reduce((max, synergy) =>
      synergy.overlap > max.overlap ? synergy : max
    );

    return {
      type: "synergy-insight",
      title: `Capability Synergy: ${strongestSynergy.rule1} + ${strongestSynergy.rule2}`,
      description: `Rules ${strongestSynergy.rule1} and ${strongestSynergy.rule2} create synergistic capabilities.`,
      recommendation: `Combine insights from both rules for enhanced problem-solving.`,
      combinedCapabilities: strongestSynergy.combinedCapabilities,
      confidence: strongestSynergy.overlap,
      impact: "medium",
    };
  }

  /**
   * Generate amplification insights
   */
  generateAmplificationInsight(pattern, context) {
    const strongestAmplification = pattern.amplifications.reduce((max, amp) =>
      amp.relevance > max.relevance ? amp : max
    );

    return {
      type: "amplification-insight",
      title: `Context Amplification: ${strongestAmplification.rule}`,
      description: `Rule ${strongestAmplification.rule} is highly amplified in current context.`,
      recommendation: `Prioritize insights from ${strongestAmplification.rule} for maximum impact.`,
      amplificationFactor: strongestAmplification.amplificationFactor,
      confidence: strongestAmplification.relevance,
      impact: "high",
    };
  }

  /**
   * Generate cascade insights
   */
  generateCascadeInsight(pattern, context) {
    const strongestCascade = pattern.cascades.reduce((max, cascade) =>
      cascade.strength > max.strength ? cascade : max
    );

    return {
      type: "cascade-insight",
      title: `Activation Cascade: ${strongestCascade.from} → ${strongestCascade.to}`,
      description: `Strong activation cascade from ${strongestCascade.from} to ${strongestCascade.to}.`,
      recommendation: `Pre-load ${strongestCascade.to} when ${strongestCascade.from} activates.`,
      cascadeStrength: strongestCascade.strength,
      confidence: strongestCascade.strength,
      impact: "medium",
    };
  }

  /**
   * Generate meta-insights from pattern combinations
   */
  generateMetaInsights(patterns, context) {
    const metaInsights = [];

    // Insight 1: Multi-pattern optimization
    if (patterns.length > 2) {
      metaInsights.push({
        type: "meta-insight",
        title: "Multi-Pattern Optimization Opportunity",
        description: `Multiple patterns detected (${patterns.length}), suggesting complex problem domain.`,
        recommendation: "Apply multi-dimensional reasoning approach for optimal results.",
        patternCount: patterns.length,
        confidence: 0.8,
        impact: "high",
      });
    }

    // Insight 2: Pattern strength analysis
    const avgStrength = patterns.reduce((sum, p) => sum + p.strength, 0) / patterns.length;
    if (avgStrength > 0.7) {
      metaInsights.push({
        type: "meta-insight",
        title: "High Pattern Coherence",
        description: `Strong pattern coherence (${(avgStrength * 100).toFixed(1)}%) indicates optimal rule coordination.`,
        recommendation: "Current rule combination is highly effective for this context.",
        coherence: avgStrength,
        confidence: avgStrength,
        impact: "medium",
      });
    }

    return metaInsights;
  }

  /**
   * Calculate pattern strength
   */
  calculatePatternStrength(items) {
    if (items.length === 0) return 0;
    return (
      items.reduce(
        (sum, item) => sum + (item.strength || item.overlap || item.relevance || 0.5),
        0
      ) / items.length
    );
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
   * Calculate context relevance
   */
  calculateContextRelevance(rule, context) {
    let relevance = 0;

    if (context.domains && rule.domains) {
      const domainOverlap = this.calculateOverlap(context.domains, rule.domains);
      relevance += domainOverlap * 0.4;
    }

    if (context.keywords && rule.keywords) {
      const keywordOverlap = this.calculateOverlap(context.keywords, rule.keywords);
      relevance += keywordOverlap * 0.3;
    }

    if (context.activationType === rule.activation) {
      relevance += 0.3;
    }

    return Math.min(relevance, 1);
  }

  /**
   * Calculate amplification factor
   */
  calculateAmplificationFactor(rule, context) {
    const baseRelevance = this.calculateContextRelevance(rule, context);
    const neighborCount = this.networkData.neighborNetworks[rule.name]?.length || 0;
    const neighborBoost = Math.min(neighborCount / 7, 1) * 0.2; // Up to 20% boost

    return baseRelevance + neighborBoost;
  }

  /**
   * Record synthesis for learning
   */
  recordSynthesis(synthesis) {
    this.learningHistory.push(synthesis);

    // Keep only last 50 syntheses
    if (this.learningHistory.length > 50) {
      this.learningHistory = this.learningHistory.slice(-50);
    }

    // Update knowledge graph
    for (const rule of synthesis.activeRules) {
      const node = this.knowledgeGraph.get(rule);
      if (node) {
        node.insights.push(...synthesis.insights);
        node.patterns.push(...synthesis.patterns);
      }
    }
  }

  /**
   * Self-learning loop: Analyze patterns and evolve
   */
  performSelfLearning() {
    const learningInsights = [];

    // Analyze synthesis patterns
    const patternFrequency = new Map();
    for (const synthesis of this.learningHistory) {
      for (const pattern of synthesis.patterns) {
        const key = `${pattern.type}-${pattern.description}`;
        patternFrequency.set(key, (patternFrequency.get(key) || 0) + 1);
      }
    }

    // Identify successful patterns
    const successfulPatterns = Array.from(patternFrequency.entries())
      .filter(([key, count]) => count > 2)
      .sort(([, a], [, b]) => b - a);

    if (successfulPatterns.length > 0) {
      learningInsights.push({
        type: "learning-insight",
        title: "Successful Pattern Recognition",
        description: `Identified ${successfulPatterns.length} frequently successful patterns.`,
        patterns: successfulPatterns.slice(0, 5),
        recommendation: "Prioritize these patterns for future activations.",
        confidence: 0.9,
        impact: "high",
      });
    }

    // Analyze insight effectiveness
    const insightTypes = new Map();
    for (const synthesis of this.learningHistory) {
      for (const insight of synthesis.insights) {
        insightTypes.set(insight.type, (insightTypes.get(insight.type) || 0) + 1);
      }
    }

    const mostEffectiveInsights = Array.from(insightTypes.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (mostEffectiveInsights.length > 0) {
      learningInsights.push({
        type: "learning-insight",
        title: "Insight Effectiveness Analysis",
        description: `Most effective insight types identified.`,
        effectiveTypes: mostEffectiveInsights,
        recommendation: "Focus on generating these insight types.",
        confidence: 0.8,
        impact: "medium",
      });
    }

    return learningInsights;
  }

  /**
   * Save emergent insights and learning data
   */
  async saveEmergentData() {
    const emergentData = {
      timestamp: new Date().toISOString(),
      totalSyntheses: this.learningHistory.length,
      totalInsights: this.emergentInsights.length,
      knowledgeGraph: Object.fromEntries(this.knowledgeGraph),
      learningInsights: this.performSelfLearning(),
      synthesisPatterns: Object.fromEntries(this.synthesisPatterns),
    };

    const insightsPath = path.join(__dirname, "emergent-insights.md");
    const dataPath = path.join(__dirname, "emergent-intelligence-data.json");

    // Save structured data
    fs.writeFileSync(dataPath, JSON.stringify(emergentData, null, 2));

    // Generate human-readable insights
    const insightsMarkdown = this.generateInsightsMarkdown(emergentData);
    fs.writeFileSync(insightsPath, insightsMarkdown);

    console.log("🧠 Emergent intelligence data saved");
    return emergentData;
  }

  /**
   * Generate human-readable insights markdown
   */
  generateInsightsMarkdown(data) {
    let markdown = `# Emergent Intelligence Insights\n\n`;
    markdown += `**Generated:** ${data.timestamp}\n\n`;
    markdown += `**Total Syntheses:** ${data.totalSyntheses}\n`;
    markdown += `**Total Insights:** ${data.totalInsights}\n\n`;

    markdown += `## Learning Insights\n\n`;
    for (const insight of data.learningInsights) {
      markdown += `### ${insight.title}\n\n`;
      markdown += `${insight.description}\n\n`;
      markdown += `**Recommendation:** ${insight.recommendation}\n\n`;
      markdown += `**Confidence:** ${(insight.confidence * 100).toFixed(1)}%\n`;
      markdown += `**Impact:** ${insight.impact}\n\n`;
    }

    markdown += `## Knowledge Graph Summary\n\n`;
    markdown += `The knowledge graph contains ${Object.keys(data.knowledgeGraph).length} rule nodes with learned patterns and insights.\n\n`;

    return markdown;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const intelligence = new EmergentIntelligence();

  async function demo() {
    await intelligence.initialize();

    console.log("\n🔄 Simulating emergent intelligence...");

    // Simulate rule synthesis
    const activeRules = ["backend-development", "api-database-standards", "security-compliance"];
    const context = {
      domains: ["backend", "security"],
      keywords: ["api", "database", "security"],
      activationType: "contextual",
    };

    const synthesis = intelligence.synthesizeRules(activeRules, context);
    console.log(
      `✅ Synthesized ${activeRules.length} rules in ${synthesis.processingTime.toFixed(2)}ms`
    );
    console.log(`🔍 Generated ${synthesis.insights.length} emergent insights`);
    console.log(`📊 Identified ${synthesis.patterns.length} synthesis patterns`);

    // Show top insight
    if (synthesis.insights.length > 0) {
      const topInsight = synthesis.insights[0];
      console.log(`\n💡 Top Insight: ${topInsight.title}`);
      console.log(`   ${topInsight.description}`);
    }

    await intelligence.saveEmergentData();
  }

  demo().catch(console.error);
}

export default EmergentIntelligence;
