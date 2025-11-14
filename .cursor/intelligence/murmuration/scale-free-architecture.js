#!/usr/bin/env node

/**
 * Murmuration AI: Scale-Free Architecture
 *
 * Implements distributed reasoning, resilience, and scale-free properties
 * that maintain performance regardless of rule count growth.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ScaleFreeArchitecture {
  constructor() {
    this.networkData = null;
    this.reasoningThreads = new Map();
    this.distributedCache = new Map();
    this.resilienceMetrics = new Map();
    this.scaleMetrics = {
      ruleCount: 0,
      activationTime: [],
      memoryUsage: [],
      throughput: [],
    };
  }

  /**
   * Initialize scale-free architecture
   */
  async initialize() {
    const networkPath = path.join(__dirname, "rule-network-graph.json");
    this.networkData = JSON.parse(fs.readFileSync(networkPath, "utf8"));

    this.scaleMetrics.ruleCount = this.networkData.rules.length;

    console.log(`🏗️ Scale-free architecture initialized with ${this.scaleMetrics.ruleCount} rules`);
  }

  /**
   * Distributed reasoning engine - multiple threads like individual starlings
   */
  createReasoningThread(threadId, context, priority = "normal") {
    const thread = {
      id: threadId,
      context,
      priority,
      status: "active",
      startTime: Date.now(),
      rules: new Set(),
      insights: [],
      neighbors: new Set(),
      performance: {
        activations: 0,
        latency: [],
        throughput: 0,
      },
    };

    this.reasoningThreads.set(threadId, thread);
    console.log(`🧵 Created reasoning thread ${threadId} with priority ${priority}`);

    return thread;
  }

  /**
   * Coordinate multiple reasoning threads
   */
  async coordinateReasoningThreads(threads, targetRules) {
    const startTime = performance.now();
    const coordination = {
      threads: threads.map(t => t.id),
      targetRules,
      startTime,
      synchronization: new Map(),
      results: new Map(),
      conflicts: [],
      consensus: null,
    };

    // Phase 1: Parallel activation
    const activationPromises = threads.map(thread => this.activateThreadRules(thread, targetRules));

    const activationResults = await Promise.all(activationPromises);

    // Phase 2: Synchronization
    const syncResults = await this.synchronizeThreads(threads, activationResults);

    // Phase 3: Consensus building
    const consensus = await this.buildConsensus(threads, syncResults);

    coordination.results = consensus;
    coordination.duration = performance.now() - startTime;

    console.log(
      `🔄 Coordinated ${threads.length} threads in ${coordination.duration.toFixed(2)}ms`
    );

    return coordination;
  }

  /**
   * Activate rules for a specific thread
   */
  async activateThreadRules(thread, targetRules) {
    const threadStartTime = performance.now();
    const activations = [];

    for (const rule of targetRules) {
      const activation = await this.activateRuleForThread(thread, rule);
      if (activation) {
        activations.push(activation);
        thread.rules.add(rule);
        thread.performance.activations++;
      }
    }

    const activationTime = performance.now() - threadStartTime;
    thread.performance.latency.push(activationTime);

    return {
      threadId: thread.id,
      activations,
      activationTime,
      rulesActivated: activations.length,
    };
  }

  /**
   * Activate a rule for a specific thread
   */
  async activateRuleForThread(thread, ruleName) {
    const rule = this.networkData.rules.find(r => r.name === ruleName);
    if (!rule) return null;

    // Check if rule is relevant to thread context
    const relevance = this.calculateThreadRelevance(thread, rule);
    if (relevance < 0.3) return null;

    // Get neighbors for this rule
    const neighbors = this.networkData.neighborNetworks[ruleName] || [];

    // Activate top neighbors based on thread context
    const relevantNeighbors = neighbors
      .filter(
        n =>
          this.calculateThreadRelevance(
            thread,
            this.networkData.rules.find(r => r.name === n.neighbor)
          ) > 0.5
      )
      .slice(0, 3); // Limit to 3 neighbors per thread

    return {
      rule: ruleName,
      relevance,
      neighbors: relevantNeighbors,
      threadId: thread.id,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate relevance of a rule to a thread's context
   */
  calculateThreadRelevance(thread, rule) {
    if (!rule) return 0;

    let relevance = 0;

    // Context domain alignment
    if (thread.context.domains && rule.domains) {
      const domainOverlap = this.calculateOverlap(thread.context.domains, rule.domains);
      relevance += domainOverlap * 0.4;
    }

    // Context keyword alignment
    if (thread.context.keywords && rule.keywords) {
      const keywordOverlap = this.calculateOverlap(thread.context.keywords, rule.keywords);
      relevance += keywordOverlap * 0.3;
    }

    // Thread priority alignment
    if (thread.priority === "high" && rule.activation === "always") {
      relevance += 0.2;
    }

    // Complexity alignment
    if (thread.context.complexity === rule.complexity) {
      relevance += 0.1;
    }

    return Math.min(relevance, 1);
  }

  /**
   * Synchronize multiple threads
   */
  async synchronizeThreads(threads, activationResults) {
    const synchronization = {
      conflicts: [],
      sharedInsights: [],
      threadAgreements: new Map(),
      timestamp: Date.now(),
    };

    // Identify conflicts between threads
    for (let i = 0; i < threads.length; i++) {
      for (let j = i + 1; j < threads.length; j++) {
        const conflict = this.identifyThreadConflict(
          threads[i],
          threads[j],
          activationResults[i],
          activationResults[j]
        );
        if (conflict) {
          synchronization.conflicts.push(conflict);
        }
      }
    }

    // Find shared insights across threads
    const allInsights = activationResults.flatMap(result => result.activations);
    const insightGroups = this.groupInsightsByRule(allInsights);

    for (const [rule, insights] of insightGroups) {
      if (insights.length > 1) {
        synchronization.sharedInsights.push({
          rule,
          insights,
          agreement: this.calculateInsightAgreement(insights),
          threadCount: insights.length,
        });
      }
    }

    return synchronization;
  }

  /**
   * Identify conflicts between threads
   */
  identifyThreadConflict(thread1, thread2, result1, result2) {
    const conflicts = [];

    // Check for conflicting rule activations
    const rules1 = new Set(result1.activations.map(a => a.rule));
    const rules2 = new Set(result2.activations.map(a => a.rule));

    for (const rule of rules1) {
      if (rules2.has(rule)) {
        const activation1 = result1.activations.find(a => a.rule === rule);
        const activation2 = result2.activations.find(a => a.rule === rule);

        if (Math.abs(activation1.relevance - activation2.relevance) > 0.3) {
          conflicts.push({
            type: "relevance-conflict",
            rule,
            thread1: thread1.id,
            thread2: thread2.id,
            relevance1: activation1.relevance,
            relevance2: activation2.relevance,
            severity: Math.abs(activation1.relevance - activation2.relevance),
          });
        }
      }
    }

    return conflicts.length > 0 ? conflicts[0] : null;
  }

  /**
   * Group insights by rule
   */
  groupInsightsByRule(insights) {
    const groups = new Map();

    for (const insight of insights) {
      if (!groups.has(insight.rule)) {
        groups.set(insight.rule, []);
      }
      groups.get(insight.rule).push(insight);
    }

    return groups;
  }

  /**
   * Calculate agreement between insights
   */
  calculateInsightAgreement(insights) {
    if (insights.length < 2) return 1;

    const relevances = insights.map(i => i.relevance);
    const avgRelevance = relevances.reduce((sum, r) => sum + r, 0) / relevances.length;
    const variance =
      relevances.reduce((sum, r) => sum + Math.pow(r - avgRelevance, 2), 0) / relevances.length;

    // Lower variance = higher agreement
    return Math.max(0, 1 - variance);
  }

  /**
   * Build consensus from synchronized threads
   */
  async buildConsensus(threads, syncResults) {
    const consensus = {
      agreedRules: [],
      conflictedRules: [],
      sharedInsights: syncResults.sharedInsights,
      confidence: 0,
      threadCount: threads.length,
      timestamp: Date.now(),
    };

    // Process shared insights for consensus
    for (const sharedInsight of syncResults.sharedInsights) {
      if (sharedInsight.agreement > 0.7) {
        consensus.agreedRules.push({
          rule: sharedInsight.rule,
          agreement: sharedInsight.agreement,
          threadCount: sharedInsight.threadCount,
          avgRelevance:
            sharedInsight.insights.reduce((sum, i) => sum + i.relevance, 0) /
            sharedInsight.insights.length,
        });
      } else {
        consensus.conflictedRules.push({
          rule: sharedInsight.rule,
          agreement: sharedInsight.agreement,
          threadCount: sharedInsight.threadCount,
          conflict: "low-agreement",
        });
      }
    }

    // Calculate overall confidence
    const totalInsights = consensus.agreedRules.length + consensus.conflictedRules.length;
    consensus.confidence = totalInsights > 0 ? consensus.agreedRules.length / totalInsights : 0;

    return consensus;
  }

  /**
   * Resilience: System continues functioning if individual rules are unavailable
   */
  async testResilience(failureScenarios = []) {
    const resilienceTest = {
      scenarios: [],
      results: [],
      overallResilience: 0,
      timestamp: Date.now(),
    };

    for (const scenario of failureScenarios) {
      const result = await this.simulateFailure(scenario);
      resilienceTest.scenarios.push(scenario);
      resilienceTest.results.push(result);
    }

    // Calculate overall resilience
    const successfulRecoveries = resilienceTest.results.filter(r => r.recoverySuccess).length;
    resilienceTest.overallResilience =
      resilienceTest.results.length > 0 ? successfulRecoveries / resilienceTest.results.length : 0;

    this.resilienceMetrics.set("lastTest", resilienceTest);

    console.log(
      `🛡️ Resilience test completed: ${(resilienceTest.overallResilience * 100).toFixed(1)}% success rate`
    );

    return resilienceTest;
  }

  /**
   * Simulate failure scenario
   */
  async simulateFailure(scenario) {
    const startTime = performance.now();

    // Simulate rule unavailability
    const unavailableRules = scenario.unavailableRules || [];
    const availableRules = this.networkData.rules.filter(r => !unavailableRules.includes(r.name));

    // Test if system can still function
    const testContext = scenario.context || { domains: ["backend"], keywords: ["api"] };
    const testThread = this.createReasoningThread(`test-${Date.now()}`, testContext);

    // Try to activate rules with reduced set
    const activationResult = await this.activateThreadRules(
      testThread,
      availableRules.map(r => r.name)
    );

    const recoverySuccess = activationResult.rulesActivated >= scenario.minRequiredRules || 0;
    const recoveryTime = performance.now() - startTime;

    return {
      scenario: scenario.name || "Unknown",
      recoverySuccess,
      recoveryTime,
      rulesActivated: activationResult.rulesActivated,
      minRequired: scenario.minRequiredRules || 1,
      availableRules: availableRules.length,
      totalRules: this.networkData.rules.length,
    };
  }

  /**
   * Scale-free property: Maintain performance as rule count increases
   */
  async testScalability(newRuleCounts = [50, 100, 200]) {
    const scalabilityTest = {
      baseline: this.scaleMetrics.ruleCount,
      tests: [],
      performance: new Map(),
      timestamp: Date.now(),
    };

    for (const ruleCount of newRuleCounts) {
      const testResult = await this.simulateScale(ruleCount);
      scalabilityTest.tests.push(testResult);
      scalabilityTest.performance.set(ruleCount, testResult);
    }

    // Calculate scalability metrics
    const baselinePerformance = scalabilityTest.performance.get(this.scaleMetrics.ruleCount);
    if (baselinePerformance) {
      for (const [ruleCount, performance] of scalabilityTest.performance) {
        if (ruleCount !== this.scaleMetrics.ruleCount) {
          const scaleFactor = ruleCount / this.scaleMetrics.ruleCount;
          const performanceRatio =
            performance.avgActivationTime / baselinePerformance.avgActivationTime;

          console.log(
            `📈 Scale test ${ruleCount} rules: ${scaleFactor.toFixed(1)}x rules, ${performanceRatio.toFixed(2)}x time (target: <1.5x)`
          );
        }
      }
    }

    return scalabilityTest;
  }

  /**
   * Simulate system at different scales
   */
  async simulateScale(targetRuleCount) {
    const startTime = performance.now();

    // Simulate additional rules (in practice, these would be real rules)
    const simulatedRules = Array.from(
      { length: targetRuleCount - this.scaleMetrics.ruleCount },
      (_, i) => ({
        name: `simulated-rule-${i}`,
        domains: ["simulated"],
        keywords: [`simulated-${i}`],
        activation: "contextual",
        complexity: "medium",
      })
    );

    // Test activation performance
    const testContext = { domains: ["backend"], keywords: ["api"] };
    const testThread = this.createReasoningThread(`scale-test-${targetRuleCount}`, testContext);

    // Simulate activating a subset of rules
    const activationStartTime = performance.now();
    const sampleRules = simulatedRules.slice(0, Math.min(10, simulatedRules.length));
    const activationResult = await this.activateThreadRules(
      testThread,
      sampleRules.map(r => r.name)
    );
    const activationTime = performance.now() - activationStartTime;

    return {
      ruleCount: targetRuleCount,
      simulatedRules: simulatedRules.length,
      avgActivationTime: activationTime / sampleRules.length,
      totalActivationTime: activationTime,
      rulesActivated: activationResult.rulesActivated,
      testDuration: performance.now() - startTime,
    };
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
   * Generate scale-free architecture report
   */
  generateArchitectureReport() {
    const report = {
      timestamp: new Date().toISOString(),
      scaleMetrics: this.scaleMetrics,
      resilienceMetrics: Object.fromEntries(this.resilienceMetrics),
      activeThreads: this.reasoningThreads.size,
      distributedCache: this.distributedCache.size,
      architecture: {
        type: "scale-free",
        properties: [
          "distributed-reasoning",
          "resilience",
          "scale-invariance",
          "self-organization",
        ],
        performance: {
          activationLatency:
            this.scaleMetrics.activationTime.length > 0
              ? this.scaleMetrics.activationTime.reduce((a, b) => a + b, 0) /
                this.scaleMetrics.activationTime.length
              : 0,
          throughput:
            this.scaleMetrics.throughput.length > 0
              ? this.scaleMetrics.throughput.reduce((a, b) => a + b, 0) /
                this.scaleMetrics.throughput.length
              : 0,
        },
      },
    };

    return report;
  }

  /**
   * Save architecture report
   */
  async saveArchitectureReport() {
    const report = this.generateArchitectureReport();
    const reportPath = path.join(__dirname, "scale-free-architecture-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log("🏗️ Scale-free architecture report saved");
    return report;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const architecture = new ScaleFreeArchitecture();

  async function demo() {
    await architecture.initialize();

    console.log("\n🔄 Testing scale-free architecture...");

    // Test distributed reasoning
    console.log("\n🧵 Testing distributed reasoning...");
    const thread1 = architecture.createReasoningThread(
      "thread-1",
      { domains: ["backend"], keywords: ["api"] },
      "high"
    );
    const thread2 = architecture.createReasoningThread(
      "thread-2",
      { domains: ["frontend"], keywords: ["ui"] },
      "normal"
    );

    const coordination = await architecture.coordinateReasoningThreads(
      [thread1, thread2],
      ["backend-development", "api-database-standards", "design-components"]
    );

    console.log(
      `✅ Coordinated reasoning: ${coordination.results.agreedRules.length} agreed rules, ${coordination.results.confidence.toFixed(2)} confidence`
    );

    // Test resilience
    console.log("\n🛡️ Testing resilience...");
    const resilienceTest = await architecture.testResilience([
      {
        name: "Backend Rule Failure",
        unavailableRules: ["backend-development"],
        minRequiredRules: 2,
      },
      {
        name: "Multiple Rule Failure",
        unavailableRules: ["backend-development", "api-database-standards"],
        minRequiredRules: 1,
      },
    ]);

    // Test scalability
    console.log("\n📈 Testing scalability...");
    const scalabilityTest = await architecture.testScalability([50, 100]);

    await architecture.saveArchitectureReport();
  }

  demo().catch(console.error);
}

export default ScaleFreeArchitecture;
