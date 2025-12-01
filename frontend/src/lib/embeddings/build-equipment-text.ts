/**
 * Enhanced Equipment Text Builder
 *
 * Constructs optimized searchable text from all relevant equipment fields
 * for embedding generation. Includes semantic context, use cases, synonyms,
 * and natural language descriptions.
 */

import { parseSpecifications } from './parse-specifications';

interface EquipmentData {
  id: string;
  make: string;
  model: string;
  year: number;
  type: string;
  unitId: string;
  description: string;
  notes?: string | null;
  specifications?: unknown;
  category_id?: string | null;
  subcategory?: string | null;
  location?: unknown;
  homeLocationId?: string | null;
  synonyms?: string[]; // Optional: pre-fetched synonyms for this equipment type
}

interface CategoryData {
  name?: string;
  description?: string;
  typical_applications?: string[] | null;
  search_keywords?: string[] | null;
}

interface TypeDescriptionData {
  full_name?: string;
  description?: string;
  typical_uses?: string[] | null;
  key_features?: string[] | null;
}

/**
 * Build enhanced searchable text from equipment data
 *
 * @param equipment - Equipment record
 * @param category - Optional category data (from equipment_categories table)
 * @param typeDescription - Optional type description data (from equipment_type_descriptions table)
 * @returns Optimized text for embedding generation
 */
export function buildEquipmentText(
  equipment: EquipmentData,
  category?: CategoryData | null,
  typeDescription?: TypeDescriptionData | null
): string {
  const parts: string[] = [];

  // Equipment Name - Make Model (Year)
  const equipmentName = `${equipment.make} ${equipment.model}${equipment.year ? ` (${equipment.year})` : ''}`;
  parts.push(equipmentName);

  // ADD SYNONYMS EARLY - right after name for maximum prominence
  // This ensures synonyms are in the most important part of the embedding
  const synonyms = equipment.synonyms || getEquipmentSynonyms(equipment.type);
  if (synonyms.length > 0) {
    // Add top synonyms immediately after name
    parts.push(`This equipment is also called: ${synonyms.slice(0, 5).join(', ')}`);
  }

  // Unit ID for identification
  if (equipment.unitId) {
    parts.push(`Unit ID: ${equipment.unitId}`);
  }

  // Primary Description
  if (equipment.description && equipment.description.trim().length > 0) {
    parts.push(equipment.description);
  } else {
    // Fallback if no description
    parts.push(`${equipment.make} ${equipment.model} ${equipment.type}`);
  }

  // Type information with description
  if (equipment.type) {
    if (typeDescription?.full_name && typeDescription.full_name !== equipment.type) {
      parts.push(`Type: ${typeDescription.full_name} (${equipment.type})`);
    } else {
      parts.push(`Type: ${equipment.type}`);
    }

    // Add type description if available
    if (typeDescription?.description) {
      parts.push(`Equipment Description: ${typeDescription.description}`);
    }

    // Add typical uses from type description
    if (typeDescription?.typical_uses && typeDescription.typical_uses.length > 0) {
      parts.push(`Common Uses: ${typeDescription.typical_uses.join(', ')}`);
    }

    // Add key features from type description
    if (typeDescription?.key_features && typeDescription.key_features.length > 0) {
      parts.push(`Key Features: ${typeDescription.key_features.join(', ')}`);
    }

    // Add cross-reference information (e.g., "similar to skid steer but with tracks")
    if (equipment.type.toLowerCase().includes('track') && equipment.type.toLowerCase().includes('loader')) {
      parts.push('Similar to skid steer loader but uses tracks instead of wheels for better traction and flotation');
    }
  }

  // Specifications Summary
  if (equipment.specifications) {
    const specsText = parseSpecifications(equipment.specifications);
    if (specsText.trim().length > 0) {
      parts.push(`Specifications: ${specsText}`);
    }
  }

  // Category Information
  if (category) {
    if (category.description) {
      parts.push(`Category: ${category.description}`);
    }

    // Typical Applications
    if (category.typical_applications && category.typical_applications.length > 0) {
      parts.push(`Use Cases: ${category.typical_applications.join(', ')}`);
    }

    // Search Keywords
    if (category.search_keywords && category.search_keywords.length > 0) {
      parts.push(`Keywords: ${category.search_keywords.join(', ')}`);
    }
  }

  // Subcategory
  if (equipment.subcategory) {
    parts.push(`Subcategory: ${equipment.subcategory}`);
  }

  // Notes (if contains useful context)
  if (equipment.notes && equipment.notes.trim().length > 0) {
    // Only include notes if they seem useful (not just internal notes)
    const notesLower = equipment.notes.toLowerCase();
    const usefulNoteIndicators = ['feature', 'capability', 'use', 'application', 'suitable', 'ideal'];
    if (usefulNoteIndicators.some(indicator => notesLower.includes(indicator))) {
      parts.push(`Notes: ${equipment.notes}`);
    }
  }

  // Location Context
  if (equipment.location && typeof equipment.location === 'object') {
    const location = equipment.location as Record<string, unknown>;
    if (location.city || location.province) {
      const locationParts: string[] = [];
      if (location.city) locationParts.push(String(location.city));
      if (location.province) locationParts.push(String(location.province));
      if (locationParts.length > 0) {
        parts.push(`Location: ${locationParts.join(', ')}`);
      }
    }
  }

  // Alternative Names / Synonyms - REPEATED FOR MAXIMUM PROMINENCE
  // Add synonyms in multiple positions and repeat high-priority ones
  if (synonyms.length > 0) {
    // 1. Add in the middle with context
    parts.push(`Alternative names include ${synonyms.slice(0, 5).join(', ')}`);

    // 2. Add at the end with full list
    parts.push(`Also known as: ${synonyms.join(', ')}`);

    // 3. Repeat high-priority synonyms multiple times for better embedding matching
    // Repeat each synonym 2-3 times to boost its importance
    const repeatedSynonyms: string[] = [];
    synonyms.slice(0, 5).forEach(syn => {
      repeatedSynonyms.push(syn, syn); // Repeat each synonym twice
    });
    parts.push(repeatedSynonyms.join(' '));
  }

  // Combine all parts
  const fullText = parts
    .filter(part => part && part.trim().length > 0)
    .join('. ');

  // Ensure minimum length
  if (fullText.trim().length < 50) {
    // Add fallback information
    const fallback = [
      equipment.make,
      equipment.model,
      equipment.type,
      'equipment rental',
      'construction equipment',
    ].filter(Boolean).join(' ');

    return `${fullText}. ${fallback}`;
  }

  return fullText;
}

/**
 * Get common synonyms for equipment types
 * Helps with semantic search (e.g., "CTL" should find "compact track loader")
 */
function getEquipmentSynonyms(type: string): string[] {
  const typeLower = type.toLowerCase();
  const synonyms: string[] = [];

  // Compact Track Loader synonyms
  if (typeLower.includes('track') && typeLower.includes('loader')) {
    synonyms.push('CTL', 'compact track loader', 'tracked loader');
  }
  if (typeLower.includes('svl')) {
    synonyms.push('compact track loader', 'CTL', 'Kubota SVL');
  }

  // Excavator synonyms
  if (typeLower.includes('excavator')) {
    if (typeLower.includes('mini')) {
      synonyms.push('mini excavator', 'compact excavator');
    }
  }

  // Skid Steer synonyms
  if (typeLower.includes('skid') || typeLower.includes('steer')) {
    synonyms.push('skid steer loader', 'SSL');
  }

  return synonyms;
}


