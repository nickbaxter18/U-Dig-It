#!/usr/bin/env node

/**
 * Murmuration AI: Final Validation Test
 *
 * Comprehensive test to validate all Phase 1-4 optimizations
 * and demonstrate the complete murmuration system capabilities.
 */

import CursorIntegration from "./cursor-integration.js";
import MurmurationAISystem from "./murmuration-ai-system.js";
import PerformanceOptimizer from "./performance-optimizer.js";

class FinalValidation {
  constructor() {
    this.integration = null;
    this.system = null;
    this.optimizer = null;
    this.results = {
      phase1: {},
      phase2: {},
      phase3: {},
      phase4: {},
      overall: {},
    };
  }

  async initialize() {
    console.log("🎯 Initializing Final Validation Test Suite...\n");

    this.integration = new CursorIntegration();
    await this.integration.initialize();

    this.system = new MurmurationAISystem();
    await this.system.initialize();

    this.optimizer = new PerformanceOptimizer();
    await this.optimizer.initialize();

    console.log("✅ All systems initialized and ready for validation\n");
  }

  /**
   * Phase 1: Critical Fixes Validation
   */
  async validatePhase1() {
    console.log("📋 Phase 1: Critical Fixes Validation");
    console.log("=" * 50);

    const testContexts = [
      {
        name: "Backend API Development",
        context: {
          filePath: "/src/api/users.controller.ts",
          domains: ["backend"],
          imports: ["@nestjs/common", "typeorm"],
        },
        expectedMinRecommendations: 5,
        expectedMinConfidence: 0.75,
      },
      {
        name: "Frontend Component Development",
        context: {
          filePath: "/src/components/UserProfile.tsx",
          domains: ["frontend"],
          imports: ["react", "@types/react"],
        },
        expectedMinRecommendations: 5,
        expectedMinConfidence: 0.75,
      },
      {
        name: "Testing Implementation",
        context: {
          filePath: "/src/auth/auth.service.spec.ts",
          domains: ["testing"],
          imports: ["@nestjs/testing", "jest"],
        },
        expectedMinRecommendations: 5,
        expectedMinConfidence: 0.75,
      },
    ];

    const results = [];

    for (const test of testContexts) {
      const startTime = performance.now();
      const result = await this.integration.getCoordinatedRecommendations(test.context);
      const responseTime = performance.now() - startTime;

      const testResult = {
        testName: test.name,
        responseTime: responseTime,
        recommendationCount: result.response.recommendations.length,
        confidence: result.response.confidence,
        insightsCount: result.response.insights.length,
        passed:
          result.response.recommendations.length >= test.expectedMinRecommendations &&
          result.response.confidence >= test.expectedMinConfidence,
      };

      results.push(testResult);

      console.log(`   ${testResult.passed ? "✅" : "❌"} ${test.name}:`);
      console.log(
        `      📋 Recommendations: ${testResult.recommendationCount} (target: ${test.expectedMinRecommendations}+)`
      );
      console.log(
        `      🎯 Confidence: ${(testResult.confidence * 100).toFixed(1)}% (target: ${test.expectedMinConfidence * 100}%+)`
      );
      console.log(`      💡 Insights: ${testResult.insightsCount}`);
      console.log(`      ⚡ Response Time: ${testResult.responseTime.toFixed(2)}ms`);
      console.log("");
    }

    const avgRecommendations =
      results.reduce((sum, r) => sum + r.recommendationCount, 0) / results.length;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const passRate = results.filter(r => r.passed).length / results.length;

    this.results.phase1 = {
      avgRecommendations,
      avgConfidence,
      avgResponseTime,
      passRate,
      results,
    };

    console.log(
      `📊 Phase 1 Results: ${avgRecommendations.toFixed(1)} avg recommendations, ${(avgConfidence * 100).toFixed(1)}% avg confidence, ${avgResponseTime.toFixed(2)}ms avg response time`
    );
    console.log(`🎯 Pass Rate: ${(passRate * 100).toFixed(1)}%\n`);

    return this.results.phase1;
  }

  /**
   * Phase 2: Context Enhancement Validation
   */
  async validatePhase2() {
    console.log("🧠 Phase 2: Context Enhancement Validation");
    console.log("=" * 50);

    // Test context persistence across multiple requests
    const contextSequence = [
      { filePath: "/src/entities/user.entity.ts", domains: ["backend"] },
      { filePath: "/src/api/users.service.ts", domains: ["backend"] },
      { filePath: "/src/api/users.controller.ts", domains: ["backend"] },
      { filePath: "/src/api/users.service.spec.ts", domains: ["testing"] },
      { filePath: "/src/components/UserProfile.tsx", domains: ["frontend"] },
    ];

    const results = [];

    for (let i = 0; i < contextSequence.length; i++) {
      const context = contextSequence[i];
      await this.integration.getCoordinatedRecommendations(context);

      const workingContext = this.integration.getWorkingContextSummary();

      const testResult = {
        step: i + 1,
        filePath: context.filePath,
        recentFiles: workingContext.recentFiles.length,
        activeDomains: workingContext.activeDomains.length,
        workingPatterns: workingContext.workingPatterns.length,
        currentTask: workingContext.currentTask,
      };

      results.push(testResult);

      console.log(`   Step ${i + 1}: ${context.filePath.split("/").pop()}`);
      console.log(`      📁 Recent Files: ${testResult.recentFiles}`);
      console.log(`      🎯 Active Domains: ${testResult.activeDomains}`);
      console.log(`      🔄 Working Patterns: ${testResult.workingPatterns}`);
      console.log(`      📋 Current Task: ${testResult.currentTask || "none"}`);
      console.log("");
    }

    const finalContext = this.integration.getWorkingContextSummary();
    const contextRichness =
      finalContext.recentFiles.length +
      finalContext.activeDomains.length +
      finalContext.workingPatterns.length;

    this.results.phase2 = {
      contextRichness,
      finalContext,
      results,
    };

    console.log(`📊 Phase 2 Results: Context richness score ${contextRichness} (target: 10+)`);
    console.log(
      `🎯 Context Awareness: ${contextRichness >= 10 ? "✅ ACHIEVED" : "❌ NEEDS IMPROVEMENT"}\n`
    );

    return this.results.phase2;
  }

  /**
   * Phase 3: Advanced Features Validation
   */
  async validatePhase3() {
    console.log("🚀 Phase 3: Advanced Features Validation");
    console.log("=" * 50);

    // Test workflow detection
    const workflowTests = [
      {
        name: "API Creation Workflow",
        context: {
          filePath: "/src/api/orders.controller.ts",
          domains: ["backend"],
          imports: ["@nestjs/common", "typeorm"],
        },
        expectedWorkflow: "api-creation",
      },
      {
        name: "Component Creation Workflow",
        context: {
          filePath: "/src/components/OrderForm.tsx",
          domains: ["frontend"],
          imports: ["react", "@types/react"],
        },
        expectedWorkflow: "component-creation",
      },
    ];

    const results = [];

    for (const test of workflowTests) {
      const result = await this.integration.getCoordinatedRecommendations(test.context);

      // Check for workflow insights
      const workflowInsights = result.response.insights.filter(
        insight => insight.type === "workflow-guidance"
      );

      const testResult = {
        testName: test.name,
        workflowDetected: workflowInsights.length > 0,
        workflowType: workflowInsights[0]?.workflow || null,
        insightsCount: result.response.insights.length,
        recommendationsCount: result.response.recommendations.length,
      };

      results.push(testResult);

      console.log(`   ${testResult.workflowDetected ? "✅" : "❌"} ${test.name}:`);
      console.log(`      🔄 Workflow Detected: ${testResult.workflowDetected}`);
      if (testResult.workflowType) {
        console.log(`      📋 Workflow Type: ${testResult.workflowType}`);
      }
      console.log(`      💡 Insights: ${testResult.insightsCount}`);
      console.log(`      📋 Recommendations: ${testResult.recommendationsCount}`);
      console.log("");
    }

    const workflowDetectionRate = results.filter(r => r.workflowDetected).length / results.length;

    this.results.phase3 = {
      workflowDetectionRate,
      results,
    };

    console.log(
      `📊 Phase 3 Results: ${(workflowDetectionRate * 100).toFixed(1)}% workflow detection rate`
    );
    console.log(
      `🎯 Advanced Features: ${workflowDetectionRate >= 0.5 ? "✅ WORKING" : "❌ NEEDS IMPROVEMENT"}\n`
    );

    return this.results.phase3;
  }

  /**
   * Phase 4: Performance Optimization Validation
   */
  async validatePhase4() {
    console.log("⚡ Phase 4: Performance Optimization Validation");
    console.log("=" * 50);

    // Test sub-5ms response times
    const performanceTests = [
      {
        name: "Backend Hot Rules",
        context: {
          filePath: "/src/api/users.controller.ts",
          domains: ["backend"],
          imports: ["@nestjs/common", "typeorm"],
        },
        expectedMaxTime: 5,
      },
      {
        name: "Frontend Hot Rules",
        context: {
          filePath: "/src/components/UserProfile.tsx",
          domains: ["frontend"],
          imports: ["react", "@types/react"],
        },
        expectedMaxTime: 5,
      },
      {
        name: "Testing Hot Rules",
        context: {
          filePath: "/src/auth/auth.service.spec.ts",
          domains: ["testing"],
          imports: ["@nestjs/testing", "jest"],
        },
        expectedMaxTime: 5,
      },
    ];

    const results = [];

    for (const test of performanceTests) {
      const startTime = performance.now();
      const result = await this.integration.getCoordinatedRecommendations(test.context);
      const responseTime = performance.now() - startTime;

      const testResult = {
        testName: test.name,
        responseTime: responseTime,
        passed: responseTime <= test.expectedMaxTime,
        recommendationCount: result.response.recommendations.length,
        confidence: result.response.confidence,
      };

      results.push(testResult);

      console.log(`   ${testResult.passed ? "✅" : "❌"} ${test.name}:`);
      console.log(
        `      ⚡ Response Time: ${testResult.responseTime.toFixed(2)}ms (target: ≤${test.expectedMaxTime}ms)`
      );
      console.log(`      📋 Recommendations: ${testResult.recommendationCount}`);
      console.log(`      🎯 Confidence: ${(testResult.confidence * 100).toFixed(1)}%`);
      console.log("");
    }

    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const passRate = results.filter(r => r.passed).length / results.length;
    const fastestResponse = Math.min(...results.map(r => r.responseTime));

    this.results.phase4 = {
      avgResponseTime,
      passRate,
      fastestResponse,
      results,
    };

    console.log(
      `📊 Phase 4 Results: ${avgResponseTime.toFixed(2)}ms avg response time, ${fastestResponse.toFixed(2)}ms fastest`
    );
    console.log(
      `🎯 Performance Target: ${passRate >= 0.8 ? "✅ ACHIEVED" : "❌ NEEDS IMPROVEMENT"} (${(passRate * 100).toFixed(1)}% under 5ms)\n`
    );

    return this.results.phase4;
  }

  /**
   * Overall System Validation
   */
  async validateOverall() {
    console.log("🏆 Overall System Validation");
    console.log("=" * 50);

    // Calculate overall scores
    const phase1Score = this.results.phase1.passRate * 25; // 25% weight
    const phase2Score = (this.results.phase2.contextRichness >= 10 ? 1 : 0) * 25; // 25% weight
    const phase3Score = this.results.phase3.workflowDetectionRate * 25; // 25% weight
    const phase4Score = this.results.phase4.passRate * 25; // 25% weight

    const overallScore = phase1Score + phase2Score + phase3Score + phase4Score;

    this.results.overall = {
      overallScore,
      phase1Score,
      phase2Score,
      phase3Score,
      phase4Score,
      grade: this.getGrade(overallScore),
    };

    console.log(`📊 Overall Performance Scores:`);
    console.log(`   Phase 1 (Critical Fixes): ${phase1Score.toFixed(1)}/25`);
    console.log(`   Phase 2 (Context Enhancement): ${phase2Score.toFixed(1)}/25`);
    console.log(`   Phase 3 (Advanced Features): ${phase3Score.toFixed(1)}/25`);
    console.log(`   Phase 4 (Performance Optimization): ${phase4Score.toFixed(1)}/25`);
    console.log(
      `   🏆 OVERALL SCORE: ${overallScore.toFixed(1)}/100 (${this.results.overall.grade})`
    );
    console.log("");

    if (overallScore >= 90) {
      console.log("🎉 EXCELLENT! All murmuration optimizations are working perfectly!");
    } else if (overallScore >= 80) {
      console.log("✅ VERY GOOD! Most optimizations are working effectively!");
    } else if (overallScore >= 70) {
      console.log("⚠️ GOOD! Some optimizations need improvement.");
    } else if (overallScore >= 60) {
      console.log("❌ FAIR! Several optimizations require attention.");
    } else {
      console.log("❌ POOR! Significant optimization work needed.");
    }

    return this.results.overall;
  }

  /**
   * Get grade based on score
   */
  getGrade(score) {
    if (score >= 95) return "A+";
    if (score >= 90) return "A";
    if (score >= 85) return "B+";
    if (score >= 80) return "B";
    if (score >= 75) return "C+";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  /**
   * Run complete validation
   */
  async runValidation() {
    console.log("🚀 MURMURATION AI SYSTEM: FINAL VALIDATION");
    console.log("=" * 60);
    console.log("");

    await this.validatePhase1();
    await this.validatePhase2();
    await this.validatePhase3();
    await this.validatePhase4();
    await this.validateOverall();

    console.log("=" * 60);
    console.log("🎯 VALIDATION COMPLETE");
    console.log("=" * 60);

    return this.results;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validation = new FinalValidation();

  async function runValidation() {
    await validation.initialize();
    await validation.runValidation();
  }

  runValidation().catch(console.error);
}

export default FinalValidation;



