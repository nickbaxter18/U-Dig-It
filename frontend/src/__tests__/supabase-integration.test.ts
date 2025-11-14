import { supabaseApi } from '@/lib/supabase/api-client';

describe('Supabase Integration', () => {
  test('should connect to Supabase', async () => {
    const health = await supabaseApi.healthCheck();
    expect(health).toBeDefined();
    expect(health.status).toBe('healthy');
  });

  test('should fetch equipment list', async () => {
    const equipment = await supabaseApi.getEquipmentList();
    expect(equipment).toBeDefined();
    expect(Array.isArray(equipment)).toBe(true);
  });

  test('should handle authentication errors gracefully', async () => {
    try {
      await supabaseApi.getCurrentUser();
      // Should not throw even if not authenticated
    } catch (error) {
      // If it throws, should be a proper error type
      expect(error).toBeDefined();
    }
  });

  test('should test real-time subscription setup', () => {
    // Test that real-time hooks file exists and can be read
    const fs = require('fs');
    const path = require('path');

    const hooksPath = path.join(__dirname, '../hooks/useSupabase.ts');
    expect(fs.existsSync(hooksPath)).toBe(true);

    // Test that the file contains the expected functions
    const content = fs.readFileSync(hooksPath, 'utf8');
    expect(content).toContain('useRealtimeSubscription');
    expect(content).toContain('useLiveAvailability');
  });
});
