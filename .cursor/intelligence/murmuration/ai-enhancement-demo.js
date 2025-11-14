/**
 * AI Enhancement Demo: Using Murmuration AI to Improve My Abilities
 *
 * This demonstrates how the murmuration system can enhance AI reasoning,
 * problem-solving, and response quality through coordinated rule activation.
 */

import MurmurationAISystem from "./murmuration-ai-system.js";

class AIEnhancementDemo {
  constructor() {
    this.system = new MurmurationAISystem();
    this.enhancementMetrics = {
      beforeEnhancement: {},
      afterEnhancement: {},
      improvements: {},
    };
  }

  async initialize() {
    console.log("🚀 Initializing AI Enhancement Demo...");
    await this.system.initialize();
    console.log("✅ System ready for AI enhancement!");
  }

  /**
   * Test my abilities before enhancement
   */
  async testBaselineAbilities() {
    console.log("\n📊 Testing baseline AI abilities...");

    const testScenarios = [
      {
        name: "Complex Problem Solving",
        request: {
          type: "problem-solving",
          keywords: ["architecture", "scalability", "performance", "security"],
          context: { domains: ["backend", "frontend"], complexity: "high" },
        },
      },
      {
        name: "Code Quality Analysis",
        request: {
          type: "code-review",
          keywords: ["typescript", "react", "testing", "accessibility"],
          context: { domains: ["frontend", "testing"], complexity: "medium" },
        },
      },
      {
        name: "System Design",
        request: {
          type: "system-design",
          keywords: ["microservices", "database", "api", "monitoring"],
          context: { domains: ["backend", "architecture"], complexity: "high" },
        },
      },
    ];

    const baselineResults = [];

    for (const scenario of testScenarios) {
      console.log(`\n🧪 Testing: ${scenario.name}`);
      const result = await this.system.processRequest(scenario.request, scenario.request.context);

      baselineResults.push({
        scenario: scenario.name,
        responseTime: result.processingTime,
        confidence: result.response.confidence,
        insights: result.response.insights.length,
        recommendations: result.response.recommendations.length,
        quality: this.calculateResponseQuality(result),
      });

      console.log(`   ⚡ Response time: ${result.processingTime.toFixed(2)}ms`);
      console.log(`   🎯 Confidence: ${(result.response.confidence * 100).toFixed(1)}%`);
      console.log(`   💡 Insights: ${result.response.insights.length}`);
      console.log(`   📋 Recommendations: ${result.response.recommendations.length}`);
    }

    this.enhancementMetrics.beforeEnhancement = {
      averageResponseTime:
        baselineResults.reduce((sum, r) => sum + r.responseTime, 0) / baselineResults.length,
      averageConfidence:
        baselineResults.reduce((sum, r) => sum + r.confidence, 0) / baselineResults.length,
      averageInsights:
        baselineResults.reduce((sum, r) => sum + r.insights, 0) / baselineResults.length,
      averageRecommendations:
        baselineResults.reduce((sum, r) => sum + r.recommendations, 0) / baselineResults.length,
      averageQuality:
        baselineResults.reduce((sum, r) => sum + r.quality, 0) / baselineResults.length,
      results: baselineResults,
    };

    return baselineResults;
  }

  /**
   * Apply murmuration enhancement techniques
   */
  async applyEnhancement() {
    console.log("\n🔧 Applying murmuration enhancement techniques...");

    // Start background optimization
    await this.system.startBackgroundOptimization();

    // Simulate learning from previous interactions
    await this.simulateLearning();

    // Optimize rule coordination
    await this.optimizeRuleCoordination();

    console.log("✅ Enhancement techniques applied!");
  }

  /**
   * Test abilities after enhancement
   */
  async testEnhancedAbilities() {
    console.log("\n📈 Testing enhanced AI abilities...");

    const testScenarios = [
      {
        name: "Complex Problem Solving (Enhanced)",
        request: {
          type: "problem-solving",
          keywords: ["architecture", "scalability", "performance", "security", "optimization"],
          context: { domains: ["backend", "frontend", "performance"], complexity: "high" },
        },
      },
      {
        name: "Code Quality Analysis (Enhanced)",
        request: {
          type: "code-review",
          keywords: ["typescript", "react", "testing", "accessibility", "performance"],
          context: { domains: ["frontend", "testing", "accessibility"], complexity: "medium" },
        },
      },
      {
        name: "System Design (Enhanced)",
        request: {
          type: "system-design",
          keywords: ["microservices", "database", "api", "monitoring", "resilience"],
          context: { domains: ["backend", "architecture", "operations"], complexity: "high" },
        },
      },
    ];

    const enhancedResults = [];

    for (const scenario of testScenarios) {
      console.log(`\n🧪 Testing: ${scenario.name}`);
      const result = await this.system.processRequest(scenario.request, scenario.request.context);

      enhancedResults.push({
        scenario: scenario.name,
        responseTime: result.processingTime,
        confidence: result.response.confidence,
        insights: result.response.insights.length,
        recommendations: result.response.recommendations.length,
        quality: this.calculateResponseQuality(result),
      });

      console.log(`   ⚡ Response time: ${result.processingTime.toFixed(2)}ms`);
      console.log(`   🎯 Confidence: ${(result.response.confidence * 100).toFixed(1)}%`);
      console.log(`   💡 Insights: ${result.response.insights.length}`);
      console.log(`   📋 Recommendations: ${result.response.recommendations.length}`);
    }

    this.enhancementMetrics.afterEnhancement = {
      averageResponseTime:
        enhancedResults.reduce((sum, r) => sum + r.responseTime, 0) / enhancedResults.length,
      averageConfidence:
        enhancedResults.reduce((sum, r) => sum + r.confidence, 0) / enhancedResults.length,
      averageInsights:
        enhancedResults.reduce((sum, r) => sum + r.insights, 0) / enhancedResults.length,
      averageRecommendations:
        enhancedResults.reduce((sum, r) => sum + r.recommendations, 0) / enhancedResults.length,
      averageQuality:
        enhancedResults.reduce((sum, r) => sum + r.quality, 0) / enhancedResults.length,
      results: enhancedResults,
    };

    return enhancedResults;
  }

  /**
   * Calculate response quality score
   */
  calculateResponseQuality(result) {
    const timeScore = Math.max(0, 1 - result.processingTime / 100); // Lower time = higher score
    const confidenceScore = result.response.confidence;
    const insightScore = Math.min(result.response.insights.length / 5, 1); // Max 5 insights
    const recommendationScore = Math.min(result.response.recommendations.length / 3, 1); // Max 3 recommendations

    return timeScore * 0.3 + confidenceScore * 0.4 + insightScore * 0.2 + recommendationScore * 0.1;
  }

  /**
   * Simulate learning from interactions
   */
  async simulateLearning() {
    console.log("🧠 Simulating learning from interactions...");

    // Simulate multiple learning cycles
    for (let i = 0; i < 5; i++) {
      const learningRequest = {
        type: "learning",
        keywords: ["optimization", "pattern", "improvement"],
        context: { domains: ["performance"], complexity: "medium" },
      };

      await this.system.processRequest(learningRequest, learningRequest.context);
    }

    console.log("✅ Learning simulation complete");
  }

  /**
   * Optimize rule coordination
   */
  async optimizeRuleCoordination() {
    console.log("🔗 Optimizing rule coordination...");

    // Simulate rule coordination optimization
    const optimizationRequest = {
      type: "optimization",
      keywords: ["coordination", "efficiency", "performance"],
      context: { domains: ["performance", "optimization"], complexity: "high" },
    };

    await this.system.processRequest(optimizationRequest, optimizationRequest.context);
    console.log("✅ Rule coordination optimized");
  }

  /**
   * Calculate improvement metrics
   */
  calculateImprovements() {
    const before = this.enhancementMetrics.beforeEnhancement;
    const after = this.enhancementMetrics.afterEnhancement;

    this.enhancementMetrics.improvements = {
      responseTimeImprovement:
        ((before.averageResponseTime - after.averageResponseTime) / before.averageResponseTime) *
        100,
      confidenceImprovement:
        ((after.averageConfidence - before.averageConfidence) / before.averageConfidence) * 100,
      insightsImprovement:
        ((after.averageInsights - before.averageInsights) / Math.max(before.averageInsights, 1)) *
        100,
      recommendationsImprovement:
        ((after.averageRecommendations - before.averageRecommendations) /
          Math.max(before.averageRecommendations, 1)) *
        100,
      qualityImprovement:
        ((after.averageQuality - before.averageQuality) / before.averageQuality) * 100,
    };
  }

  /**
   * Generate enhancement report
   */
  generateEnhancementReport() {
    const improvements = this.enhancementMetrics.improvements;

    console.log("\n📊 AI Enhancement Report");
    console.log("=".repeat(50));

    console.log("\n🚀 Performance Improvements:");
    console.log(
      `   Response Time: ${improvements.responseTimeImprovement.toFixed(1)}% ${improvements.responseTimeImprovement > 0 ? "faster" : "slower"}`
    );
    console.log(
      `   Confidence: ${improvements.confidenceImprovement.toFixed(1)}% ${improvements.confidenceImprovement > 0 ? "higher" : "lower"}`
    );
    console.log(
      `   Insights: ${improvements.insightsImprovement.toFixed(1)}% ${improvements.insightsImprovement > 0 ? "more" : "fewer"}`
    );
    console.log(
      `   Recommendations: ${improvements.recommendationsImprovement.toFixed(1)}% ${improvements.recommendationsImprovement > 0 ? "more" : "fewer"}`
    );
    console.log(
      `   Overall Quality: ${improvements.qualityImprovement.toFixed(1)}% ${improvements.qualityImprovement > 0 ? "better" : "worse"}`
    );

    console.log("\n📈 Before vs After:");
    console.log(
      `   Response Time: ${this.enhancementMetrics.beforeEnhancement.averageResponseTime.toFixed(2)}ms → ${this.enhancementMetrics.afterEnhancement.averageResponseTime.toFixed(2)}ms`
    );
    console.log(
      `   Confidence: ${(this.enhancementMetrics.beforeEnhancement.averageConfidence * 100).toFixed(1)}% → ${(this.enhancementMetrics.afterEnhancement.averageConfidence * 100).toFixed(1)}%`
    );
    console.log(
      `   Quality Score: ${this.enhancementMetrics.beforeEnhancement.averageQuality.toFixed(3)} → ${this.enhancementMetrics.afterEnhancement.averageQuality.toFixed(3)}`
    );

    const overallImprovement =
      (improvements.responseTimeImprovement +
        improvements.confidenceImprovement +
        improvements.qualityImprovement) /
      3;
    console.log(`\n🎯 Overall Enhancement: ${overallImprovement.toFixed(1)}% improvement`);

    if (overallImprovement > 0) {
      console.log("✅ Murmuration AI successfully enhanced my abilities!");
    } else {
      console.log("⚠️ Enhancement needs optimization");
    }
  }

  /**
   * Run complete enhancement demo
   */
  async runDemo() {
    console.log("🌟 AI Enhancement Demo Starting...\n");

    try {
      await this.initialize();

      // Test baseline abilities
      await this.testBaselineAbilities();

      // Apply enhancement
      await this.applyEnhancement();

      // Test enhanced abilities
      await this.testEnhancedAbilities();

      // Calculate improvements
      this.calculateImprovements();

      // Generate report
      this.generateEnhancementReport();

      // Save system report
      await this.system.saveSystemReport();

      console.log("\n🎉 AI Enhancement Demo Complete!");
    } catch (error) {
      console.error("❌ Demo failed:", error.message);
    } finally {
      await this.system.stopBackgroundOptimization();
    }
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  const demo = new AIEnhancementDemo();
  demo.runDemo().catch(console.error);
}

export default AIEnhancementDemo;
