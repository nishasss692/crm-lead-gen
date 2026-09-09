// Karnataka Territory & Pincode Registry for India Post CRM
// Defines complete 36-division hierarchical mapping and postal office resolver.

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

// Known Pincode -> Division & Post Offices Registry
export const PINCODE_TERRITORY_CATALOG: Record<string, { division: string; offices: string[] }> = {
  // BG East Division (560092, 560001, 560005, 560008, 560016, 560017, 560024, 560025, 560032, 560033, 560038, 560042, 560043, 560045, 560048, 560064, 560066, 560071, 560075, 560077, 560080, 560094)
  "560092": {
    division: "BG East",
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
    offices: ["Bengaluru GPO", "Raj Bhavan S.O", "Vidhana Soudha S.O"]
  },
  "560005": {
    division: "BG East",
    offices: ["Frazer Town S.O", "Cox Town S.O"]
  },
  "560008": {
    division: "BG East",
    offices: ["HAL II Stage S.O", "Indiranagar S.O", "Domlur S.O"]
  },
  "560016": {
    division: "BG East",
    offices: ["Doorvaninagar S.O", "Ramamurthy Nagar S.O"]
  },
  "560017": {
    division: "BG East",
    offices: ["HAL Old Airport Road S.O", "Vimanapura S.O"]
  },
  "560024": {
    division: "BG East",
    offices: ["Hebbal S.O", "Anandnagar S.O"]
  },
  "560025": {
    division: "BG East",
    offices: ["Museum Road S.O", "Ashoknagar S.O", "Richmond Town S.O"]
  },
  "560032": {
    division: "BG East",
    offices: ["RT Nagar S.O", "Ganganagar S.O"]
  },
  "560033": {
    division: "BG East",
    offices: ["Maruthi Seva Nagar S.O", "Cooke Town S.O"]
  },
  "560038": {
    division: "BG East",
    offices: ["Indiranagar S.O", "Defence Colony S.O"]
  },
  "560042": {
    division: "BG East",
    offices: ["St. Thomas Town S.O", "Lingarajapuram S.O"]
  },
  "560043": {
    division: "BG East",
    offices: ["Banaswadi S.O", "Kalyan Nagar S.O"]
  },
  "560045": {
    division: "BG East",
    offices: ["Manyata Tech Park S.O", "Nagawara S.O"]
  },
  "560048": {
    division: "BG East",
    offices: ["Hoodi S.O", "Mahadevapura S.O"]
  },
  "560064": {
    division: "BG East",
    offices: ["Yelahanka Satellite Town S.O", "Attur B.O"]
  },
  "560066": {
    division: "BG East",
    offices: ["Whitefield S.O", "Kadugodi S.O", "Immadihalli B.O"]
  },
  "560071": {
    division: "BG East",
    offices: ["Domlur S.O", "Airport Road S.O"]
  },
  "560075": {
    division: "BG East",
    offices: ["HAL III Stage S.O", "New Thippasandra S.O"]
  },
  "560077": {
    division: "BG East",
    offices: ["Kothanur S.O", "Hennur S.O"]
  },
  "560080": {
    division: "BG East",
    offices: ["Sadashivanagar S.O", "Palace Guttahalli S.O"]
  },
  "560094": {
    division: "BG East",
    offices: ["RMV Extension II Stage S.O", "Sanjaynagar S.O"]
  },

  // BG South Division
  "560002": {
    division: "BG South",
    offices: ["Bengaluru City S.O", "Dharmaram College S.O", "Town Hall S.O"]
  },
  "560004": {
    division: "BG South",
    offices: ["Basavanagudi S.O", "Pampa Mahakavi Road S.O", "N R Colony S.O"]
  },
  "560009": {
    division: "BG South",
    offices: ["K.G. Road S.O", "Majestic S.O"]
  },
  "560011": {
    division: "BG South",
    offices: ["Jayanagar S.O", "Tilaknagar S.O"]
  },
  "560026": {
    division: "BG South",
    offices: ["Mysore Road S.O", "Kasturba Nagar S.O"]
  },
  "560027": {
    division: "BG South",
    offices: ["Lalbagh West S.O", "Sudhamanagar S.O"]
  },
  "560029": {
    division: "BG South",
    offices: ["Dharmaram College S.O", "Taverekere S.O"]
  },
  "560034": {
    division: "BG South",
    offices: ["Koramangala S.O", "St. Johns Medical College S.O", "Agara S.O"]
  },
  "560053": {
    division: "BG South",
    offices: ["Chickpet S.O", "City Market S.O"]
  },
  "560068": {
    division: "BG South",
    offices: ["Madivala S.O", "Bommanahalli S.O"]
  },
  "560070": {
    division: "BG South",
    offices: ["Banashankari II Stage S.O", "Padmanabhanagar S.O"]
  },
  "560076": {
    division: "BG South",
    offices: ["BTM 2nd Stage S.O", "Bannerghatta Road S.O"]
  },
  "560078": {
    division: "BG South",
    offices: ["JP Nagar S.O", "Sarakki S.O"]
  },
  "560082": {
    division: "BG South",
    offices: ["Jayanagar East S.O", "Yediyur S.O"]
  },
  "560085": {
    division: "BG South",
    offices: ["Banashankari 3rd Stage S.O", "Kathriguppe S.O"]
  },
  "560095": {
    division: "BG South",
    offices: ["Koramangala 4th Block S.O", "ST Bed S.O"]
  },
  "560099": {
    division: "BG South",
    offices: ["Bommasandra Industrial Estate S.O", "Hebbagodi B.O"]
  },
  "560100": {
    division: "BG South",
    offices: ["Electronic City S.O", "Konappana Agrahara S.O"]
  },
  "560105": {
    division: "BG South",
    offices: ["Austin Town S.O", "Viveknagar S.O"]
  },

  // BG West Division
  "560003": {
    division: "BG West",
    offices: ["Malleswaram S.O", "Vyalikaval S.O"]
  },
  "560010": {
    division: "BG West",
    offices: ["Rajajinagar S.O", "Industrial Estate S.O", "Prakash Nagar S.O"]
  },
  "560013": {
    division: "BG West",
    offices: ["Jalahalli S.O", "MS Ramaiah S.O"]
  },
  "560020": {
    division: "BG West",
    offices: ["Seshadripuram S.O", "Palace Guttahalli S.O"]
  },
  "560021": {
    division: "BG West",
    offices: ["Srirampuram S.O", "Dayananda Nagar S.O"]
  },
  "560022": {
    division: "BG West",
    offices: ["Yeshwanthpur Industrial Suburb S.O", "Yeshwantpur S.O"]
  },
  "560023": {
    division: "BG West",
    offices: ["Magadi Road S.O", "Binnypet S.O"]
  },
  "560040": {
    division: "BG West",
    offices: ["Vijayanagar Bengaluru S.O", "RPC Layout S.O"]
  },
  "560054": {
    division: "BG West",
    offices: ["Mathikere S.O", "Gokula S.O"]
  },
  "560057": {
    division: "BG West",
    offices: ["Peenya Dasarahalli S.O", "Jalahalli West S.O"]
  },
  "560058": {
    division: "BG West",
    offices: ["Peenya 1st Stage S.O", "Peenya Small Industries S.O"]
  },
  "560079": {
    division: "BG West",
    offices: ["Basaveshwaranagar S.O", "Kamakshipalya S.O"]
  },
  "560086": {
    division: "BG West",
    offices: ["Mahalakshmi Layout S.O", "West of Chord Road S.O"]
  },
  "560091": {
    division: "BG West",
    offices: ["Viswaneedam S.O", "Magadi Main Road S.O"]
  },
  "560097": {
    division: "BG West",
    offices: ["Vidyaranyapura S.O", "Tindlu B.O"]
  },
  "561203": {
    division: "BG West",
    offices: ["Doddaballapur S.O", "KIADB S.O"]
  },
  "562107": {
    division: "BG West",
    offices: ["Nelamangala S.O", "Arishinakunte B.O"]
  },

  // Mysuru Division
  "570001": {
    division: "Mysuru",
    offices: ["Mysuru Head Post Office", "Mysuru Fort S.O", "K R Circle S.O", "Lakshmipuram S.O"]
  },
  "570002": {
    division: "Mysuru",
    offices: ["Mysuru Fort S.O", "Agrahara S.O", "Vani Vilas Market S.O"]
  },
  "570004": {
    division: "Mysuru",
    offices: ["Nazarbad S.O", "Ittigegud S.O", "Mysuru Palace S.O"]
  },
  "570008": {
    division: "Mysuru",
    offices: ["Chamundipuram S.O", "Vidyaranyapuram S.O", "Jayanagar Mysuru S.O"]
  },
  "570009": {
    division: "Mysuru",
    offices: ["Tilaknagar S.O", "Mandi Mohalla S.O"]
  },
  "570016": {
    division: "Mysuru",
    offices: ["Belagola Industrial Area S.O", "Metagalli S.O", "Hebbal S.O"]
  },
  "570017": {
    division: "Mysuru",
    offices: ["Bannimantap S.O", "Bamboo Bazar S.O"]
  },
  "570018": {
    division: "Mysuru",
    offices: ["Hootagalli Industrial Area S.O", "Koorgalli B.O", "Belavadi S.O"]
  },
  "570019": {
    division: "Mysuru",
    offices: ["Vijayanagar S.O", "Gokulam S.O"]
  },
  "570020": {
    division: "Mysuru",
    offices: ["Kuvempunagar S.O", "Vivekanandanagar S.O"]
  },
  "570022": {
    division: "Mysuru",
    offices: ["Ramakrishnanagar S.O", "Bogadi S.O"]
  },
  "570023": {
    division: "Mysuru",
    offices: ["Saraswathipuram S.O", "Tonachikoppal S.O", "Jayalakshmipuram S.O"]
  },
  "570025": {
    division: "Mysuru",
    offices: ["Srirampura S.O", "JP Nagar Mysuru S.O"]
  },
  "570026": {
    division: "Mysuru",
    offices: ["Dattagalli S.O", "Roopa Nagar S.O"]
  },
  "570027": {
    division: "Mysuru",
    offices: ["Hebbal Industrial Area S.O", "Kumbarakoppal S.O"]
  },
  "570028": {
    division: "Mysuru",
    offices: ["Siddartha Nagar S.O", "Alanahalli S.O"]
  },
  "571114": {
    division: "Mysuru",
    offices: ["Kadakola S.O", "Thandavapura S.O"]
  },
  "571301": {
    division: "Mysuru",
    offices: ["Nanjangud S.O", "Industrial Estate Nanjangud S.O"]
  },
  "571311": {
    division: "Mysuru",
    offices: ["T Narasipura S.O", "Bannur S.O"]
  },
  "571313": {
    division: "Mysuru",
    offices: ["Chamarajanagar S.O", "Ramasamudra S.O"]
  },

  // Tumakuru Division
  "572101": {
    division: "Tumakuru",
    offices: ["Tumakuru Head Post Office", "Ashoka Road S.O"]
  },
  "572102": {
    division: "Tumakuru",
    offices: ["Siddaganga Mutt S.O", "Kyathsandra S.O"]
  },
  "572103": {
    division: "Tumakuru",
    offices: ["B H Road S.O", "Mandipet S.O"]
  },
  "572104": {
    division: "Tumakuru",
    offices: ["SSIT S.O", "Maralur S.O"]
  },
  "572106": {
    division: "Tumakuru",
    offices: ["Antharasanahalli Industrial Area S.O", "Batwadi S.O"]
  },

  // Mangaluru Division
  "575001": {
    division: "Mangaluru",
    offices: ["Mangaluru Head Post Office", "Hampankatta S.O", "Bunder S.O"]
  },
  "575002": {
    division: "Mangaluru",
    offices: ["Kankanady S.O", "Falnir S.O"]
  },
  "575003": {
    division: "Mangaluru",
    offices: ["Kodialbail S.O", "Ashoknagar Mangaluru S.O"]
  },
  "575011": {
    division: "Mangaluru",
    offices: ["Baikampady Industrial Estate S.O", "Panambur S.O"]
  },
  "575018": {
    division: "Mangaluru",
    offices: ["Surathkal S.O", "NITK S.O"]
  },

  // Udupi Division
  "576101": {
    division: "Udupi",
    offices: ["Udupi Head Post Office", "Court Road S.O"]
  },
  "574118": {
    division: "Udupi",
    offices: ["Manipal S.O", "Endpoint B.O"]
  },

  // Shivamogga Division
  "577201": {
    division: "Shivamogga",
    offices: ["Shivamogga Head Post Office", "Durgigudi S.O"]
  },
  "577204": {
    division: "Shivamogga",
    offices: ["Kallahalli S.O", "Industrial Estate Shivamogga S.O"]
  },

  // Dharwad Division
  "580001": {
    division: "Dharwad",
    offices: ["Dharwad Head Post Office", "Station Road S.O"]
  },
  "580020": {
    division: "Dharwad",
    offices: ["Hubballi Main S.O", "Durgad Bail S.O"]
  },
  "580030": {
    division: "Dharwad",
    offices: ["Vidyanagar Hubballi S.O", "Shirur Park S.O"]
  },

  // Belagavi Division
  "590001": {
    division: "Belagavi",
    offices: ["Belagavi Head Post Office", "Camp Belagavi S.O", "Khade Bazar S.O"]
  },
  "590014": {
    division: "Belagavi",
    offices: ["Machhe Industrial Area S.O", "Vadgaon S.O"]
  },
  "590016": {
    division: "Belagavi",
    offices: ["Udyambag S.O", "KIADB Belagavi S.O"]
  },

  // Kalaburagi Division
  "585101": {
    division: "Kalaburagi",
    offices: ["Kalaburagi Head Post Office", "Main Road S.O"]
  },
  "585102": {
    division: "Kalaburagi",
    offices: ["Super Market S.O", "Station Road S.O"]
  },

  // Ballari Division
  "583101": {
    division: "Ballari",
    offices: ["Ballari Head Post Office", "Brucepet S.O"]
  },
  "583104": {
    division: "Ballari",
    offices: ["Gandhi Nagar Ballari S.O", "Satyanarayanapet S.O"]
  }
};

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
  const region = getRegionForDivision(division);
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
