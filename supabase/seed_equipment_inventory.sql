-- Equipment Inventory Seed Data
-- Creates realistic equipment inventory for Kubota SVL-75 rental fleet
-- Run with: mcp_supabase_execute_sql

-- Clear existing equipment (development only - remove this line for production)
-- DELETE FROM equipment WHERE unitId LIKE 'UNIT-%';

-- Insert 5 SVL-75 Track Loaders with realistic data
INSERT INTO equipment (
  "unitId",
  "serialNumber",
  model,
  year,
  make,
  description,
  type,
  "replacementValue",
  "dailyRate",
  "weeklyRate",
  "monthlyRate",
  "overageHourlyRate",
  "dailyHourAllowance",
  "weeklyHourAllowance",
  status,
  "totalEngineHours",
  specifications,
  images,
  location,
  attachments,
  documents,
  rider_required,
  rider_template_id,
  rider_version,
  category_id,
  subcategory,
  hourly_rate,
  half_day_rate,
  minimum_rental_hours,
  home_location_id,
  current_location_id
) VALUES
  -- Unit 1: 2023 Model (High Usage, Available)
  (
    'UNIT-001',
    'KUBSVL75-2023-001',
    'SVL75-3',
    2023,
    'Kubota',
    'Kubota SVL75-3 Compact Track Loader - Premium model with 74.3 HP, 2-speed travel, auxiliary hydraulics, cab with heat/AC, backup camera, and LED work lights. Ideal for landscaping, construction, and excavation projects.',
    'svl75',
    95000.00,
    450.00,
    1800.00,
    5500.00,
    85.00,
    8,
    40,
    'available',
    1247,
    '{
      "engine": {
        "type": "Kubota V3307-CR-TE5",
        "horsepower": 74.3,
        "fuelType": "Diesel",
        "cooling": "Liquid"
      },
      "performance": {
        "operatingCapacity": "3300 lbs",
        "tippingLoad": "6600 lbs",
        "travelSpeed": "6.8 mph (2-speed)",
        "groundPressure": "4.1 psi"
      },
      "dimensions": {
        "length": "133.1 in",
        "width": "74.8 in",
        "height": "80.1 in",
        "weight": "9920 lbs"
      },
      "hydraulics": {
        "auxiliaryFlow": "23.8 gpm",
        "maxPressure": "3626 psi",
        "liftCapacity": "3527 lbs"
      },
      "features": [
        "Enclosed cab with heat and A/C",
        "Joystick controls",
        "Backup camera",
        "LED work lights",
        "Bluetooth radio",
        "Suspension seat",
        "2-speed travel"
      ]
    }',
    '{
      "main": "/images/kubota-svl-75-hero.png",
      "gallery": [
        "/images/kubota-svl-75-hero.png",
        "/images/equipment/svl75-side.jpg",
        "/images/equipment/svl75-bucket.jpg",
        "/images/equipment/svl75-cab.jpg"
      ]
    }',
    '{
      "yard": "Saint John Main Yard",
      "address": "123 Industrial Drive, Saint John, NB",
      "coordinates": { "lat": 45.2733, "lng": -66.0633 }
    }',
    '[]',
    '[]',
    true,
    'SVL75_RIDER_2024',
    '2024.1',
    (SELECT id FROM equipment_categories WHERE slug = 'compact-track-loaders' LIMIT 1),
    'Standard Cab Model',
    85.00,
    275.00,
    4,
    (SELECT id FROM locations WHERE slug = 'saint-john-main' LIMIT 1),
    (SELECT id FROM locations WHERE slug = 'saint-john-main' LIMIT 1)
  ),

  -- Unit 2: 2023 Model (Medium Usage, Available)
  (
    'UNIT-002',
    'KUBSVL75-2023-002',
    'SVL75-3',
    2023,
    'Kubota',
    'Kubota SVL75-3 Compact Track Loader - Versatile machine with excellent performance for digging, grading, and material handling. Features cab comfort, powerful hydraulics, and operator-friendly controls.',
    'svl75',
    95000.00,
    450.00,
    1800.00,
    5500.00,
    85.00,
    8,
    40,
    'available',
    892,
    '{
      "engine": {
        "type": "Kubota V3307-CR-TE5",
        "horsepower": 74.3,
        "fuelType": "Diesel",
        "cooling": "Liquid"
      },
      "performance": {
        "operatingCapacity": "3300 lbs",
        "tippingLoad": "6600 lbs",
        "travelSpeed": "6.8 mph (2-speed)",
        "groundPressure": "4.1 psi"
      },
      "dimensions": {
        "length": "133.1 in",
        "width": "74.8 in",
        "height": "80.1 in",
        "weight": "9920 lbs"
      },
      "hydraulics": {
        "auxiliaryFlow": "23.8 gpm",
        "maxPressure": "3626 psi",
        "liftCapacity": "3527 lbs"
      },
      "features": [
        "Enclosed cab with heat and A/C",
        "Joystick controls",
        "Backup camera",
        "LED work lights",
        "Bluetooth radio",
        "Suspension seat",
        "2-speed travel"
      ]
    }',
    '{
      "main": "/images/kubota-svl-75-hero.png",
      "gallery": [
        "/images/kubota-svl-75-hero.png"
      ]
    }',
    '{
      "yard": "Saint John Main Yard",
      "address": "123 Industrial Drive, Saint John, NB",
      "coordinates": { "lat": 45.2733, "lng": -66.0633 }
    }',
    '[]',
    '[]',
    true,
    'SVL75_RIDER_2024',
    '2024.1',
    (SELECT id FROM equipment_categories WHERE slug = 'compact-track-loaders' LIMIT 1),
    'Standard Cab Model',
    85.00,
    275.00,
    4,
    (SELECT id FROM locations WHERE slug = 'saint-john-main' LIMIT 1),
    (SELECT id FROM locations WHERE slug = 'saint-john-main' LIMIT 1)
  ),

  -- Unit 3: 2024 Model (Low Usage, Premium Rate, Available)
  (
    'UNIT-003',
    'KUBSVL75-2024-003',
    'SVL75-3',
    2024,
    'Kubota',
    'Kubota SVL75-3 Compact Track Loader (2024 Model) - Nearly new premium unit with latest features, low hours, and pristine condition. Perfect for customers requiring top-tier equipment with maximum reliability.',
    'svl75',
    98000.00,
    475.00,
    1900.00,
    6000.00,
    90.00,
    8,
    40,
    'available',
    156,
    '{
      "engine": {
        "type": "Kubota V3307-CR-TE5",
        "horsepower": 74.3,
        "fuelType": "Diesel",
        "cooling": "Liquid"
      },
      "performance": {
        "operatingCapacity": "3300 lbs",
        "tippingLoad": "6600 lbs",
        "travelSpeed": "6.8 mph (2-speed)",
        "groundPressure": "4.1 psi"
      },
      "dimensions": {
        "length": "133.1 in",
        "width": "74.8 in",
        "height": "80.1 in",
        "weight": "9920 lbs"
      },
      "hydraulics": {
        "auxiliaryFlow": "23.8 gpm",
        "maxPressure": "3626 psi",
        "liftCapacity": "3527 lbs"
      },
      "features": [
        "Enclosed cab with heat and A/C",
        "Joystick controls",
        "Backup camera",
        "LED work lights",
        "Bluetooth radio",
        "Premium suspension seat",
        "2-speed travel",
        "Enhanced filtration system"
      ],
      "condition": "Excellent - Low hours, like new"
    }',
    '{
      "main": "/images/kubota-svl-75-hero.png",
      "gallery": [
        "/images/kubota-svl-75-hero.png"
      ]
    }',
    '{
      "yard": "Saint John Main Yard",
      "address": "123 Industrial Drive, Saint John, NB",
      "coordinates": { "lat": 45.2733, "lng": -66.0633 }
    }',
    '[]',
    '[]',
    true,
    'SVL75_RIDER_2024',
    '2024.1',
    (SELECT id FROM equipment_categories WHERE slug = 'compact-track-loaders' LIMIT 1),
    'Premium 2024 Model',
    90.00,
    290.00,
    4,
    (SELECT id FROM locations WHERE slug = 'saint-john-main' LIMIT 1),
    (SELECT id FROM locations WHERE slug = 'saint-john-main' LIMIT 1)
  ),

  -- Unit 4: 2023 Model (Currently in Maintenance)
  (
    'UNIT-004',
    'KUBSVL75-2023-004',
    'SVL75-3',
    2023,
    'Kubota',
    'Kubota SVL75-3 Compact Track Loader - Currently undergoing scheduled maintenance. Will be available after November 15, 2025. Full-featured model with all standard equipment and accessories.',
    'svl75',
    95000.00,
    450.00,
    1800.00,
    5500.00,
    85.00,
    8,
    40,
    'maintenance',
    1583,
    '{
      "engine": {
        "type": "Kubota V3307-CR-TE5",
        "horsepower": 74.3,
        "fuelType": "Diesel",
        "cooling": "Liquid"
      },
      "performance": {
        "operatingCapacity": "3300 lbs",
        "tippingLoad": "6600 lbs",
        "travelSpeed": "6.8 mph (2-speed)",
        "groundPressure": "4.1 psi"
      },
      "dimensions": {
        "length": "133.1 in",
        "width": "74.8 in",
        "height": "80.1 in",
        "weight": "9920 lbs"
      },
      "hydraulics": {
        "auxiliaryFlow": "23.8 gpm",
        "maxPressure": "3626 psi",
        "liftCapacity": "3527 lbs"
      },
      "features": [
        "Enclosed cab with heat and A/C",
        "Joystick controls",
        "Backup camera",
        "LED work lights",
        "Bluetooth radio",
        "Suspension seat",
        "2-speed travel"
      ],
      "maintenanceSchedule": {
        "lastService": "2025-10-28",
        "nextService": "2025-11-15",
        "type": "500-hour service"
      }
    }',
    '{
      "main": "/images/kubota-svl-75-hero.png",
      "gallery": [
        "/images/kubota-svl-75-hero.png"
      ]
    }',
    '{
      "yard": "Saint John Main Yard - Service Bay",
      "address": "123 Industrial Drive, Saint John, NB",
      "coordinates": { "lat": 45.2733, "lng": -66.0633 }
    }',
    '[]',
    '[]',
    true,
    'SVL75_RIDER_2024',
    '2024.1',
    (SELECT id FROM equipment_categories WHERE slug = 'compact-track-loaders' LIMIT 1),
    'Standard Cab Model',
    85.00,
    275.00,
    4,
    (SELECT id FROM locations WHERE slug = 'saint-john-main' LIMIT 1),
    (SELECT id FROM locations WHERE slug = 'saint-john-main' LIMIT 1)
  ),

  -- Unit 5: 2024 Model (Brand New, Premium, Available)
  (
    'UNIT-005',
    'KUBSVL75-2024-005',
    'SVL75-3',
    2024,
    'Kubota',
    'Kubota SVL75-3 Compact Track Loader (2024 Model) - Brand new premium unit, just 45 engine hours. Top-of-the-line equipment with all the latest features and technology. Perfect for high-value projects requiring the best.',
    'svl75',
    98000.00,
    475.00,
    1900.00,
    6000.00,
    90.00,
    8,
    40,
    'available',
    45,
    '{
      "engine": {
        "type": "Kubota V3307-CR-TE5",
        "horsepower": 74.3,
        "fuelType": "Diesel",
        "cooling": "Liquid"
      },
      "performance": {
        "operatingCapacity": "3300 lbs",
        "tippingLoad": "6600 lbs",
        "travelSpeed": "6.8 mph (2-speed)",
        "groundPressure": "4.1 psi"
      },
      "dimensions": {
        "length": "133.1 in",
        "width": "74.8 in",
        "height": "80.1 in",
        "weight": "9920 lbs"
      },
      "hydraulics": {
        "auxiliaryFlow": "23.8 gpm",
        "maxPressure": "3626 psi",
        "liftCapacity": "3527 lbs"
      },
      "features": [
        "Enclosed cab with heat and A/C",
        "Joystick controls",
        "Backup camera",
        "LED work lights",
        "Premium Bluetooth radio",
        "Deluxe suspension seat",
        "2-speed travel",
        "Enhanced filtration system",
        "Telematics GPS tracking"
      ],
      "condition": "Brand New - Under 50 hours"
    }',
    '{
      "main": "/images/kubota-svl-75-hero.png",
      "gallery": [
        "/images/kubota-svl-75-hero.png"
      ]
    }',
    '{
      "yard": "Saint John Main Yard",
      "address": "123 Industrial Drive, Saint John, NB",
      "coordinates": { "lat": 45.2733, "lng": -66.0633 }
    }',
    '[]',
    '[]',
    true,
    'SVL75_RIDER_2024',
    '2024.1',
    (SELECT id FROM equipment_categories WHERE slug = 'compact-track-loaders' LIMIT 1),
    'Premium 2024 Model',
    90.00,
    290.00,
    4,
    (SELECT id FROM locations WHERE slug = 'saint-john-main' LIMIT 1),
    (SELECT id FROM locations WHERE slug = 'saint-john-main' LIMIT 1)
  );

-- Verify insertion
SELECT 
  "unitId",
  "serialNumber",
  model,
  year,
  status,
  "dailyRate",
  "weeklyRate",
  "totalEngineHours",
  "createdAt"
FROM equipment
WHERE "unitId" LIKE 'UNIT-%'
ORDER BY "unitId";

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Equipment inventory seeded successfully!';
  RAISE NOTICE '📊 Total units: %', (SELECT COUNT(*) FROM equipment WHERE "unitId" LIKE 'UNIT-%');
  RAISE NOTICE '🟢 Available units: %', (SELECT COUNT(*) FROM equipment WHERE status = ''available'' AND "unitId" LIKE 'UNIT-%');
  RAISE NOTICE '🔧 In maintenance: %', (SELECT COUNT(*) FROM equipment WHERE status = ''maintenance'' AND "unitId" LIKE 'UNIT-%');
END $$;


