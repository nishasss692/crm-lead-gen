// Karnataka Territory & Pincode Registry for India Post CRM
// Defines complete 36-division hierarchical mapping and postal office resolver.
import MASTER_PINCODE_CATALOG from './karnatakaPincodesCatalog.json';

export interface TerritoryMapping {
  division: string;
  divisionLabel: string;
  region: string;
  aliases: string[];
}

export const KARNATAKA_TERRITORY_DIRECTORY: Record<string, { region: string; aliases: string[] }> = {
  // Bengaluru HQ Region
  'BG East': { region: 'Bengaluru HQ Region', aliases: ['bg east', 'bgeast', 'bg_east', 'bengaluru east', 'bangalore east', 'bg east division'] },
  'BG South': { region: 'Bengaluru HQ Region', aliases: ['bg south', 'bgsouth', 'bg_south', 'bengaluru south', 'bangalore south', 'bg south division'] },
  'BG West': { region: 'Bengaluru HQ Region', aliases: ['bg west', 'bgwest', 'bg_west', 'bengaluru west', 'bangalore west', 'bg west division'] },
  'BG Central': { region: 'Bengaluru HQ Region', aliases: ['bg central', 'bgcentral', 'bg_central', 'bengaluru central', 'bangalore central'] },
  'BG GPO': { region: 'Bengaluru HQ Region', aliases: ['bg gpo', 'bggpo', 'bg_gpo', 'bengaluru gpo', 'bangalore gpo', 'gpo'] },
  'Channapatna': { region: 'Bengaluru HQ Region', aliases: ['channapatna', 'chanapatna', 'channapatana', 'channapatna division'] },

  // South Karnataka Region
  'Kolar': { region: 'South Karnataka Region', aliases: ['kolar', 'kolara', 'kolar division'] },
  'Mysuru': { region: 'South Karnataka Region', aliases: ['mysuru', 'mysore', 'mysuru division', 'mysore division'] },
  'Nanjangud': { region: 'South Karnataka Region', aliases: ['nanjangud', 'nanjanagudu', 'nanjangud division'] },
  'Mandya': { region: 'South Karnataka Region', aliases: ['mandya', 'mandya division'] },
  'Hassan': { region: 'South Karnataka Region', aliases: ['hassan', 'hasana', 'hassan division'] },
  'Kodagu': { region: 'South Karnataka Region', aliases: ['kodagu', 'coorg', 'madikeri', 'kodagu division'] },
  'Mangaluru': { region: 'South Karnataka Region', aliases: ['mangaluru', 'mangalore', 'mangaluru division', 'mangalore division'] },
  'Puttur': { region: 'South Karnataka Region', aliases: ['puttur', 'putturu', 'puttur division'] },
  'Udupi': { region: 'South Karnataka Region', aliases: ['udupi', 'udapi', 'udupi division'] },
  'Shivamogga': { region: 'South Karnataka Region', aliases: ['shivamogga', 'shimoga', 'shivamogga division', 'shimoga division'] },
  'Chikkamagaluru': { region: 'South Karnataka Region', aliases: ['chikkamagaluru', 'chikmagalur', 'chikmagaluru', 'chikkamagaluru division'] },
  'Chitradurga': { region: 'South Karnataka Region', aliases: ['chitradurga', 'chitradurga division'] },
  'Davangere': { region: 'South Karnataka Region', aliases: ['davangere', 'davanagere', 'davangere division', 'davanagere division'] },
  'Tumakuru': { region: 'South Karnataka Region', aliases: ['tumakuru', 'tumkur', 'tumakuru division', 'tumkur division'] },

  // North Karnataka Region
  'Dharwad': { region: 'North Karnataka Region', aliases: ['dharwad', 'dharwad division', 'hubli', 'hubballi'] },
  'Belagavi': { region: 'North Karnataka Region', aliases: ['belagavi', 'belgaum', 'belagavi division'] },
  'Gokak': { region: 'North Karnataka Region', aliases: ['gokak', 'gokak division'] },
  'Chikodi': { region: 'North Karnataka Region', aliases: ['chikodi', 'chikkodi', 'chikodi division'] },
  'Bagalkote': { region: 'North Karnataka Region', aliases: ['bagalkote', 'bagalkot', 'bagalkote division', 'bagalkot division'] },
  'Vijayapura': { region: 'North Karnataka Region', aliases: ['vijayapura', 'vijayapur', 'bijapur', 'vijayapura division', 'vijayapur division'] },
  'Gadag': { region: 'North Karnataka Region', aliases: ['gadag', 'gadag division'] },
  'Haveri': { region: 'North Karnataka Region', aliases: ['haveri', 'haveri division'] },
  'Ballari': { region: 'North Karnataka Region', aliases: ['ballari', 'bellary', 'ballari division', 'bellary division'] },
  'Koppal': { region: 'North Karnataka Region', aliases: ['koppal', 'koppal division'] },
  'Kalaburagi': { region: 'North Karnataka Region', aliases: ['kalaburagi', 'gulbarga', 'kalaburagi division', 'gulbarga division'] },
  'Bidar': { region: 'North Karnataka Region', aliases: ['bidar', 'bidar division'] },
  'Raichur': { region: 'North Karnataka Region', aliases: ['raichur', 'raichur division'] },
  'Karwar': { region: 'North Karnataka Region', aliases: ['karwar', 'uttara kannada', 'karwar division'] },
  'Sirsi': { region: 'North Karnataka Region', aliases: ['sirsi', 'sirsi division'] },
  'Yadgir': { region: 'North Karnataka Region', aliases: ['yadgir', 'yadagiri', 'yadgir division'] },
};

export interface PincodeEntry {
  division: string;
  region?: string;
  offices: string[];
}

// Known Pincode -> Division & Post Offices Registry (Full 1,345 Karnataka Circle Dataset)
export const PINCODE_TERRITORY_CATALOG: Record<string, PincodeEntry> = {
  ...(MASTER_PINCODE_CATALOG as Record<string, PincodeEntry>),
  // Specific known multi-office mappings
  "560092": {
    division: "BG East",
    region: "Bengaluru HQ Region",
    offices: [
      "Amruthahalli B.O",
      "Sahakarnagar S.O",
      "Hebbal Agricultural Farm S.O",
      "Kodigehalli B.O",
      "Byatarayanapura S.O"
    ]
  },
  "560001": {
    division: "BG East",
    region: "Bengaluru HQ Region",
    offices: ["Bengaluru GPO", "Raj Bhavan S.O", "Vidhana Soudha S.O"]
  },
  "560005": {
    division: "BG East",
    region: "Bengaluru HQ Region",
    offices: ["Frazer Town S.O", "Cox Town S.O"]
  },
  "560008": {
    division: "BG East",
    region: "Bengaluru HQ Region",
    offices: ["HAL II Stage S.O", "Indiranagar S.O", "Domlur S.O"]
  }
};

/**
 * Returns all pincodes belonging to a division from the full 1,345 dataset.
 */
export function getPincodesForDivision(divisionName?: string | null): string[] {
  if (!divisionName) return Object.keys(PINCODE_TERRITORY_CATALOG).sort();
  const canon = normalizeDivision(divisionName).toLowerCase();
  const raw = divisionName.toLowerCase().replace(/ division/i, '').trim();
  const pins: string[] = [];
  for (const [pin, entry] of Object.entries(PINCODE_TERRITORY_CATALOG)) {
    const entryDiv = (entry.division || '').toLowerCase();
    if (entryDiv === canon || entryDiv === raw || entryDiv.includes(raw) || raw.includes(entryDiv)) {
      pins.push(pin);
    }
  }
  return pins.sort();
}

/**
 * Returns all 1,345 pincodes sorted.
 */
export function getAllCatalogPincodes(): string[] {
  return Object.keys(PINCODE_TERRITORY_CATALOG).sort();
}

/**
 * Normalizes any variation of a division name to canonical (e.g. "bg east" -> "BG East").
 */
export function normalizeDivision(rawName?: string | null): string {
  if (!rawName) return "BG East";
  const clean = rawName.trim();
  if (KARNATAKA_TERRITORY_DIRECTORY[clean]) return clean;

  const lower = clean.toLowerCase();
  const stripped = lower.replace(/^(do|div|division)[\s_-]+/, '').replace(/[\s_-]+division$/, '').trim();

  for (const [canonical, info] of Object.entries(KARNATAKA_TERRITORY_DIRECTORY)) {
    if (canonical.toLowerCase() === lower || canonical.toLowerCase() === stripped) {
      return canonical;
    }
    for (const alias of info.aliases) {
      if (alias.toLowerCase() === lower || alias.toLowerCase() === stripped) {
        return canonical;
      }
    }
  }
  return clean;
}

/**
 * Gets the corresponding region for a division.
 */
export function getRegionForDivision(divisionName?: string | null): string {
  const canon = normalizeDivision(divisionName);
  return KARNATAKA_TERRITORY_DIRECTORY[canon]?.region || "Bengaluru HQ Region";
}

export interface ResolvedTerritory {
  division: string;
  divisionLabel: string;
  region: string;
  offices: Array<{
    raw: string;
    label: string; // e.g. "Amruthahalli B.O [BG East Division]"
    division: string;
    region: string;
  }>;
}

/**
 * Resolves territory mapping and formatted post offices by 6-digit Pincode.
 */
export function resolvePincodeTerritory(pincode: string, fallbackDiv?: string): ResolvedTerritory {
  const cleanPin = pincode ? pincode.trim().replace(/\D/g, '') : '';
  const catalogEntry = PINCODE_TERRITORY_CATALOG[cleanPin];

  let division = catalogEntry?.division || normalizeDivision(fallbackDiv) || "BG East";
  const region = catalogEntry?.region || getRegionForDivision(division);
  const divisionLabel = `${division} Division`;

  let officeNames = catalogEntry?.offices || [];
  if (officeNames.length === 0) {
    officeNames = [`Post Office - ${cleanPin || '560092'}`];
  }

  const offices = officeNames.map(name => {
    // If the name already contains [Division], keep it, else append [${division} Division]
    const label = name.includes('[') ? name : `${name} [${divisionLabel}]`;
    return {
      raw: name,
      label,
      division,
      region
    };
  });

  return {
    division,
    divisionLabel,
    region,
    offices
  };
}
