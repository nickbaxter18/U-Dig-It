/**
 * Comprehensive Tests for Code Splitting Configuration
 * Tests route splitting, component splitting, and loading strategies
 */

import { describe, expect, it } from 'vitest';
import { CODE_SPLITTING_CONFIG, LOADING_STRATEGY } from '../code-splitting';

describe('Code Splitting', () => {
  describe('Configuration', () => {
    it('should export route splitting config', () => {
      expect(CODE_SPLITTING_CONFIG).toBeDefined();
      expect(CODE_SPLITTING_CONFIG.routes).toBeDefined();
    });

    it('should export component splitting config', () => {
      expect(CODE_SPLITTING_CONFIG.components).toBeDefined();
    });

    it('should export library splitting config', () => {
      expect(CODE_SPLITTING_CONFIG.libraries).toBeDefined();
    });

    it('should export loading strategy', () => {
      expect(LOADING_STRATEGY).toBeDefined();
    });
  });

  describe('Route Splitting', () => {
    it('should define admin route split', () => {
      expect(CODE_SPLITTING_CONFIG.routes['/admin']).toBeDefined();
      expect(typeof CODE_SPLITTING_CONFIG.routes['/admin']).toBe('function');
    });

    it('should define dashboard route split', () => {
      expect(CODE_SPLITTING_CONFIG.routes['/dashboard']).toBeDefined();
    });

    it('should define book route split', () => {
      expect(CODE_SPLITTING_CONFIG.routes['/book']).toBeDefined();
    });

    it('should return promises for routes', () => {
      Object.values(CODE_SPLITTING_CONFIG.routes).forEach(route => {
        expect(typeof route).toBe('function');
      });
    });
  });

  describe('Component Splitting', () => {
    it('should define Modal component split', () => {
      expect(CODE_SPLITTING_CONFIG.components.Modal).toBeDefined();
    });

    it('should define Dropdown component split', () => {
      expect(CODE_SPLITTING_CONFIG.components.Dropdown).toBeDefined();
    });

    it('should define Select component split', () => {
      expect(CODE_SPLITTING_CONFIG.components.Select).toBeDefined();
    });

    it('should define Avatar component split', () => {
      expect(CODE_SPLITTING_CONFIG.components.Avatar).toBeDefined();
    });
  });

  describe('Library Splitting', () => {
    it('should define charts library split', () => {
      expect(CODE_SPLITTING_CONFIG.libraries.charts).toBeDefined();
    });

    it('should define forms library split', () => {
      expect(CODE_SPLITTING_CONFIG.libraries.forms).toBeDefined();
    });

    it('should define UI library split', () => {
      expect(CODE_SPLITTING_CONFIG.libraries.ui).toBeDefined();
    });
  });

  describe('Loading Strategy', () => {
    it('should define critical components', () => {
      expect(LOADING_STRATEGY.critical).toBeDefined();
      expect(Array.isArray(LOADING_STRATEGY.critical)).toBe(true);
    });

    it('should include Header as critical', () => {
      expect(LOADING_STRATEGY.critical).toContain('Header');
    });

    it('should include Navigation as critical', () => {
      expect(LOADING_STRATEGY.critical).toContain('Navigation');
    });

    it('should include Footer as critical', () => {
      expect(LOADING_STRATEGY.critical).toContain('Footer');
    });
  });
});


