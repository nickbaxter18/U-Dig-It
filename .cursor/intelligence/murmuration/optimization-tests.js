#!/usr/bin/env node

/**
 * Murmuration AI: Optimization Test Suite
 *
 * Comprehensive tests to validate all optimization improvements
 * and measure performance gains across all phases.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import CursorIntegration from "./cursor-integration.js";
import MurmurationAISystem from "./murmuration-ai-system.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OptimizationTests {
  constructor() {
    this.integration = null;
    this.system = null;
    this.testResults = [];
    this.benchmarkResults = {
      before: {},
      after: {},
    };
  }

  /**
   * Initialize test environment
   */
  async initialize() {
    console.log("🧪 Initializing Optimization Test Suite...\n");

    this.integration = new CursorIntegration();
    await this.integration.initialize();

    this.system = new MurmurationAISystem();
    await this.system.initialize();

    console.log("✅ Test environment ready\n");
  }

  /**
   * Test 1: Recommendation Generation
   */
  async testRecommendationGeneration() {
    console.log("📋 Test 1: Recommendation Generation");

    const testContexts = [
      {
        name: "Backend API Development",
        context: {
          filePath: "/src/api/users.controller.ts",
          domains: ["backend"],
          imports: ["@nestjs/common", "typeorm", "class-validator"],
          recentEdits: ["@Controller('users')", "async createUser()"],
        },
      },
      {
        name: "Frontend Component Development",
        context: {
          filePath: "/src/components/UserProfile.tsx",
          domains: ["frontend"],
          imports: ["react", "@types/react", "styled-components"],
          recentEdits: ["const UserProfile = () =>", "return <div>"],
        },
      },
      {
        name: "Testing Implementation",
        context: {
          filePath: "/src/auth/auth.service.spec.ts",
          domains: ["testing"],
          imports: ["@nestjs/testing", "jest"],
          recentEdits: ["describe('AuthService'", "it('should authenticate user'"],
        },
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
        passed: result.response.recommendations.length >= 5 && result.response.confidence >= 0.75,
      };

      results.push(testResult);

      console.log(
        `   ${testResult.passed ? "✅" : "❌"} ${test.name}: ${testResult.recommendationCount} recommendations, ${(testResult.confidence * 100).toFixed(1)}% confidence, ${testResult.responseTime.toFixed(2)}ms`
      );
    }

    const avgRecommendations =
      results.reduce((sum, r) => sum + r.recommendationCount, 0) / results.length;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const passRate = results.filter(r => r.passed).length / results.length;

    console.log(
      `\n📊 Results: ${avgRecommendations.toFixed(1)} avg recommendations, ${(avgConfidence * 100).toFixed(1)}% avg confidence, ${avgResponseTime.toFixed(2)}ms avg response time`
    );
    console.log(`🎯 Pass Rate: ${(passRate * 100).toFixed(1)}%\n`);

    return {
      testName: "Recommendation Generation",
      results: results,
      summary: {
        avgRecommendations,
        avgConfidence,
        avgResponseTime,
        passRate,
      },
    };
  }

  /**
   * Test 2: Hot Rules Performance
   */
  async testHotRulesPerformance() {
    console.log("⚡ Test 2: Hot Rules Performance");

    const hotDomainTests = [
      {
        name: "Backend Domain (Hot)",
        context: {
          filePath: "/src/api/orders.service.ts",
          domains: ["backend"],
          imports: ["@nestjs/common", "typeorm"],
        },
      },
      {
        name: "Frontend Domain (Hot)",
        context: {
          filePath: "/src/components/OrderForm.tsx",
          domains: ["frontend"],
          imports: ["react", "@types/react"],
        },
      },
      {
        name: "Testing Domain (Hot)",
        context: {
          filePath: "/src/api/orders.service.spec.ts",
          domains: ["testing"],
          imports: ["@nestjs/testing", "jest"],
        },
      },
    ];

    const results = [];

    for (const test of hotDomainTests) {
      const startTime = performance.now();
      const result = await this.integration.getCoordinatedRecommendations(test.context);
      const responseTime = performance.now() - startTime;

      const testResult = {
        testName: test.name,
        responseTime: responseTime,
        usedHotRules: result.components?.semantic?.usedHotRules || false,
        passed: responseTime < 5 && result.response.recommendations.length >= 5,
      };

      results.push(testResult);

      console.log(
        `   ${testResult.passed ? "✅" : "❌"} ${test.name}: ${testResult.responseTime.toFixed(2)}ms ${testResult.usedHotRules ? "[HOT RULES]" : ""}`
      );
    }

    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const hotRulesUsage = results.filter(r => r.usedHotRules).length / results.length;
    const passRate = results.filter(r => r.passed).length / results.length;

    console.log(
      `\n📊 Results: ${avgResponseTime.toFixed(2)}ms avg response time, ${(hotRulesUsage * 100).toFixed(1)}% hot rules usage`
    );
    console.log(`🎯 Pass Rate: ${(passRate * 100).toFixed(1)}%\n`);

    return {
      testName: "Hot Rules Performance",
      results: results,
      summary: {
        avgResponseTime,
        hotRulesUsage,
        passRate,
      },
    };
  }

  /**
   * Test 3: Smart Caching
   */
  async testSmartCaching() {
    console.log("🎯 Test 3: Smart Caching");

    // Create similar contexts with small variations
    const baseContext = {
      filePath: "/src/api/users.service.ts",
      domains: ["backend"],
      imports: ["@nestjs/common", "typeorm", "class-validator"],
      recentEdits: ["async createUser()", "async updateUser()"],
    };

    const similarContexts = [
      { ...baseContext, filePath: "/src/api/users.service.ts" },
      { ...baseContext, filePath: "/src/api/customers.service.ts" }, // Same domain, similar structure
      { ...baseContext, filePath: "/src/api/clients.service.ts" }, // Same domain, similar structure
      { ...baseContext, filePath: "/src/api/users.service.ts" }, // Exact same context
      {
        ...baseContext,
        filePath: "/src/api/users.service.ts",
        recentEdits: ["async deleteUser()"],
      }, // Same file, different edit
    ];

    const results = [];
    let cacheHits = 0;

    for (let i = 0; i < similarContexts.length; i++) {
      const context = similarContexts[i];
      const startTime = performance.now();
      const result = await this.integration.getCoordinatedRecommendations(context);
      const responseTime = performance.now() - startTime;

      // Check if this was a cache hit (very fast response)
      const wasCacheHit = responseTime < 1; // Cache hits should be < 1ms
      if (wasCacheHit) cacheHits++;

      const testResult = {
        testName: `Context ${i + 1}`,
        responseTime: responseTime,
        wasCacheHit: wasCacheHit,
        recommendationCount: result.response.recommendations.length,
      };

      results.push(testResult);

      console.log(
        `   ${wasCacheHit ? "🎯" : "🔄"} Context ${i + 1}: ${testResult.responseTime.toFixed(2)}ms ${wasCacheHit ? "[CACHE HIT]" : "[CACHE MISS]"}`
      );
    }

    const cacheHitRate = cacheHits / similarContexts.length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    console.log(
      `\n📊 Results: ${(cacheHitRate * 100).toFixed(1)}% cache hit rate, ${avgResponseTime.toFixed(2)}ms avg response time`
    );
    console.log(`🎯 Target: 60%+ cache hit rate\n`);

    return {
      testName: "Smart Caching",
      results: results,
      summary: {
        cacheHitRate,
        avgResponseTime,
        targetMet: cacheHitRate >= 0.6,
      },
    };
  }

  /**
   * Test 4: Intent Detection
   */
  async testIntentDetection() {
    console.log("🎯 Test 4: Intent Detection");

    const intentTests = [
      {
        name: "Testing Intent",
        context: { filePath: "/src/auth/auth.service.spec.ts" },
        expectedIntents: ["testing"],
      },
      {
        name: "API Development Intent",
        context: { filePath: "/src/api/users.controller.ts" },
        expectedIntents: ["api-development"],
      },
      {
        name: "UI Development Intent",
        context: { filePath: "/src/components/UserProfile.tsx" },
        expectedIntents: ["ui-development"],
      },
      {
        name: "Security Intent",
        context: { filePath: "/src/auth/security.service.ts" },
        expectedIntents: ["security"],
      },
      {
        name: "Database Intent",
        context: { filePath: "/src/entities/user.entity.ts" },
        expectedIntents: ["database"],
      },
    ];

    const results = [];

    for (const test of intentTests) {
      const intents = this.integration.detectIntent(test.context);
      const detectedCorrectly = test.expectedIntents.every(expected => intents.includes(expected));

      const testResult = {
        testName: test.name,
        detectedIntents: intents,
        expectedIntents: test.expectedIntents,
        passed: detectedCorrectly,
      };

      results.push(testResult);

      console.log(
        `   ${testResult.passed ? "✅" : "❌"} ${test.name}: detected [${intents.join(", ")}], expected [${test.expectedIntents.join(", ")}]`
      );
    }

    const passRate = results.filter(r => r.passed).length / results.length;

    console.log(`\n📊 Results: ${(passRate * 100).toFixed(1)}% intent detection accuracy`);
    console.log(`🎯 Target: 90%+ accuracy\n`);

    return {
      testName: "Intent Detection",
      results: results,
      summary: {
        passRate,
        targetMet: passRate >= 0.9,
      },
    };
  }

  /**
   * Test 5: Context Persistence
   */
  async testContextPersistence() {
    console.log("🧠 Test 5: Context Persistence");

    // Simulate a sequence of file edits
    const fileSequence = [
      { filePath: "/src/entities/user.entity.ts", domains: ["backend"] },
      { filePath: "/src/api/users.service.ts", domains: ["backend"] },
      { filePath: "/src/api/users.controller.ts", domains: ["backend"] },
      { filePath: "/src/api/users.service.spec.ts", domains: ["testing"] },
      { filePath: "/src/components/UserProfile.tsx", domains: ["frontend"] },
    ];

    const results = [];

    for (let i = 0; i < fileSequence.length; i++) {
      const context = fileSequence[i];
      await this.integration.getCoordinatedRecommendations(context);

      const workingContext = this.integration.getWorkingContextSummary();

      const testResult = {
        step: i + 1,
        currentFile: context.filePath,
        recentFiles: workingContext.recentFiles.length,
        activeDomains: workingContext.activeDomains.length,
        workingPatterns: workingContext.workingPatterns.length,
        currentTask: workingContext.currentTask,
      };

      results.push(testResult);

      console.log(
        `   Step ${i + 1}: ${path.basename(context.filePath)} → ${workingContext.recentFiles.length} recent files, ${workingContext.workingPatterns.length} patterns`
      );
    }

    const finalContext = this.integration.getWorkingContextSummary();
    const contextRichness =
      finalContext.recentFiles.length +
      finalContext.activeDomains.length +
      finalContext.workingPatterns.length;

    console.log(
      `\n📊 Results: ${finalContext.recentFiles.length} recent files, ${finalContext.activeDomains.length} domains, ${finalContext.workingPatterns.length} patterns`
    );
    console.log(`🎯 Context Richness Score: ${contextRichness}\n`);

    return {
      testName: "Context Persistence",
      results: results,
      summary: {
        contextRichness,
        targetMet: contextRichness >= 10,
      },
    };
  }

  /**
   * Test 6: Multi-File Context
   */
  async testMultiFileContext() {
    console.log("🔗 Test 6: Multi-File Context");

    const multiFileTests = [
      {
        name: "Service File",
        context: {
          filePath: "/src/api/users.service.ts",
          imports: ["@nestjs/common", "typeorm", "./user.entity"],
        },
        expectedRelationships: ["controller", "test", "entity"],
      },
      {
        name: "Component File",
        context: {
          filePath: "/src/components/UserProfile.tsx",
          imports: ["react", "./UserProfile.styles"],
        },
        expectedRelationships: ["test"],
      },
    ];

    const results = [];

    for (const test of multiFileTests) {
      this.integration.buildFileRelationships(test.context);
      const relationships = this.integration.fileRelationships.get(test.context.filePath) || [];

      const relationshipTypes = relationships.map(r => r.type);
      const detectedCorrectly = test.expectedRelationships.every(expected =>
        relationshipTypes.includes(expected)
      );

      const testResult = {
        testName: test.name,
        detectedRelationships: relationshipTypes,
        expectedRelationships: test.expectedRelationships,
        passed: detectedCorrectly,
      };

      results.push(testResult);

      console.log(
        `   ${testResult.passed ? "✅" : "❌"} ${test.name}: detected [${relationshipTypes.join(", ")}], expected [${test.expectedRelationships.join(", ")}]`
      );
    }

    const passRate = results.filter(r => r.passed).length / results.length;

    console.log(`\n📊 Results: ${(passRate * 100).toFixed(1)}% relationship detection accuracy\n`);

    return {
      testName: "Multi-File Context",
      results: results,
      summary: {
        passRate,
        targetMet: passRate >= 0.8,
      },
    };
  }

  /**
   * Run all optimization tests
   */
  async runAllTests() {
    console.log("🚀 Running Complete Optimization Test Suite\n");
    console.log("=" * 60);

    const tests = [
      () => this.testRecommendationGeneration(),
      () => this.testHotRulesPerformance(),
      () => this.testSmartCaching(),
      () => this.testIntentDetection(),
      () => this.testContextPersistence(),
      () => this.testMultiFileContext(),
    ];

    const allResults = [];

    for (const test of tests) {
      try {
        const result = await test();
        allResults.push(result);
        this.testResults.push(result);
      } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
      }
    }

    // Generate comprehensive report
    this.generateTestReport(allResults);

    return allResults;
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport(results) {
    console.log("\n" + "=" * 60);
    console.log("📊 OPTIMIZATION TEST REPORT");
    console.log("=" * 60);

    let totalTests = 0;
    let passedTests = 0;
    let overallScore = 0;

    for (const result of results) {
      const testScore = this.calculateTestScore(result);
      overallScore += testScore;

      console.log(`\n${result.testName}:`);
      console.log(`   Score: ${testScore.toFixed(1)}/10`);
      console.log(`   Status: ${result.summary.targetMet ? "✅ PASSED" : "❌ NEEDS IMPROVEMENT"}`);

      if (result.summary.avgRecommendations) {
        console.log(
          `   Recommendations: ${result.summary.avgRecommendations.toFixed(1)} (target: 5+)`
        );
      }
      if (result.summary.avgConfidence) {
        console.log(
          `   Confidence: ${(result.summary.avgConfidence * 100).toFixed(1)}% (target: 75%+)`
        );
      }
      if (result.summary.avgResponseTime) {
        console.log(
          `   Response Time: ${result.summary.avgResponseTime.toFixed(2)}ms (target: <5ms)`
        );
      }
      if (result.summary.cacheHitRate) {
        console.log(
          `   Cache Hit Rate: ${(result.summary.cacheHitRate * 100).toFixed(1)}% (target: 60%+)`
        );
      }
      if (result.summary.passRate) {
        console.log(`   Accuracy: ${(result.summary.passRate * 100).toFixed(1)}% (target: 90%+)`);
      }
    }

    const averageScore = overallScore / results.length;
    const grade = this.getGrade(averageScore);

    console.log(`\n🏆 OVERALL SCORE: ${averageScore.toFixed(1)}/10 (${grade})`);

    if (averageScore >= 8) {
      console.log("🎉 EXCELLENT! All optimizations are working effectively.");
    } else if (averageScore >= 6) {
      console.log("✅ GOOD! Most optimizations are working well.");
    } else {
      console.log("⚠️ NEEDS IMPROVEMENT! Some optimizations require attention.");
    }

    // Cache statistics
    const cacheStats = this.integration.getCacheStats();
    console.log(
      `\n📈 Cache Performance: ${cacheStats.hitRate} hit rate, ${cacheStats.cacheSize} entries`
    );

    // Save detailed results
    this.saveTestResults(results, averageScore);
  }

  /**
   * Calculate test score based on performance
   */
  calculateTestScore(result) {
    let score = 0;

    if (result.summary.avgRecommendations) {
      score += Math.min(3, (result.summary.avgRecommendations / 5) * 3); // Max 3 points for recommendations
    }
    if (result.summary.avgConfidence) {
      score += Math.min(2, (result.summary.avgConfidence / 0.75) * 2); // Max 2 points for confidence
    }
    if (result.summary.avgResponseTime) {
      score += Math.min(2, Math.max(0, 2 - (result.summary.avgResponseTime / 5) * 2)); // Max 2 points for speed
    }
    if (result.summary.cacheHitRate) {
      score += Math.min(2, (result.summary.cacheHitRate / 0.6) * 2); // Max 2 points for caching
    }
    if (result.summary.passRate) {
      score += Math.min(1, (result.summary.passRate / 0.9) * 1); // Max 1 point for accuracy
    }

    return Math.min(10, score);
  }

  /**
   * Get letter grade based on score
   */
  getGrade(score) {
    if (score >= 9) return "A+";
    if (score >= 8) return "A";
    if (score >= 7) return "B+";
    if (score >= 6) return "B";
    if (score >= 5) return "C+";
    if (score >= 4) return "C";
    return "D";
  }

  /**
   * Save test results to file
   */
  saveTestResults(results, overallScore) {
    const report = {
      timestamp: new Date().toISOString(),
      overallScore: overallScore,
      grade: this.getGrade(overallScore),
      testResults: results,
      cacheStats: this.integration.getCacheStats(),
      workingContext: this.integration.getWorkingContextSummary(),
    };

    const reportPath = path.join(__dirname, "optimization-test-results.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed results saved to: ${reportPath}`);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tests = new OptimizationTests();

  async function runTests() {
    await tests.initialize();
    await tests.runAllTests();
  }

  runTests().catch(console.error);
}

export default OptimizationTests;



