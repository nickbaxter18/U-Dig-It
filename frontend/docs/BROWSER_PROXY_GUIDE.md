# Browser Proxy Configuration Guide

This guide explains how to configure and use browser proxy settings for browser automation (Playwright, Chrome DevTools, etc.).

## Quick Start

### 1. Check Current Setup
```bash
cd frontend
bash scripts/test-proxy-connection.sh
```

### 2. Configure Proxy (if needed)

If you need to use a proxy server, set these environment variables:

```bash
# HTTP/HTTPS proxy
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080

# Domains to bypass proxy (comma-separated)
export NO_PROXY=localhost,127.0.0.1,*.local

# Or use lowercase (some tools prefer this)
export http_proxy=http://proxy.example.com:8080
export https_proxy=http://proxy.example.com:8080
export no_proxy=localhost,127.0.0.1
```

### 3. Start Chrome with Proxy

```bash
# Start Chrome with proxy (uses HTTP_PROXY env var if set)
bash scripts/start-chrome-with-proxy.sh

# Or specify proxy directly
bash scripts/start-chrome-with-proxy.sh http://proxy.example.com:8080

# Or use a different port
bash scripts/start-chrome-with-proxy.sh http://proxy.example.com:8080 9223
```

### 4. Run Playwright Tests with Proxy

Playwright will automatically use proxy settings from environment variables:

```bash
# Set proxy first
export HTTP_PROXY=http://proxy.example.com:8080
export NO_PROXY=localhost,127.0.0.1

# Run tests (proxy will be used automatically)
pnpm playwright test
```

## Configuration Files

### Playwright Configuration

The `playwright.config.ts` file has been updated to automatically detect and use proxy settings from environment variables:

```typescript
// Automatically uses HTTP_PROXY or HTTPS_PROXY if set
use: {
  ...(process.env.HTTP_PROXY || process.env.HTTPS_PROXY
    ? {
        proxy: {
          server: process.env.HTTP_PROXY || process.env.HTTPS_PROXY || '',
          ...(process.env.NO_PROXY
            ? {
                bypass: process.env.NO_PROXY.split(',').map((domain) => domain.trim()),
              }
            : {}),
        },
      }
    : {}),
}
```

### Chrome DevTools Script

The `scripts/start-chrome-with-proxy.sh` script starts Chrome with:
- Remote debugging enabled (port 9222 by default)
- Proxy server configuration (if provided)
- Headless mode for automation
- Security flags for containerized environments

## Troubleshooting

### Chrome DevTools Not Accessible

If Chrome DevTools is not accessible:

1. **Check if Chrome is running:**
   ```bash
   ps aux | grep chrome
   ```

2. **Check if port 9222 is in use:**
   ```bash
   lsof -i :9222
   # or
   netstat -tuln | grep 9222
   ```

3. **Kill existing Chrome processes:**
   ```bash
   pkill -f "chrome.*remote-debugging"
   ```

4. **Start Chrome manually:**
   ```bash
   bash scripts/start-chrome-with-proxy.sh
   ```

### Proxy Connection Issues

1. **Test proxy connectivity:**
   ```bash
   # Test if proxy is reachable
   curl -x http://proxy.example.com:8080 http://www.google.com
   ```

2. **Check proxy authentication:**
   If your proxy requires authentication, include it in the URL:
   ```bash
   export HTTP_PROXY=http://username:password@proxy.example.com:8080
   ```

3. **Verify NO_PROXY settings:**
   Make sure localhost and local domains are in NO_PROXY:
   ```bash
   export NO_PROXY=localhost,127.0.0.1,*.local,0.0.0.0
   ```

### Playwright Proxy Issues

1. **Verify environment variables are set:**
   ```bash
   echo $HTTP_PROXY
   echo $NO_PROXY
   ```

2. **Check Playwright config:**
   The proxy configuration should be detected automatically. Check `playwright.config.ts` to verify.

3. **Test with verbose logging:**
   ```bash
   DEBUG=pw:api pnpm playwright test --headed
   ```

## Common Use Cases

### Local Development (No Proxy)

```bash
# No proxy needed, just run tests
pnpm playwright test
```

### Corporate Network (With Proxy)

```bash
# Set proxy
export HTTP_PROXY=http://corporate-proxy.company.com:8080
export HTTPS_PROXY=http://corporate-proxy.company.com:8080
export NO_PROXY=localhost,127.0.0.1,*.local,*.company.com

# Run tests
pnpm playwright test
```

### CI/CD Environment

In your CI/CD configuration (GitHub Actions, GitLab CI, etc.):

```yaml
env:
  HTTP_PROXY: ${{ secrets.HTTP_PROXY }}
  HTTPS_PROXY: ${{ secrets.HTTPS_PROXY }}
  NO_PROXY: localhost,127.0.0.1
```

## Scripts Reference

### `scripts/test-proxy-connection.sh`

Runs comprehensive diagnostics:
- Environment variable check
- Chrome installation verification
- Port availability check
- Chrome DevTools connectivity test
- Network connectivity test
- Playwright configuration check

**Usage:**
```bash
bash scripts/test-proxy-connection.sh
```

### `scripts/start-chrome-with-proxy.sh`

Starts Chrome with DevTools and optional proxy configuration.

**Usage:**
```bash
# Use HTTP_PROXY env var
bash scripts/start-chrome-with-proxy.sh

# Specify proxy directly
bash scripts/start-chrome-with-proxy.sh http://proxy.example.com:8080

# Specify proxy and port
bash scripts/start-chrome-with-proxy.sh http://proxy.example.com:8080 9223
```

**Output:**
- Chrome PID for process management
- DevTools URL for connection
- Connection test results

## Integration with MCP Chrome DevTools

If you're using Chrome DevTools MCP, the proxy configuration will be handled automatically when Chrome is started with the proxy script.

The MCP server connects to Chrome via the DevTools protocol on port 9222 (or the specified port).

## Security Notes

1. **Never commit proxy credentials** to version control
2. **Use environment variables** or secrets management for proxy credentials
3. **Use NO_PROXY** to bypass proxy for local/internal resources
4. **Test proxy connectivity** before running automated tests

## Additional Resources

- [Playwright Proxy Documentation](https://playwright.dev/docs/network#http-proxy)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Chrome Command Line Switches](https://peter.sh/experiments/chromium-command-line-switches/)
