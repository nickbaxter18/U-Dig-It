# Performance Optimization Plan Template

## Overview
**Target:** {component|page|feature}
**Current Performance:** {metrics}
**Target Performance:** {metrics}
**Priority:** {High|Medium|Low}

---

## Phase 1: Analysis

### Tasks
- [ ] Measure current performance (Core Web Vitals)
- [ ] Profile application (Chrome DevTools)
- [ ] Identify bottlenecks
- [ ] Analyze bundle size
- [ ] Review database queries
- [ ] Review API response times
- [ ] Review image optimization

### Findings
- LCP: {current} → Target: < 2.5s
- FID: {current} → Target: < 100ms
- CLS: {current} → Target: < 0.1
- Bundle size: {current} → Target: < 250KB

---

## Phase 2: Frontend Optimization

### Tasks
- [ ] Implement code splitting
- [ ] Optimize images (WebP, lazy loading)
- [ ] Optimize fonts (next/font, subsetting)
- [ ] Reduce bundle size (tree shaking)
- [ ] Implement lazy loading
- [ ] Optimize re-renders (memoization)
- [ ] Optimize CSS (remove unused)

### Expected Impact
- Bundle size reduction: {target}%
- Load time improvement: {target}%
- LCP improvement: {target}%

---

## Phase 3: Backend Optimization

### Tasks
- [ ] Optimize database queries
- [ ] Add missing indexes
- [ ] Implement query result caching
- [ ] Optimize API responses
- [ ] Implement response compression
- [ ] Add connection pooling
- [ ] Optimize N+1 queries

### Expected Impact
- API response time: {current}ms → {target}ms
- Database query time: {current}ms → {target}ms

---

## Phase 4: Caching Strategy

### Tasks
- [ ] Implement browser caching
- [ ] Implement CDN caching
- [ ] Implement application caching
- [ ] Implement database query caching
- [ ] Configure cache headers
- [ ] Implement cache invalidation

### Expected Impact
- Cache hit rate: {target}%
- Reduced server load: {target}%

---

## Phase 5: Monitoring

### Tasks
- [ ] Set up performance monitoring
- [ ] Configure alerts
- [ ] Track Core Web Vitals
- [ ] Monitor API response times
- [ ] Track bundle sizes
- [ ] Set performance budgets

### Acceptance Criteria
- [ ] Monitoring configured
- [ ] Alerts working
- [ ] Performance budgets enforced

---

## Phase 6: Validation

### Tasks
- [ ] Measure optimized performance
- [ ] Compare before/after metrics
- [ ] Validate improvements
- [ ] Test on various devices
- [ ] Test on various networks

### Results
- LCP: {before} → {after} ({improvement}%)
- FID: {before} → {after} ({improvement}%)
- CLS: {before} → {after} ({improvement}%)
- Bundle size: {before} → {after} ({improvement}%)

---

## Notes
- Maintain accessibility while optimizing
- Don't sacrifice code quality
- Test thoroughly after optimizations

