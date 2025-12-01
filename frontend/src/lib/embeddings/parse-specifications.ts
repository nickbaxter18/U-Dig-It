/**
 * Specification Parser
 *
 * Extracts and formats JSONB specifications into natural language text
 * for embedding generation. Converts structured data into searchable text.
 */

interface EquipmentSpecifications {
  operatingWeight?: number;
  transportDimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  fuelType?: string;
  engineHorsepower?: number;
  attachments?: string[];
  [key: string]: unknown;
}

/**
 * Parse specifications JSONB into natural language text
 *
 * @param specifications - JSONB specifications object
 * @returns Natural language description of specifications
 */
export function parseSpecifications(
  specifications: unknown
): string {
  if (!specifications || typeof specifications !== 'object') {
    return '';
  }

  const specs = specifications as EquipmentSpecifications;
  const parts: string[] = [];

  // Operating weight
  if (specs.operatingWeight) {
    const weight = typeof specs.operatingWeight === 'number'
      ? specs.operatingWeight
      : parseFloat(String(specs.operatingWeight));
    if (!isNaN(weight)) {
      parts.push(`${formatNumber(weight)} pound operating weight`);
    }
  }

  // Transport dimensions
  if (specs.transportDimensions) {
    const dims = specs.transportDimensions;
    const dimParts: string[] = [];

    if (dims.length) {
      dimParts.push(`${formatNumber(dims.length)} inches long`);
    }
    if (dims.width) {
      dimParts.push(`${formatNumber(dims.width)} inches wide`);
    }
    if (dims.height) {
      dimParts.push(`${formatNumber(dims.height)} inches tall`);
    }

    if (dimParts.length > 0) {
      parts.push(`Transport dimensions: ${dimParts.join(', ')}`);
    }
  }

  // Fuel type
  if (specs.fuelType) {
    parts.push(`${String(specs.fuelType).toLowerCase()} powered`);
  }

  // Engine horsepower
  if (specs.engineHorsepower) {
    const hp = typeof specs.engineHorsepower === 'number'
      ? specs.engineHorsepower
      : parseFloat(String(specs.engineHorsepower));
    if (!isNaN(hp)) {
      parts.push(`${formatNumber(hp)} horsepower engine`);
    }
  }

  // Attachments
  if (Array.isArray(specs.attachments) && specs.attachments.length > 0) {
    parts.push(`Compatible with: ${specs.attachments.join(', ')}`);
  }

  // Handle other numeric or string fields
  for (const [key, value] of Object.entries(specs)) {
    // Skip already processed fields
    if (['operatingWeight', 'transportDimensions', 'fuelType', 'engineHorsepower', 'attachments'].includes(key)) {
      continue;
    }

    // Process numeric values
    if (typeof value === 'number') {
      const formattedKey = formatKey(key);
      parts.push(`${formattedKey}: ${formatNumber(value)}`);
    }
    // Process string values
    else if (typeof value === 'string' && value.trim().length > 0) {
      const formattedKey = formatKey(key);
      parts.push(`${formattedKey}: ${value}`);
    }
  }

  return parts.join('. ');
}

/**
 * Format number with commas for readability
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format key from camelCase to readable text
 */
function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}


