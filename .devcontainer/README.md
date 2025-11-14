# Dev Container Configuration

This dev container is optimized for both AI assistance and human development on the Kubota Rental Platform.

## Extensions Installed

### Extensions That Improve AI Capabilities ✅

These extensions provide diagnostics and linting information that the AI can read via the `read_lints` tool:

#### **Critical - Core Diagnostics**
- **`dbaeumer.vscode-eslint`** - ESLint
  - AI reads: JavaScript/TypeScript errors, code quality issues
  - Impact: High - catches syntax errors, unused variables, best practice violations

- **`ms-vscode.vscode-typescript-next`** - TypeScript
  - AI reads: Type errors, interface mismatches, type safety issues
  - Impact: High - ensures type safety across the codebase

#### **Security & Code Quality**
- **`snyk-security.snyk-vulnerability-scanner`** - Snyk Security
  - AI reads: Security vulnerabilities in dependencies
  - Impact: High - identifies critical security issues before deployment

- **`SonarSource.sonarlint-vscode`** - SonarLint
  - AI reads: Code smells, bugs, security hotspots
  - Impact: Medium - improves code quality and maintainability

#### **Framework-Specific**
- **`bradlc.vscode-tailwindcss`** - Tailwind CSS IntelliSense
  - AI reads: Invalid Tailwind class names
  - Impact: Medium - prevents CSS bugs from invalid classes

- **`stylelint.vscode-stylelint`** - Stylelint
  - AI reads: CSS/SCSS linting errors
  - Impact: Medium - ensures CSS quality and consistency

- **`davidanson.vscode-markdownlint`** - Markdown Lint
  - AI reads: Markdown formatting issues
  - Impact: Low - keeps documentation consistent

#### **Testing**
- **`Orta.vscode-jest`** - Jest
  - AI reads: Test failures, coverage gaps
  - Impact: High - helps identify failing tests quickly

- **`ms-playwright.playwright`** - Playwright
  - AI reads: E2E test failures
  - Impact: Medium - catches integration issues

#### **Database**
- **`mtxr.sqltools`** - SQLTools
- **`mtxr.sqltools-driver-pg`** - PostgreSQL Driver
  - AI reads: SQL syntax errors, query validation
  - Impact: Medium - prevents database query errors

#### **Infrastructure**
- **`ms-azuretools.vscode-docker`** - Docker
  - AI reads: Dockerfile errors, docker-compose issues
  - Impact: Low - helps with container configuration

## How AI Uses These Extensions

The AI assistant can call the `read_lints` tool to access diagnostics from these extensions, which helps:

1. **Catch errors before running code** - Type errors, linting issues, syntax errors
2. **Identify security vulnerabilities** - Via Snyk and SonarLint
3. **Validate framework usage** - Tailwind classes, React patterns
4. **Monitor test health** - Jest and Playwright test failures
5. **Ensure code quality** - ESLint rules, TypeScript strict mode

## What's NOT Included (and Why)

These extensions are common but **don't help the AI**:

❌ **Visual UI Extensions** (Error Lens, Indent Rainbow, Color Highlight)
  - Reason: AI can't see the visual interface

❌ **Snippet Extensions** (React snippets, etc.)
  - Reason: AI writes complete code, not snippets

❌ **Git Graph, GitLens UI features**
  - Reason: AI uses terminal git commands

❌ **Thunder Client, REST Client**
  - Reason: AI uses terminal curl/httpie

❌ **Markdown Preview**
  - Reason: AI doesn't see visual previews

**You can install these personally** if you want them - they won't interfere with AI assistance.

## Usage

### Starting the Dev Container

```bash
# Open in VS Code
code .

# VS Code will prompt to reopen in container
# Or press F1 and select "Dev Containers: Reopen in Container"
```

### Verifying Extensions

After the container starts, check that all extensions are loaded:

```bash
# In VS Code, press F1 and type "Extensions: Show Installed Extensions"
```

### Reading Diagnostics (AI)

The AI can read all diagnostics with:

```bash
# Read all lints in workspace
read_lints()

# Read lints for specific file
read_lints(["src/components/MyComponent.tsx"])

# Read lints for directory
read_lints(["src/components/"])
```

## Troubleshooting

### Extensions Not Installing

```bash
# Rebuild container without cache
F1 -> Dev Containers: Rebuild Container Without Cache
```

### ESLint Not Working

```bash
# In container terminal
npm install
cd frontend && npm install
cd ../backend && npm install
```

### TypeScript Errors Not Showing

```bash
# Restart TypeScript server
F1 -> TypeScript: Restart TS Server
```

## Configuration Files

- `.devcontainer/devcontainer.json` - Main configuration
- `.eslintrc.js` - ESLint rules (frontend & backend)
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration

## Updating Extensions

To add new extensions that help AI:

1. Extension must provide **diagnostics** via LSP
2. Add to `devcontainer.json` under `extensions`
3. Update this README with what diagnostics AI can read
4. Rebuild container

## Performance Notes

These extensions are chosen for **minimal performance impact** while maximizing AI assistance quality. All extensions provide diagnostics that AI can read via the Language Server Protocol (LSP).

