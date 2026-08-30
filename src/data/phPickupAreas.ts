/**
 * Pickup-area options for search Autocompletes.
 * Official PH cities (HUC / component / independent) plus nationwide, Metro Manila,
 * and listing aliases already used on catalog `location` strings.
 * Not every municipality — Autocomplete stays type-to-filter.
 */

const PINNED = ['Philippines', 'Metro Manila'] as const

/** Neighborhood / corridor labels that appear on mock listings or search UX. */
const LISTING_ALIASES = [
  'Alabang, Muntinlupa',
  'BGC, Taguig',
  'Bonifacio Global City',
  'Clark, Pampanga',
  'Ortigas, Pasig',
] as const

/**
 * Official cities of the Philippines. Duplicate city names include the province.
 */
const PH_CITIES = [
  // NCR
  'Caloocan',
  'Las Piñas',
  'Makati',
  'Malabon',
  'Mandaluyong',
  'Manila',
  'Marikina',
  'Muntinlupa',
  'Navotas',
  'Parañaque',
  'Pasay',
  'Pasig',
  'Quezon City',
  'San Juan',
  'Taguig',
  'Valenzuela',
  // CAR
  'Baguio',
  'Tabuk',
  // Ilocos
  'Alaminos',
  'Batac',
  'Candon',
  'Dagupan',
  'Laoag',
  'San Carlos (Pangasinan)',
  'San Fernando (La Union)',
  'Urdaneta',
  'Vigan',
  // Cagayan Valley
  'Cauayan',
  'Ilagan',
  'Santiago',
  'Tuguegarao',
  // Central Luzon
  'Angeles',
  'Balanga',
  'Baliwag',
  'Cabanatuan',
  'Gapan',
  'Mabalacat',
  'Malolos',
  'Meycauayan',
  'Olongapo',
  'Palayan',
  'San Fernando (Pampanga)',
  'San Jose (Nueva Ecija)',
  'San Jose del Monte',
  'Science City of Muñoz',
  'Tarlac City',
  // CALABARZON
  'Antipolo',
  'Bacoor',
  'Batangas City',
  'Biñan',
  'Cabuyao',
  'Calamba',
  'Carmona',
  'Cavite City',
  'Dasmariñas',
  'General Trias',
  'Imus',
  'Lipa',
  'Lucena',
  'San Pablo',
  'San Pedro',
  'Santa Rosa',
  'Santo Tomas',
  'Tagaytay',
  'Tanauan',
  'Tayabas',
  'Trece Martires',
  // MIMAROPA
  'Calapan',
  'Puerto Princesa',
  // Bicol
  'Iriga',
  'Legazpi',
  'Ligao',
  'Masbate City',
  'Naga (Camarines Sur)',
  'Sorsogon City',
  'Tabaco',
  // Western Visayas
  'Bacolod',
  'Bago',
  'Cadiz',
  'Escalante',
  'Himamaylan',
  'Iloilo City',
  'Kabankalan',
  'La Carlota',
  'Passi',
  'Roxas',
  'Sagay',
  'San Carlos (Negros Occidental)',
  'Silay',
  'Sipalay',
  'Talisay (Negros Occidental)',
  'Victorias',
  // Central Visayas
  'Bais',
  'Bayawan',
  'Bogo',
  'Canlaon',
  'Carcar',
  'Cebu City',
  'Danao',
  'Dumaguete',
  'Guihulngan',
  'Lapu-Lapu',
  'Mandaue',
  'Naga (Cebu)',
  'Tagbilaran',
  'Talisay (Cebu)',
  'Tanjay',
  'Toledo',
  // Eastern Visayas
  'Baybay',
  'Borongan',
  'Calbayog',
  'Catbalogan',
  'Maasin',
  'Ormoc',
  'Tacloban',
  // Zamboanga Peninsula
  'Dapitan',
  'Dipolog',
  'Pagadian',
  'Zamboanga City',
  // Northern Mindanao
  'Cagayan de Oro',
  'El Salvador',
  'Gingoog',
  'Iligan',
  'Malaybalay',
  'Oroquieta',
  'Ozamiz',
  'Tangub',
  'Valencia',
  // Davao
  'Davao City',
  'Digos',
  'Island Garden City of Samal',
  'Mati',
  'Panabo',
  'Tagum',
  // SOCCSKSARGEN
  'Cotabato City',
  'General Santos',
  'Kidapawan',
  'Koronadal',
  'Tacurong',
  // Caraga
  'Bayugan',
  'Bislig',
  'Butuan',
  'Cabadbaran',
  'Surigao City',
  'Tandag',
  // BARMM
  'Isabela City',
  'Lamitan',
  'Marawi',
] as const

const rest = [...new Set([...PH_CITIES, ...LISTING_ALIASES])].sort((a, b) => a.localeCompare(b, 'en'))

/** Pinned nationwide / capital-region first, then A–Z cities and aliases. */
export const PH_PICKUP_AREAS: readonly string[] = [...PINNED, ...rest]
