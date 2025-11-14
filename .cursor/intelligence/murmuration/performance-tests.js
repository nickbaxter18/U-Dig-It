#!/usr/bin/env node

/**
 * Murmuration AI: Performance Test Suite
 *
 * Phase 4 performance tests to validate sub-5ms response times
 * and comprehensive optimization effectiveness.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import CursorIntegration from "./cursor-integration.js";
import MurmurationAISystem from "./murmuration-ai-system.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PerformanceTests {
  constructor() {
    this.integration = null;
    this.system = null;
    this.testResults = [];
    this.performanceMetrics = {
      before: {},
      after: {},
    };
  }

  /**
   * Initialize test environment
   */
  async initialize() {
    console.log("⚡ Initializing Performance Test Suite...\n");

    this.integration = new CursorIntegration();
    await this.integration.initialize();

    this.system = new MurmurationAISystem();
    await this.system.initialize();

    console.log("✅ Performance test environment ready\n");
  }

  /**
   * Test 1: Sub-5ms Response Time Validation
   */
  async testSub5msResponseTimes() {
    console.log("⚡ Test 1: Sub-5ms Response Time Validation");

    const hotContexts = [
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

    for (const test of hotContexts) {
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

      console.log(
        `   ${testResult.passed ? "✅" : "❌"} ${test.name}: ${testResult.responseTime.toFixed(2)}ms (target: ≤${test.expectedMaxTime}ms)`
      );
    }

    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const passRate = results.filter(r => r.passed).length / results.length;
    const fastestResponse = Math.min(...results.map(r => r.responseTime));
    const slowestResponse = Math.max(...results.map(r => r.responseTime));

    console.log(
      `\n📊 Results: ${avgResponseTime.toFixed(2)}ms avg, ${fastestResponse.toFixed(2)}ms fastest, ${slowestResponse.toFixed(2)}ms slowest`
    );
    console.log(`🎯 Pass Rate: ${(passRate * 100).toFixed(1)}%\n`);

    return {
      testName: "Sub-5ms Response Time Validation",
      results: results,
      summary: {
        avgResponseTime,
        fastestResponse,
        slowestResponse,
        passRate,
        targetMet: passRate >= 0.8, // 80% should be under 5ms
      },
    };
  }

  /**
   * Test 2: Cache Performance Validation
   */
  async testCachePerformance() {
    console.log("🎯 Test 2: Cache Performance Validation");

    // Test repeated similar contexts for cache hits
    const baseContext = {
      filePath: "/src/api/users.service.ts",
      domains: ["backend"],
      imports: ["@nestjs/common", "typeorm", "class-validator"],
    };

    const similarContexts = [
      { ...baseContext, filePath: "/src/api/users.service.ts" },
      { ...baseContext, filePath: "/src/api/customers.service.ts" },
      { ...baseContext, filePath: "/src/api/clients.service.ts" },
      { ...baseContext, filePath: "/src/api/users.service.ts" }, // Exact duplicate
      { ...baseContext, filePath: "/src/api/users.service.ts" }, // Another duplicate
    ];

    const results = [];
    let cacheHits = 0;
    let totalTime = 0;

    for (let i = 0; i < similarContexts.length; i++) {
      const context = similarContexts[i];
      const startTime = performance.now();
      const result = await this.integration.getCoordinatedRecommendations(context);
      const responseTime = performance.now() - startTime;
      totalTime += responseTime;

      // Check if this was a cache hit (very fast response)
      const wasCacheHit = responseTime < 2; // Cache hits should be < 2ms
      if (wasCacheHit) cacheHits++;

      const testResult = {
        contextIndex: i + 1,
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
    const avgResponseTime = totalTime / similarContexts.length;

    console.log(
      `\n📊 Results: ${(cacheHitRate * 100).toFixed(1)}% cache hit rate, ${avgResponseTime.toFixed(2)}ms avg response time`
    );
    console.log(`🎯 Target: 60%+ cache hit rate\n`);

    return {
      testName: "Cache Performance Validation",
      results: results,
      summary: {
        cacheHitRate,
        avgResponseTime,
        targetMet: cacheHitRate >= 0.6,
      },
    };
  }

  /**
   * Test 3: Hot Rules Performance
   */
  async testHotRulesPerformance() {
    console.log("🔥 Test 3: Hot Rules Performance");

    const hotRulesTests = [
      {
        name: "Backend Domain",
        context: {
          filePath: "/src/api/orders.controller.ts",
          domains: ["backend"],
          imports: ["@nestjs/common", "typeorm"],
        },
        expectedMaxTime: 2, // Hot rules should be very fast
      },
      {
        name: "Frontend Domain",
        context: {
          filePath: "/src/components/OrderForm.tsx",
          domains: ["frontend"],
          imports: ["react", "@types/react"],
        },
        expectedMaxTime: 2,
      },
      {
        name: "Testing Domain",
        context: {
          filePath: "/src/api/orders.service.spec.ts",
          domains: ["testing"],
          imports: ["@nestjs/testing", "jest"],
        },
        expectedMaxTime: 2,
      },
    ];

    const results = [];

    for (const test of hotRulesTests) {
      const startTime = performance.now();
      const result = await this.integration.getCoordinatedRecommendations(test.context);
      const responseTime = performance.now() - startTime;

      const testResult = {
        testName: test.name,
        responseTime: responseTime,
        passed: responseTime <= test.expectedMaxTime,
        usedHotRules: result.components?.semantic?.usedHotRules || false,
        recommendationCount: result.response.recommendations.length,
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
        targetMet: passRate >= 0.8 && hotRulesUsage >= 0.8,
      },
    };
  }

  /**
   * Test 4: System Performance Metrics
   */
  async testSystemPerformanceMetrics() {
    console.log("📊 Test 4: System Performance Metrics");

    // Get system metrics
    const systemMetrics = this.system.systemMetrics;
    const performanceStats = this.system.components.performanceOptimizer?.getPerformanceStats();
    const cacheStats = this.integration.getCacheStats();

    const metrics = {
      initializationTime: systemMetrics.initializationTime,
      totalActivations: systemMetrics.totalActivations,
      averageResponseTime: systemMetrics.averageResponseTime,
      performanceOptimizer: performanceStats,
      cacheStats: cacheStats,
    };

    console.log(`   📈 System Initialization: ${metrics.initializationTime.toFixed(2)}ms`);
    console.log(`   🔄 Total Activations: ${metrics.totalActivations}`);
    console.log(`   ⚡ Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);

    if (metrics.performanceOptimizer) {
      console.log(`   🎯 Semantic Cache Hit Rate: ${metrics.performanceOptimizer.semanticHitRate}`);
      console.log(`   💾 Response Cache Hit Rate: ${metrics.performanceOptimizer.responseHitRate}`);
      console.log(
        `   🔥 Pre-computed Hit Rate: ${metrics.performanceOptimizer.precomputedHitRate}`
      );
    }

    console.log(`   📊 Integration Cache Hit Rate: ${metrics.cacheStats.hitRate}`);

    // Evaluate performance targets
    const targets = {
      initializationTime: metrics.initializationTime < 100, // Should initialize quickly
      averageResponseTime: metrics.averageResponseTime < 5, // Should be under 5ms
      cacheEffectiveness:
        metrics.cacheStats.hitRate && parseFloat(metrics.cacheStats.hitRate) >= 60,
    };

    const targetMet = Object.values(targets).filter(Boolean).length / Object.keys(targets).length;

    console.log(`\n📊 Performance Targets: ${(targetMet * 100).toFixed(1)}% met\n`);

    return {
      testName: "System Performance Metrics",
      metrics: metrics,
      targets: targets,
      summary: {
        targetMet,
        overallPerformance:
          targetMet >= 0.8 ? "excellent" : targetMet >= 0.6 ? "good" : "needs improvement",
      },
    };
  }

  /**
   * Test 5: Load Testing
   */
  async testLoadPerformance() {
    console.log("🚀 Test 5: Load Testing");

    const loadTestContexts = Array.from({ length: 20 }, (_, i) => ({
      filePath: `/src/api/test${i}.service.ts`,
      domains: ["backend"],
      imports: ["@nestjs/common", "typeorm"],
    }));

    const results = [];
    const startTime = performance.now();

    // Process all contexts
    for (let i = 0; i < loadTestContexts.length; i++) {
      const context = loadTestContexts[i];
      const requestStart = performance.now();
      const result = await this.integration.getCoordinatedRecommendations(context);
      const requestTime = performance.now() - requestStart;

      results.push({
        requestIndex: i + 1,
        responseTime: requestTime,
        recommendationCount: result.response.recommendations.length,
      });
    }

    const totalTime = performance.now() - startTime;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const requestsPerSecond = (loadTestContexts.length / totalTime) * 1000;
    const maxResponseTime = Math.max(...results.map(r => r.responseTime));
    const minResponseTime = Math.min(...results.map(r => r.responseTime));

    console.log(
      `   📊 Total Time: ${totalTime.toFixed(2)}ms for ${loadTestContexts.length} requests`
    );
    console.log(`   ⚡ Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   🚀 Requests Per Second: ${requestsPerSecond.toFixed(1)}`);
    console.log(
      `   📈 Response Time Range: ${minResponseTime.toFixed(2)}ms - ${maxResponseTime.toFixed(2)}ms`
    );

    const performanceTargets = {
      avgResponseTime: avgResponseTime < 5,
      maxResponseTime: maxResponseTime < 10,
      requestsPerSecond: requestsPerSecond > 100,
    };

    const targetsMet =
      Object.values(performanceTargets).filter(Boolean).length /
      Object.keys(performanceTargets).length;

    console.log(`\n📊 Load Test Targets: ${(targetsMet * 100).toFixed(1)}% met\n`);

    return {
      testName: "Load Testing",
      results: results,
      summary: {
        totalTime,
        avgResponseTime,
        requestsPerSecond,
        maxResponseTime,
        minResponseTime,
        targetsMet,
        performanceGrade: targetsMet >= 0.8 ? "A" : targetsMet >= 0.6 ? "B" : "C",
      },
    };
  }

  /**
   * Run all performance tests
   */
  async runAllTests() {
    console.log("🚀 Running Complete Performance Test Suite\n");
    console.log("=" * 60);

    const tests = [
      () => this.testSub5msResponseTimes(),
      () => this.testCachePerformance(),
      () => this.testHotRulesPerformance(),
      () => this.testSystemPerformanceMetrics(),
      () => this.testLoadPerformance(),
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
    this.generatePerformanceReport(allResults);

    return allResults;
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(results) {
    console.log("\n" + "=" * 60);
    console.log("⚡ PERFORMANCE OPTIMIZATION REPORT");
    console.log("=" * 60);

    let totalScore = 0;
    let maxScore = 0;

    for (const result of results) {
      const testScore = this.calculatePerformanceScore(result);
      totalScore += testScore;
      maxScore += 10; // Each test is worth 10 points

      console.log(`\n${result.testName}:`);
      console.log(`   Score: ${testScore.toFixed(1)}/10`);
      console.log(`   Status: ${result.summary.targetMet ? "✅ PASSED" : "❌ NEEDS IMPROVEMENT"}`);

      // Show specific metrics
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
        console.log(`   Pass Rate: ${(result.summary.passRate * 100).toFixed(1)}% (target: 80%+)`);
      }
      if (result.summary.requestsPerSecond) {
        console.log(
          `   Throughput: ${result.summary.requestsPerSecond.toFixed(1)} req/s (target: 100+)`
        );
      }
    }

    const overallScore = (totalScore / maxScore) * 100;
    const grade = this.getPerformanceGrade(overallScore);

    console.log(`\n🏆 OVERALL PERFORMANCE SCORE: ${overallScore.toFixed(1)}% (${grade})`);

    if (overallScore >= 90) {
      console.log("🎉 EXCELLENT! All performance targets achieved.");
    } else if (overallScore >= 80) {
      console.log("✅ GOOD! Most performance targets achieved.");
    } else if (overallScore >= 70) {
      console.log("⚠️ FAIR! Some performance targets need improvement.");
    } else {
      console.log("❌ POOR! Significant performance optimization needed.");
    }

    // Save detailed results
    this.savePerformanceResults(results, overallScore);
  }

  /**
   * Calculate performance test score
   */
  calculatePerformanceScore(result) {
    let score = 0;

    // Response time scoring (4 points max)
    if (result.summary.avgResponseTime) {
      if (result.summary.avgResponseTime <= 2) score += 4;
      else if (result.summary.avgResponseTime <= 5) score += 3;
      else if (result.summary.avgResponseTime <= 10) score += 2;
      else score += 1;
    }

    // Cache performance scoring (3 points max)
    if (result.summary.cacheHitRate) {
      if (result.summary.cacheHitRate >= 0.8) score += 3;
      else if (result.summary.cacheHitRate >= 0.6) score += 2;
      else if (result.summary.cacheHitRate >= 0.4) score += 1;
    }

    // Pass rate scoring (2 points max)
    if (result.summary.passRate) {
      if (result.summary.passRate >= 0.9) score += 2;
      else if (result.summary.passRate >= 0.8) score += 1.5;
      else if (result.summary.passRate >= 0.7) score += 1;
    }

    // Target achievement scoring (1 point max)
    if (result.summary.targetMet) {
      score += 1;
    }

    return Math.min(10, score);
  }

  /**
   * Get performance grade
   */
  getPerformanceGrade(score) {
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
   * Save performance test results
   */
  savePerformanceResults(results, overallScore) {
    const report = {
      timestamp: new Date().toISOString(),
      overallScore: overallScore,
      grade: this.getPerformanceGrade(overallScore),
      testResults: results,
      systemMetrics: this.system.systemMetrics,
      performanceStats: this.system.components.performanceOptimizer?.getPerformanceStats(),
      cacheStats: this.integration.getCacheStats(),
    };

    const reportPath = path.join(__dirname, "performance-test-results.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed results saved to: ${reportPath}`);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tests = new PerformanceTests();

  async function runTests() {
    await tests.initialize();
    await tests.runAllTests();
  }

  runTests().catch(console.error);
}

export default PerformanceTests;



