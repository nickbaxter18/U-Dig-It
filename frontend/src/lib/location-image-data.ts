/**
 * Location-specific data for image SEO optimization
 * Used to generate geo-targeted alt text, titles, and EXIF metadata
 */

export interface LocationData {
  slug: string;
  name: string;
  fullName: string;
  province: string;
  neighborhoods: string[];
  specialty: string;
  region: string;
  projectTypes: string[];
  gps: {
    latitude: number;
    longitude: number;
  };
}

export const locationImageData: Record<string, LocationData> = {
  'saint-john': {
    slug: 'saint-john',
    name: 'Saint John',
    fullName: 'Saint John, New Brunswick',
    province: 'NB',
    neighborhoods: ['Uptown', 'South End', 'Millidgeville', 'East Saint John', 'West Saint John', 'North End'],
    specialty: 'urban construction and commercial excavation',
    region: 'Greater Saint John',
    projectTypes: ['foundation excavation', 'pool installation', 'commercial grading', 'utility trenching'],
    gps: { latitude: 45.2734, longitude: -66.0633 }
  },

  'rothesay': {
    slug: 'rothesay',
    name: 'Rothesay',
    fullName: 'Rothesay, New Brunswick',
    province: 'NB',
    neighborhoods: ['Renforth', 'Wells', 'Fairvale', 'Gondola Point', 'Rothesay Park'],
    specialty: 'estate landscaping and waterfront properties',
    region: 'Kennebecasis Valley',
    projectTypes: ['estate grading', 'pool excavation', 'waterfront retaining walls', 'driveway extensions'],
    gps: { latitude: 45.3764, longitude: -65.9989 }
  },

  'quispamsis': {
    slug: 'quispamsis',
    name: 'Quispamsis',
    fullName: 'Quispamsis, New Brunswick',
    province: 'NB',
    neighborhoods: ['Gondola Point', 'Keenan Drive', 'Meenan\'s Cove', 'Hampton Road', 'Pettingill Road'],
    specialty: 'residential development and Kennebecasis River properties',
    region: 'KV Region',
    projectTypes: ['residential landscaping', 'pool installation', 'new home foundations', 'waterfront grading'],
    gps: { latitude: 45.4320, longitude: -65.9464 }
  },

  'grand-bay-westfield': {
    slug: 'grand-bay-westfield',
    name: 'Grand Bay-Westfield',
    fullName: 'Grand Bay-Westfield, New Brunswick',
    province: 'NB',
    neighborhoods: ['Epworth Park', 'Hillandale', 'Ingleside', 'Westfield', 'Grand Bay'],
    specialty: 'Bay of Fundy waterfront and coastal properties',
    region: 'Route 7 Corridor',
    projectTypes: ['waterfront excavation', 'shoreline grading', 'coastal property development'],
    gps: { latitude: 45.3547, longitude: -66.2272 }
  },

  'hampton': {
    slug: 'hampton',
    name: 'Hampton',
    fullName: 'Hampton, New Brunswick',
    province: 'NB',
    neighborhoods: ['Hampton Village', 'Hampton Station', 'Lakeside', 'Hampton Heights'],
    specialty: 'agricultural and acreage property development',
    region: 'Kings County',
    projectTypes: ['farm drainage', 'acreage grading', 'barn preparation', 'rural property development'],
    gps: { latitude: 45.5309, longitude: -65.8540 }
  },

  'kingston-peninsula': {
    slug: 'kingston-peninsula',
    name: 'Kingston Peninsula',
    fullName: 'Kingston Peninsula, New Brunswick',
    province: 'NB',
    neighborhoods: ['Kingston', 'Summerville', 'Long Reach', 'Bayswater', 'Reed\'s Point', 'Clifton Royal'],
    specialty: 'Kennebecasis River waterfront estates',
    region: 'Peninsula Communities',
    projectTypes: ['waterfront landscaping', 'estate development', 'peninsula driveways', 'river property grading'],
    gps: { latitude: 45.4800, longitude: -65.9200 }
  },

  'lorneville': {
    slug: 'lorneville',
    name: 'Lorneville',
    fullName: 'Lorneville, New Brunswick',
    province: 'NB',
    neighborhoods: ['Lorneville', 'Musquash', 'Dipper Harbour', 'Chance Harbour'],
    specialty: 'industrial and coastal property development',
    region: 'Bay of Fundy Coast',
    projectTypes: ['industrial site preparation', 'coastal excavation', 'commercial grading'],
    gps: { latitude: 45.2033, longitude: -66.1883 }
  },

  'martinon': {
    slug: 'martinon',
    name: 'Martinon',
    fullName: 'Martinon, New Brunswick',
    province: 'NB',
    neighborhoods: ['Martinon', 'Glen Falls', 'Black River Road', 'East Saint John Area'],
    specialty: 'residential suburban development',
    region: 'East Saint John',
    projectTypes: ['residential landscaping', 'home foundations', 'driveway work', 'backyard grading'],
    gps: { latitude: 45.2250, longitude: -66.0167 }
  },

  'barnesville': {
    slug: 'barnesville',
    name: 'Barnesville',
    fullName: 'Barnesville, New Brunswick',
    province: 'NB',
    neighborhoods: ['Barnesville', 'Surrounding Rural Area'],
    specialty: 'rural and agricultural property development',
    region: 'Kings County Rural',
    projectTypes: ['farm work', 'rural property grading', 'agricultural drainage'],
    gps: { latitude: 45.4900, longitude: -65.7200 }
  },

  'norton': {
    slug: 'norton',
    name: 'Norton',
    fullName: 'Norton, New Brunswick',
    province: 'NB',
    neighborhoods: ['Norton', 'Norton Station'],
    specialty: 'farm and agricultural equipment services',
    region: 'Agricultural Kings County',
    projectTypes: ['farm drainage', 'crop field preparation', 'agricultural building prep'],
    gps: { latitude: 45.6000, longitude: -65.7500 }
  },

  'sussex': {
    slug: 'sussex',
    name: 'Sussex',
    fullName: 'Sussex, New Brunswick',
    province: 'NB',
    neighborhoods: ['Sussex', 'Sussex Corner', 'Lower Millstream', 'Apohaqui'],
    specialty: 'dairy farm and agricultural operations',
    region: 'Dairy Capital of the Maritimes',
    projectTypes: ['dairy farm equipment', 'barn preparation', 'agricultural drainage', 'manure management'],
    gps: { latitude: 45.7200, longitude: -65.5000 }
  },

  'baxters-corner': {
    slug: 'baxters-corner',
    name: 'Baxters Corner',
    fullName: 'Baxters Corner, New Brunswick',
    province: 'NB',
    neighborhoods: ['Baxters Corner', 'Surrounding Area'],
    specialty: 'rural residential property development',
    region: 'Kings County',
    projectTypes: ['rural home foundations', 'property grading', 'residential excavation'],
    gps: { latitude: 45.5500, longitude: -65.7800 }
  },

  'saint-martins': {
    slug: 'saint-martins',
    name: 'Saint Martins',
    fullName: 'Saint Martins, New Brunswick',
    province: 'NB',
    neighborhoods: ['Saint Martins Village', 'Fundy Coast', 'Tourism District'],
    specialty: 'coastal and tourism property development',
    region: 'Bay of Fundy',
    projectTypes: ['coastal excavation', 'tourism property development', 'waterfront grading'],
    gps: { latitude: 45.3600, longitude: -65.5400 }
  },

  'willow-grove': {
    slug: 'willow-grove',
    name: 'Willow Grove',
    fullName: 'Willow Grove, New Brunswick',
    province: 'NB',
    neighborhoods: ['Willow Grove', 'Rural Communities'],
    specialty: 'rural property development and land clearing',
    region: 'Kings County Rural',
    projectTypes: ['property development', 'land clearing', 'rural excavation', 'acreage work'],
    gps: { latitude: 45.5200, longitude: -65.8200 }
  },

  'french-village': {
    slug: 'french-village',
    name: 'French Village',
    fullName: 'French Village, New Brunswick',
    province: 'NB',
    neighborhoods: ['French Village', 'Local Communities'],
    specialty: 'rural residential and property development',
    region: 'Kings County',
    projectTypes: ['residential excavation', 'property grading', 'rural development'],
    gps: { latitude: 45.5400, longitude: -65.8400 }
  },
};

/**
 * Generate SEO-optimized alt text for watermark images
 * @param location - Location slug (e.g., 'saint-john')
 * @param position - Watermark position 1-9
 * @returns Unique, keyword-rich alt text
 */
export function generateWatermarkAltText(location: string, position: number): string {
  const loc = locationImageData[location];
  if (!loc) return 'U-Dig It Rentals Equipment Rental New Brunswick';

  const templates = [
    // Position 1: Service + Location + Province + Specialty
    `Professional equipment rental ${loc.name} ${loc.province} ${loc.specialty}`,

    // Position 2: Equipment + Location + Neighborhood + Project
    `Kubota track loader rental ${loc.name} ${loc.neighborhoods[0]} ${loc.projectTypes[0]}`,

    // Position 3: Brand + Location + Service Type
    `U-Dig It Rentals ${loc.name} heavy equipment skid steer rental service`,

    // Position 4: Location + Equipment + Model
    `${loc.name} excavation equipment Kubota SVL75-3 compact track loader rental`,

    // Position 5: Equipment + Location + Multiple Neighborhoods
    `Track loader rental ${loc.name} ${loc.neighborhoods[1]} ${loc.neighborhoods[2]} delivery service`,

    // Position 6: Service + Location + Specialty + Region
    `Construction equipment rental ${loc.name} ${loc.specialty} ${loc.region}`,

    // Position 7: Equipment + Location + Project Types
    `Kubota equipment ${loc.name} ${loc.projectTypes[1]} ${loc.projectTypes[2]}`,

    // Position 8: Professional + Service + Location + Region
    `Professional track loader ${loc.name} landscaping grading ${loc.region} area`,

    // Position 9: Location + Service + Neighborhoods + Delivery
    `${loc.name} ${loc.province} equipment rental ${loc.neighborhoods[0]} ${loc.neighborhoods[1]} delivery`
  ];

  return templates[position - 1] || templates[0];
}

/**
 * Generate SEO-optimized title attribute for images
 * @param location - Location slug
 * @param imageType - Type of image (watermark, equipment, photo)
 * @returns Title text for hover tooltip and SEO
 */
export function generateImageTitle(location: string, imageType: 'watermark' | 'equipment' | 'photo' = 'watermark'): string {
  const loc = locationImageData[location];
  if (!loc) return 'U-Dig It Rentals - Professional Equipment Rental New Brunswick';

  const titleTemplates = {
    watermark: `U-Dig It Rentals ${loc.name} ${loc.province} | Kubota SVL75-3 Track Loader Rental`,
    equipment: `Kubota SVL75-3 Compact Track Loader - Professional Rental ${loc.fullName}`,
    photo: `Family-Owned Equipment Rental Business Serving ${loc.fullName}`
  };

  return titleTemplates[imageType];
}

/**
 * Generate image keywords for EXIF metadata
 * @param location - Location slug
 * @returns Comma-separated keywords for EXIF
 */
export function generateImageKeywords(location: string): string[] {
  const loc = locationImageData[location];
  if (!loc) return ['equipment rental', 'new brunswick', 'kubota'];

  return [
    'kubota',
    'svl75-3',
    'track loader',
    'equipment rental',
    loc.name.toLowerCase(),
    loc.province.toLowerCase(),
    'excavation',
    'construction',
    'landscaping',
    ...loc.neighborhoods.slice(0, 3).map(n => n.toLowerCase()),
    loc.region.toLowerCase()
  ];
}

/**
 * Get location GPS coordinates for EXIF geo-tagging
 * @param location - Location slug
 * @returns GPS coordinates
 */
export function getLocationGPS(location: string) {
  return locationImageData[location]?.gps || { latitude: 45.2734, longitude: -66.0633 };
}

