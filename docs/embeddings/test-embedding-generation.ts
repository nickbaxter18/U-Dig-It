/**
 * Test Script for Embedding Generation
 *
 * This script tests the text builder and specification parser functions
 * to ensure they generate high-quality searchable text for embeddings.
 *
 * Run with: npx tsx docs/embeddings/test-embedding-generation.ts
 */

import { buildEquipmentText } from '../../frontend/src/lib/embeddings/build-equipment-text';
import { parseSpecifications } from '../../frontend/src/lib/embeddings/parse-specifications';

// Test data
const sampleEquipment = {
  id: 'test-123',
  make: 'Kubota',
  model: 'SVL75-2',
  year: 2023,
  type: 'Compact Track Loader',
  unitId: 'CTL-001',
  description: 'Powerful compact track loader ideal for construction and landscaping projects. Features excellent stability and traction.',
  notes: 'Ideal for residential construction projects. Excellent for tight spaces.',
  specifications: {
    operatingWeight: 7500,
    transportDimensions: {
      length: 144,
      width: 72,
      height: 96,
    },
    fuelType: 'Diesel',
    engineHorsepower: 74.3,
    attachments: ['Bucket', 'Forks', 'Grapple'],
  },
  category_id: 'cat-123',
  subcategory: 'Track Loaders',
  location: {
    city: 'Saint John',
    province: 'New Brunswick',
  },
  homeLocationId: 'loc-001',
};

const sampleCategory = {
  name: 'Compact Track Loaders',
  description: 'Versatile construction equipment for various applications',
  typical_applications: [
    'Residential construction',
    'Landscaping',
    'Material handling',
    'Snow removal',
  ],
  search_keywords: ['CTL', 'track loader', 'compact loader', 'skid steer alternative'],
};

// Test specification parser
console.log('=== Testing Specification Parser ===\n');
const specsText = parseSpecifications(sampleEquipment.specifications);
console.log('Parsed Specifications:');
console.log(specsText);
console.log('\n');

// Test text builder
console.log('=== Testing Text Builder ===\n');
const fullText = buildEquipmentText(sampleEquipment, sampleCategory);
console.log('Generated Text:');
console.log(fullText);
console.log('\n');

// Verify text quality
console.log('=== Quality Checks ===\n');
console.log(`Text Length: ${fullText.length} characters`);
console.log(`Contains Make/Model: ${fullText.includes('Kubota') && fullText.includes('SVL75-2')}`);
console.log(`Contains Description: ${fullText.includes('construction')}`);
console.log(`Contains Specifications: ${fullText.includes('7,500 pound')}`);
console.log(`Contains Use Cases: ${fullText.includes('Residential construction')}`);
console.log(`Contains Synonyms: ${fullText.includes('CTL')}`);
console.log(`Contains Location: ${fullText.includes('Saint John')}`);
console.log('\n');

// Test with minimal data
console.log('=== Testing with Minimal Data ===\n');
const minimalEquipment = {
  id: 'test-456',
  make: 'Kubota',
  model: 'BX23S',
  year: 2022,
  type: 'Compact Tractor',
  unitId: 'TR-001',
  description: 'Compact tractor',
  notes: null,
  specifications: null,
  category_id: null,
  subcategory: null,
  location: null,
  homeLocationId: null,
};

const minimalText = buildEquipmentText(minimalEquipment);
console.log('Minimal Text:');
console.log(minimalText);
console.log(`Length: ${minimalText.length} characters`);
console.log(`Meets minimum (50 chars): ${minimalText.length >= 50}`);
console.log('\n');

// Test edge cases
console.log('=== Testing Edge Cases ===\n');

// Empty specifications
const emptySpecs = parseSpecifications(null);
console.log(`Null specifications: "${emptySpecs}" (should be empty)`);

// Invalid specifications
const invalidSpecs = parseSpecifications('not an object');
console.log(`Invalid specifications: "${parseSpecifications(invalidSpecs)}" (should be empty)`);

// Missing description
const noDescription = {
  ...sampleEquipment,
  description: '',
};
const noDescText = buildEquipmentText(noDescription, sampleCategory);
console.log(`\nNo description text length: ${noDescText.length} (should use fallback)`);
console.log(`Uses fallback: ${noDescText.includes('Kubota') && noDescText.includes('Compact Track Loader')}`);

console.log('\n=== All Tests Complete ===');


