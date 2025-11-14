#!/usr/bin/env node

/**
 * Murmuration AI: Cursor Integration Layer
 *
 * Provides intelligent caching, context persistence, intent detection,
 * and seamless integration with Cursor's development environment.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import MurmurationAISystem from "./murmuration-ai-system.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CursorIntegration {
  constructor() {
    this.system = null;
    this.cache = new Map();
    this.contextHistory = [];
    this.currentWorkingContext = {
      currentFile: null,
      recentFiles: [],
      activeDomains: [],
      workingPatterns: [],
    };
    this.workingMemory = {
      currentTask: null,
      activeFeature: null,
      relatedFiles: [],
      intentSignals: [],
    };
    this.successPatterns = new Map();
    this.fileRelationships = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
    };
    this.isInitialized = false;
  }

  /**
   * Initialize the integration system
   */
  async initialize() {
    if (this.isInitialized) return;

    console.log("🔗 Initializing Cursor Integration...");

    // Initialize murmuration system
    this.system = new MurmurationAISystem();
    await this.system.initialize();

    // Load success patterns from file system
    await this.loadSuccessPatterns();

    this.isInitialized = true;
    console.log("✅ Cursor Integration initialized");
  }

  /**
   * Generate semantic cache key for intelligent caching
   */
  generateCacheKey(context) {
    const filePath = context.filePath || "";
    const fileExt = path.extname(filePath);
    const primaryDomain = context.domains?.[0] || "general";

    // Group similar imports
    const importGroups = this.groupImports(context.imports || []);

    // Classify edit type
    const editType = this.classifyEditType(context.recentEdits || []);

    const key = {
      fileType: fileExt,
      primaryDomain: primaryDomain,
      importGroups: importGroups,
      editType: editType,
      workingContext: this.getWorkingContextSignature(),
    };

    return JSON.stringify(key);
  }

  /**
   * Group imports by framework/library
   */
  groupImports(imports) {
    const groups = {
      react: [],
      nestjs: [],
      typeorm: [],
      testing: [],
      other: [],
    };

    for (const imp of imports) {
      const importStr = imp.toLowerCase();
      if (importStr.includes("react") || importStr.includes("@types/react")) {
        groups.react.push(imp);
      } else if (importStr.includes("@nestjs") || importStr.includes("nestjs")) {
        groups.nestjs.push(imp);
      } else if (importStr.includes("typeorm") || importStr.includes("@typeorm")) {
        groups.typeorm.push(imp);
      } else if (
        importStr.includes("jest") ||
        importStr.includes("test") ||
        importStr.includes("spec")
      ) {
        groups.testing.push(imp);
      } else {
        groups.other.push(imp);
      }
    }

    return groups;
  }

  /**
   * Classify edit type based on recent edits
   */
  classifyEditType(recentEdits) {
    if (recentEdits.length === 0) return "unknown";

    const editContent = recentEdits.join(" ").toLowerCase();

    if (editContent.includes("component") || editContent.includes("jsx")) {
      return "component";
    } else if (editContent.includes("controller") || editContent.includes("route")) {
      return "api";
    } else if (editContent.includes("test") || editContent.includes("spec")) {
      return "test";
    } else if (editContent.includes("entity") || editContent.includes("model")) {
      return "entity";
    } else if (editContent.includes("service") || editContent.includes("business")) {
      return "service";
    } else {
      return "general";
    }
  }

  /**
   * Get working context signature for cache key
   */
  getWorkingContextSignature() {
    return {
      currentTask: this.workingMemory.currentTask,
      activeFeature: this.workingMemory.activeFeature,
      recentFileCount: this.currentWorkingContext.recentFiles.length,
      activeDomainCount: this.currentWorkingContext.activeDomains.length,
    };
  }

  /**
   * Detect intent from file paths and context
   */
  detectIntent(context) {
    const filePath = (context.filePath || "").toLowerCase();
    const intents = [];

    // Detect testing intent
    if (
      filePath.includes(".test.") ||
      filePath.includes(".spec.") ||
      filePath.includes("__tests__")
    ) {
      intents.push("testing");
    }

    // Detect API development
    if (
      filePath.includes("controller") ||
      filePath.includes("route") ||
      filePath.includes("/api/")
    ) {
      intents.push("api-development");
    }

    // Detect UI component work
    if (
      filePath.includes("component") ||
      filePath.includes("/ui/") ||
      filePath.includes("/pages/")
    ) {
      intents.push("ui-development");
    }

    // Detect authentication/security work
    if (
      filePath.includes("auth") ||
      filePath.includes("security") ||
      filePath.includes("permission")
    ) {
      intents.push("security");
    }

    // Detect data layer work
    if (
      filePath.includes("entity") ||
      filePath.includes("model") ||
      filePath.includes("repository")
    ) {
      intents.push("database");
    }

    // Detect service layer work
    if (filePath.includes("service") && !filePath.includes("test")) {
      intents.push("service-development");
    }

    return intents;
  }

  /**
   * Map intents to domains
   */
  mapIntentsToDomains(intents) {
    const intentToDomain = {
      testing: ["testing"],
      "api-development": ["backend"],
      "ui-development": ["frontend", "design"],
      security: ["security", "backend"],
      database: ["backend"],
      "service-development": ["backend"],
    };

    const domains = new Set();
    for (const intent of intents) {
      const mappedDomains = intentToDomain[intent] || [];
      mappedDomains.forEach(domain => domains.add(domain));
    }

    return Array.from(domains);
  }

  /**
   * Update working context with new information
   */
  updateWorkingContext(context) {
    // Update current file
    if (context.filePath) {
      this.currentWorkingContext.currentFile = context.filePath;

      // Add to recent files if not already there
      if (!this.currentWorkingContext.recentFiles.includes(context.filePath)) {
        this.currentWorkingContext.recentFiles.unshift(context.filePath);
        // Keep only last 10 files
        this.currentWorkingContext.recentFiles = this.currentWorkingContext.recentFiles.slice(
          0,
          10
        );
      }
    }

    // Update active domains
    if (context.domains) {
      for (const domain of context.domains) {
        if (!this.currentWorkingContext.activeDomains.includes(domain)) {
          this.currentWorkingContext.activeDomains.push(domain);
        }
      }
    }

    // Detect working patterns from file history
    this.currentWorkingContext.workingPatterns = this.detectWorkingPatterns(
      this.currentWorkingContext.recentFiles
    );

    // Add to context history
    this.contextHistory.push({
      ...context,
      timestamp: Date.now(),
    });

    // Keep only last 20 contexts
    if (this.contextHistory.length > 20) {
      this.contextHistory = this.contextHistory.slice(-20);
    }
  }

  /**
   * Detect working patterns from file sequences
   */
  detectWorkingPatterns(recentFiles) {
    const patterns = [];

    // Check for API development pattern
    const hasController = recentFiles.some(f => f.includes("controller"));
    const hasService = recentFiles.some(f => f.includes("service") && !f.includes("test"));
    const hasEntity = recentFiles.some(f => f.includes("entity"));

    if (hasController && hasService) {
      patterns.push("api-development");
    }
    if (hasEntity) {
      patterns.push("data-modeling");
    }

    // Check for testing pattern
    const hasTests = recentFiles.some(f => f.includes(".test.") || f.includes(".spec."));
    if (hasTests) {
      patterns.push("testing");
    }

    // Check for component development pattern
    const hasComponents = recentFiles.some(f => f.includes("component"));
    if (hasComponents) {
      patterns.push("component-development");
    }

    return patterns;
  }

  /**
   * Update working memory with current context
   */
  updateWorkingMemory(context) {
    const filePath = context.filePath || "";

    // Detect current task from file patterns
    if (filePath.includes("auth")) {
      this.workingMemory.currentTask = "authentication";
      this.workingMemory.intentSignals = ["security", "backend", "api"];
    } else if (filePath.includes("user")) {
      this.workingMemory.currentTask = "user-management";
      this.workingMemory.intentSignals = ["backend", "database", "api"];
    } else if (filePath.includes("payment")) {
      this.workingMemory.currentTask = "payment-processing";
      this.workingMemory.intentSignals = ["backend", "security", "api"];
    } else if (filePath.includes("component")) {
      this.workingMemory.currentTask = "ui-development";
      this.workingMemory.intentSignals = ["frontend", "design", "ui"];
    }

    // Extract active feature from file path
    const pathParts = filePath.split("/");
    const featurePart = pathParts.find(
      part =>
        part.includes("auth") ||
        part.includes("user") ||
        part.includes("payment") ||
        part.includes("order") ||
        part.includes("product")
    );
    if (featurePart) {
      this.workingMemory.activeFeature = featurePart.replace(/\.(ts|tsx|js|jsx)$/, "");
    }

    // Track related files
    this.workingMemory.relatedFiles.push({
      path: filePath,
      timestamp: Date.now(),
    });

    // Prune old entries (keep 5 min window)
    const fiveMinutesAgo = Date.now() - 300000;
    this.workingMemory.relatedFiles = this.workingMemory.relatedFiles.filter(
      f => f.timestamp > fiveMinutesAgo
    );
  }

  /**
   * Record successful rule activations for learning
   */
  recordSuccess(context, recommendations, userAccepted = true) {
    if (!userAccepted) return;

    const pattern = {
      domains: context.domains || [],
      rules: recommendations.map(r => r.rule),
      timestamp: Date.now(),
      confidence:
        recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length,
    };

    const key = JSON.stringify(pattern.domains.sort());
    const existing = this.successPatterns.get(key) || [];
    existing.push(pattern);
    this.successPatterns.set(key, existing);

    // Persist to file system
    this.saveSuccessPatterns();
  }

  /**
   * Load success patterns from file system
   */
  async loadSuccessPatterns() {
    try {
      const patternsPath = path.join(__dirname, "success-patterns.json");
      if (fs.existsSync(patternsPath)) {
        const data = fs.readFileSync(patternsPath, "utf8");
        const patterns = JSON.parse(data);
        this.successPatterns = new Map(Object.entries(patterns));
        console.log(`📚 Loaded ${this.successPatterns.size} success patterns`);
      }
    } catch (error) {
      console.log("📚 No existing success patterns found, starting fresh");
    }
  }

  /**
   * Save success patterns to file system
   */
  async saveSuccessPatterns() {
    try {
      const patternsPath = path.join(__dirname, "success-patterns.json");
      const patternsObj = Object.fromEntries(this.successPatterns);
      fs.writeFileSync(patternsPath, JSON.stringify(patternsObj, null, 2));
    } catch (error) {
      console.error("Failed to save success patterns:", error.message);
    }
  }

  /**
   * Build file relationships for multi-file context
   */
  buildFileRelationships(context) {
    const currentFile = context.filePath;
    if (!currentFile) return;

    const relationships = [];

    // Parse imports to find related files
    if (context.imports) {
      for (const imp of context.imports) {
        const relatedFile = this.resolveImportPath(imp, currentFile);
        if (relatedFile) {
          relationships.push({ file: relatedFile, type: "imports" });
        }
      }
    }

    // Detect test files
    const testFile = this.findTestFile(currentFile);
    if (testFile) {
      relationships.push({ file: testFile, type: "test" });
    }

    // Detect controller/service pairs
    if (currentFile.includes("service.ts")) {
      const controllerFile = currentFile.replace("service.ts", "controller.ts");
      relationships.push({ file: controllerFile, type: "controller" });
    } else if (currentFile.includes("controller.ts")) {
      const serviceFile = currentFile.replace("controller.ts", "service.ts");
      relationships.push({ file: serviceFile, type: "service" });
    }

    // Detect entity/repository pairs
    if (currentFile.includes("entity.ts")) {
      const repositoryFile = currentFile.replace("entity.ts", "repository.ts");
      relationships.push({ file: repositoryFile, type: "repository" });
    }

    this.fileRelationships.set(currentFile, relationships);
  }

  /**
   * Resolve import path to actual file path
   */
  resolveImportPath(importStatement, currentFile) {
    // Simple implementation - in real scenario would need more sophisticated path resolution
    const currentDir = path.dirname(currentFile);

    // Handle relative imports
    if (importStatement.startsWith("./") || importStatement.startsWith("../")) {
      return path.resolve(currentDir, importStatement);
    }

    // Handle absolute imports (would need project structure analysis)
    return null;
  }

  /**
   * Find test file for a given source file
   */
  findTestFile(sourceFile) {
    const ext = path.extname(sourceFile);
    const baseName = path.basename(sourceFile, ext);
    const dir = path.dirname(sourceFile);

    // Common test file patterns
    const testPatterns = [
      `${baseName}.test${ext}`,
      `${baseName}.spec${ext}`,
      `${baseName}.test.ts`,
      `${baseName}.spec.ts`,
    ];

    for (const pattern of testPatterns) {
      const testFile = path.join(dir, pattern);
      if (fs.existsSync(testFile)) {
        return testFile;
      }
    }

    return null;
  }

  /**
   * Convert context to request format for murmuration system
   */
  contextToRequest(context) {
    // Detect intents
    const intents = this.detectIntent(context);
    const intentDomains = this.mapIntentsToDomains(intents);

    // Merge with existing domains
    const allDomains = [...new Set([...(context.domains || []), ...intentDomains])];

    // Extract keywords from file path and context
    const keywords = [];
    if (context.filePath) {
      const pathParts = context.filePath.split("/");
      keywords.push(...pathParts.filter(part => part.length > 2));
    }
    keywords.push(...intents);

    // Determine request type
    let requestType = "general";
    if (intents.includes("api-development")) {
      requestType = "backend-development";
    } else if (intents.includes("ui-development")) {
      requestType = "frontend-development";
    } else if (intents.includes("testing")) {
      requestType = "testing";
    }

    return {
      type: requestType,
      keywords: keywords,
      context: {
        domains: allDomains,
        activationType: "contextual",
        complexity: "medium",
        ...context,
      },
    };
  }

  /**
   * Get coordinated recommendations with all optimizations
   */
  async getCoordinatedRecommendations(context) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Update context tracking
    this.updateWorkingContext(context);
    this.updateWorkingMemory(context);
    this.buildFileRelationships(context);

    // Check cache first
    const cacheKey = this.generateCacheKey(context);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 300000) {
      // 5 min cache
      this.cacheStats.hits++;
      this.cacheStats.totalRequests++;
      console.log("🎯 Cache hit - instant response");
      return cached.result;
    }

    this.cacheStats.misses++;
    this.cacheStats.totalRequests++;

    // Convert context to request
    const request = this.contextToRequest(context);

    // Process with murmuration system (now optimized for sub-5ms responses)
    const result = await this.system.processRequest(request, request.context);

    // Boost confidence for proven patterns
    const domainKey = JSON.stringify(request.context.domains.sort());
    const successfulPatterns = this.successPatterns.get(domainKey) || [];

    result.response.recommendations.forEach(rec => {
      const timesSuccessful = successfulPatterns.filter(p => p.rules.includes(rec.rule)).length;

      // Boost confidence by 5% for each successful use (max 25% boost)
      rec.confidence = Math.min(1.0, rec.confidence + timesSuccessful * 0.05);
    });

    // Add multi-file insights
    const relatedFiles = this.fileRelationships.get(context.filePath) || [];
    if (relatedFiles.length > 0) {
      result.response.insights.push({
        type: "multi-file-insight",
        title: "Multi-File Impact Detected",
        description: `This change may affect: ${relatedFiles.map(f => f.file).join(", ")}`,
        relatedFiles: relatedFiles,
        confidence: 0.85,
      });
    }

    // Cache the result
    this.cache.set(cacheKey, {
      result: result,
      timestamp: Date.now(),
      hitCount: 1,
    });

    // Clean cache if it gets too large
    if (this.cache.size > 50) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    return result;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const hitRate =
      this.cacheStats.totalRequests > 0
        ? ((this.cacheStats.hits / this.cacheStats.totalRequests) * 100).toFixed(1)
        : 0;

    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      cacheSize: this.cache.size,
      successPatterns: this.successPatterns.size,
    };
  }

  /**
   * Get working context summary
   */
  getWorkingContextSummary() {
    return {
      currentFile: this.currentWorkingContext.currentFile,
      recentFiles: this.currentWorkingContext.recentFiles.slice(0, 5),
      activeDomains: this.currentWorkingContext.activeDomains,
      workingPatterns: this.currentWorkingContext.workingPatterns,
      currentTask: this.workingMemory.currentTask,
      activeFeature: this.workingMemory.activeFeature,
      relatedFiles: this.workingMemory.relatedFiles.length,
    };
  }
}

// Export for use
export default CursorIntegration;

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const integration = new CursorIntegration();

  async function demo() {
    console.log("🔗 Cursor Integration Demo\n");

    await integration.initialize();

    // Simulate some contexts
    const contexts = [
      {
        filePath: "/src/auth/auth.service.ts",
        domains: ["backend"],
        imports: ["@nestjs/common", "typeorm", "class-validator"],
      },
      {
        filePath: "/src/components/UserProfile.tsx",
        domains: ["frontend"],
        imports: ["react", "@types/react", "styled-components"],
      },
      {
        filePath: "/src/auth/auth.service.spec.ts",
        domains: ["testing"],
        imports: ["@nestjs/testing", "jest"],
      },
    ];

    for (const context of contexts) {
      console.log(`\n📁 Processing: ${context.filePath}`);

      const result = await integration.getCoordinatedRecommendations(context);

      console.log(`   ⚡ Response time: ${result.processingTime.toFixed(2)}ms`);
      console.log(`   🎯 Confidence: ${(result.response.confidence * 100).toFixed(1)}%`);
      console.log(`   💡 Insights: ${result.response.insights.length}`);
      console.log(`   📋 Recommendations: ${result.response.recommendations.length}`);

      // Show top recommendation
      if (result.response.recommendations.length > 0) {
        const topRec = result.response.recommendations[0];
        console.log(`   🏆 Top: ${topRec.rule} (${(topRec.confidence * 100).toFixed(1)}%)`);
      }
    }

    // Show cache stats
    const stats = integration.getCacheStats();
    console.log(`\n📊 Cache Stats: ${stats.hitRate} hit rate, ${stats.cacheSize} entries`);

    // Show working context
    const contextSummary = integration.getWorkingContextSummary();
    console.log(
      `\n🧠 Working Context: ${contextSummary.currentTask || "none"} task, ${contextSummary.workingPatterns.length} patterns`
    );
  }

  demo().catch(console.error);
}
