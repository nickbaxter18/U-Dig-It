import { MapPin } from 'lucide-react';
import Link from 'next/link';

interface ServiceArea {
  name: string;
  slug: string;
  description: string;
}

const serviceAreas: ServiceArea[] = [
  { name: 'Saint John', slug: 'saint-john', description: 'All neighborhoods - our home base' },
  { name: 'Rothesay', slug: 'rothesay', description: 'Estate properties & waterfront' },
  { name: 'Quispamsis', slug: 'quispamsis', description: 'Kennebecasis Valley communities' },
  { name: 'Grand Bay-Westfield', slug: 'grand-bay-westfield', description: 'Bay of Fundy coast' },
  { name: 'Hampton', slug: 'hampton', description: 'Agricultural & acreage properties' },
  { name: 'Kingston Peninsula', slug: 'kingston-peninsula', description: 'Waterfront estates & rural' },
  { name: 'Lorneville', slug: 'lorneville', description: 'Industrial & coastal projects' },
  { name: 'Martinon', slug: 'martinon', description: 'East Saint John residential' },
  { name: 'Barnesville', slug: 'barnesville', description: 'Rural & agricultural' },
  { name: 'Norton', slug: 'norton', description: 'Farm & agricultural focus' },
  { name: 'Sussex', slug: 'sussex', description: 'Dairy farm capital' },
  { name: 'Baxters Corner', slug: 'baxters-corner', description: 'Rural residential' },
  { name: 'Saint Martins', slug: 'saint-martins', description: 'Coastal & tourism' },
  { name: 'Willow Grove', slug: 'willow-grove', description: 'Property development' },
  { name: 'French Village', slug: 'french-village', description: 'Rural communities' },
];

interface ServiceAreaLinksProps {
  currentSlug?: string;
  showAll?: boolean;
  limit?: number;
}

/**
 * Internal linking component for service area pages
 * Improves SEO by creating strong internal link structure
 */
export default function ServiceAreaLinks({ currentSlug, showAll = false, limit = 6 }: ServiceAreaLinksProps) {
  // Filter out current page and limit results
  let areas = currentSlug
    ? serviceAreas.filter(area => area.slug !== currentSlug)
    : serviceAreas;

  if (!showAll && limit) {
    areas = areas.slice(0, limit);
  }

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6">
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="h-6 w-6 text-[#E1BC56]" />
        <h3 className="text-xl font-bold text-gray-900">
          {currentSlug ? 'Other Service Areas' : 'We Also Serve'}
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {areas.map((area: any) => (
          <Link
            key={area.slug}
            href={`/service-areas/${area.slug}`}
            className="group rounded-lg border border-gray-300 bg-white p-4 transition-all hover:border-[#E1BC56] hover:shadow-md"
          >
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E1BC56]" />
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-[#A90F0F]">
                  {area.name}
                </div>
                <div className="text-sm text-gray-600">{area.description}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!showAll && areas.length < serviceAreas.length && (
        <div className="mt-4 text-center">
          <Link
            href="/sitemap-page"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#A90F0F] hover:text-[#8a0c0c]"
          >
            View All Service Areas →
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Nearby service areas component for contextual linking
 */
export function NearbyServiceAreas({ currentSlug }: { currentSlug: string }) {
  const nearbyMap: Record<string, string[]> = {
    'saint-john': ['rothesay', 'quispamsis', 'martinon', 'lorneville'],
    'rothesay': ['saint-john', 'quispamsis', 'fairvale'],
    'quispamsis': ['rothesay', 'saint-john', 'hampton'],
    'grand-bay-westfield': ['saint-john', 'lorneville'],
    'hampton': ['quispamsis', 'rothesay', 'norton', 'sussex'],
    'kingston-peninsula': ['rothesay', 'quispamsis', 'saint-john'],
    'lorneville': ['saint-john', 'martinon', 'grand-bay-westfield'],
    'martinon': ['saint-john', 'lorneville'],
    'barnesville': ['norton', 'sussex', 'hampton'],
    'norton': ['hampton', 'sussex', 'barnesville'],
    'sussex': ['hampton', 'norton', 'barnesville'],
    'baxters-corner': ['hampton', 'willow-grove', 'sussex'],
    'saint-martins': ['saint-john', 'lorneville'],
    'willow-grove': ['hampton', 'baxters-corner', 'french-village'],
    'french-village': ['willow-grove', 'hampton'],
  };

  const nearbySlugs = nearbyMap[currentSlug] || [];
  const nearbyAreas = serviceAreas.filter(area => nearbySlugs.includes(area.slug));

  if (nearbyAreas.length === 0) return null;

  return (
    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900">
        🗺️ Nearby Communities We Serve
      </h3>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {nearbyAreas.map((area: any) => (
          <Link
            key={area.slug}
            href={`/service-areas/${area.slug}`}
            className="flex items-center gap-2 rounded-md border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
          >
            <MapPin className="h-4 w-4 text-blue-600" />
            {area.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

