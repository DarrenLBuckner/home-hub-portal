/**
 * Known Guyana neighborhoods and areas for location detection.
 * Used to scan property titles/descriptions and suggest neighborhoods
 * when agents leave the field blank.
 *
 * Format: { name: display name, aliases: alternate spellings/references, area: parent area }
 */

export interface GuyanaNeighborhood {
  name: string;
  aliases: string[];
  area: string;
}

export const GUYANA_NEIGHBORHOODS: GuyanaNeighborhood[] = [
  // Georgetown neighborhoods
  { name: 'Kitty', aliases: ['kitty'], area: 'Georgetown' },
  { name: 'Campbellville', aliases: ['campbellville', 'campbell ville'], area: 'Georgetown' },
  { name: 'Albertown', aliases: ['albertown', 'albert town'], area: 'Georgetown' },
  { name: 'Queenstown', aliases: ['queenstown', 'queens town'], area: 'Georgetown' },
  { name: 'Bourda', aliases: ['bourda', 'cricket club'], area: 'Georgetown' },
  { name: 'Lacytown', aliases: ['lacytown', 'lacy town'], area: 'Georgetown' },
  { name: 'Subryanville', aliases: ['subryanville'], area: 'Georgetown' },
  { name: 'Bel Air Park', aliases: ['bel air', 'bel air park', 'belair'], area: 'Georgetown' },
  { name: 'Prashad Nagar', aliases: ['prashad nagar', 'prashad'], area: 'Georgetown' },
  { name: 'Lamaha Gardens', aliases: ['lamaha gardens', 'lamaha'], area: 'Georgetown' },
  { name: 'Cummings Lodge', aliases: ['cummings lodge', 'cummings'], area: 'Georgetown' },
  { name: 'South Ruimveldt', aliases: ['south ruimveldt', 'ruimveldt'], area: 'Georgetown' },
  { name: 'North Ruimveldt', aliases: ['north ruimveldt'], area: 'Georgetown' },
  { name: 'Lodge', aliases: ['lodge'], area: 'Georgetown' },
  { name: 'Newtown', aliases: ['newtown', 'new town kitty'], area: 'Georgetown' },
  { name: 'Stabroek', aliases: ['stabroek'], area: 'Georgetown' },
  { name: 'Werk-en-Rust', aliases: ['werk-en-rust', 'werk en rust'], area: 'Georgetown' },
  { name: 'Wortmanville', aliases: ['wortmanville'], area: 'Georgetown' },
  { name: 'Kingston', aliases: ['kingston georgetown'], area: 'Georgetown' },
  { name: 'Cummingsburg', aliases: ['cummingsburg'], area: 'Georgetown' },
  { name: 'Roxanne Burnham Gardens', aliases: ['roxanne burnham', 'burnham gardens'], area: 'Georgetown' },
  { name: 'Festival City', aliases: ['festival city'], area: 'Georgetown' },
  { name: 'Turkeyen', aliases: ['turkeyen'], area: 'Georgetown' },
  { name: 'University Gardens', aliases: ['university gardens'], area: 'Georgetown' },
  { name: 'Atlantic Gardens', aliases: ['atlantic gardens'], area: 'Georgetown' },
  { name: 'Nandy Park', aliases: ['nandy park'], area: 'Georgetown' },

  // East Bank Demerara
  { name: 'Providence', aliases: ['providence'], area: 'East Bank Demerara' },
  { name: 'Eccles', aliases: ['eccles'], area: 'East Bank Demerara' },
  { name: 'Diamond', aliases: ['diamond'], area: 'East Bank Demerara' },
  { name: 'Grove', aliases: ['grove'], area: 'East Bank Demerara' },
  { name: 'Herstelling', aliases: ['herstelling'], area: 'East Bank Demerara' },
  { name: 'Peter\'s Hall', aliases: ['peters hall', 'peter\'s hall'], area: 'East Bank Demerara' },
  { name: 'Farm', aliases: ['farm east bank'], area: 'East Bank Demerara' },
  { name: 'Houston', aliases: ['houston'], area: 'East Bank Demerara' },
  { name: 'Prospect', aliases: ['prospect'], area: 'East Bank Demerara' },
  { name: 'Timehri', aliases: ['timehri'], area: 'East Bank Demerara' },
  { name: 'Soesdyke', aliases: ['soesdyke'], area: 'East Bank Demerara' },
  { name: 'Land of Canaan', aliases: ['land of canaan', 'canaan'], area: 'East Bank Demerara' },
  { name: 'Richmondville', aliases: ['richmondville'], area: 'East Bank Demerara' },
  { name: 'Craig', aliases: ['craig'], area: 'East Bank Demerara' },

  // East Coast Demerara
  { name: 'Ogle', aliases: ['ogle'], area: 'East Coast Demerara' },
  { name: 'Plaisance', aliases: ['plaisance'], area: 'East Coast Demerara' },
  { name: 'Beterverwagting', aliases: ['beterverwagting', 'bv'], area: 'East Coast Demerara' },
  { name: 'Triumph', aliases: ['triumph'], area: 'East Coast Demerara' },
  { name: 'Mon Repos', aliases: ['mon repos'], area: 'East Coast Demerara' },
  { name: 'Lusignan', aliases: ['lusignan'], area: 'East Coast Demerara' },
  { name: 'Enmore', aliases: ['enmore'], area: 'East Coast Demerara' },
  { name: 'Good Hope', aliases: ['good hope'], area: 'East Coast Demerara' },
  { name: 'Buxton', aliases: ['buxton'], area: 'East Coast Demerara' },
  { name: 'Annandale', aliases: ['annandale'], area: 'East Coast Demerara' },
  { name: 'Strathspey', aliases: ['strathspey'], area: 'East Coast Demerara' },
  { name: 'Enterprise', aliases: ['enterprise ecd'], area: 'East Coast Demerara' },
  { name: 'Mahaica', aliases: ['mahaica'], area: 'East Coast Demerara' },
  { name: 'Chateau Margot', aliases: ['chateau margot'], area: 'East Coast Demerara' },
  { name: 'Sophia', aliases: ['sophia'], area: 'East Coast Demerara' },
  { name: 'Liliendaal', aliases: ['liliendaal'], area: 'East Coast Demerara' },

  // West Coast Demerara / West Bank
  { name: 'Vreed-en-Hoop', aliases: ['vreed en hoop', 'vreed-en-hoop'], area: 'West Coast Demerara' },
  { name: 'Wales', aliases: ['wales'], area: 'West Coast Demerara' },
  { name: 'Leonora', aliases: ['leonora'], area: 'West Coast Demerara' },
  { name: 'Tuschen', aliases: ['tuschen'], area: 'West Coast Demerara' },
  { name: 'Parika', aliases: ['parika'], area: 'West Coast Demerara' },
  { name: 'Schoonord', aliases: ['schoonord'], area: 'West Coast Demerara' },
  { name: 'La Grange', aliases: ['la grange'], area: 'West Coast Demerara' },
  { name: 'Zeeburg', aliases: ['zeeburg'], area: 'West Coast Demerara' },

  // Berbice
  { name: 'New Amsterdam', aliases: ['new amsterdam'], area: 'Berbice' },
  { name: 'Rose Hall', aliases: ['rose hall'], area: 'Berbice' },
  { name: 'Corriverton', aliases: ['corriverton'], area: 'Berbice' },
  { name: 'Skeldon', aliases: ['skeldon'], area: 'Berbice' },
  { name: 'Port Mourant', aliases: ['port mourant'], area: 'Berbice' },
  { name: 'Albion', aliases: ['albion'], area: 'Berbice' },
  { name: 'Springlands', aliases: ['springlands'], area: 'Berbice' },

  // Other major areas
  { name: 'Linden', aliases: ['linden'], area: 'Upper Demerara' },
  { name: 'Bartica', aliases: ['bartica'], area: 'Cuyuni-Mazaruni' },
  { name: 'Anna Regina', aliases: ['anna regina'], area: 'Essequibo Coast' },
  { name: 'Charity', aliases: ['charity'], area: 'Pomeroon-Supenaam' },
  { name: 'Lethem', aliases: ['lethem'], area: 'Rupununi' },
  { name: 'Mabaruma', aliases: ['mabaruma'], area: 'Barima-Waini' },
];

/**
 * Scan text (title + description) for known neighborhood references.
 * Returns matches sorted by specificity (longer alias matches first).
 */
export function detectNeighborhoods(text: string): GuyanaNeighborhood[] {
  if (!text || text.trim().length < 3) return [];

  const lower = text.toLowerCase();
  const matches: GuyanaNeighborhood[] = [];
  const seen = new Set<string>();

  for (const hood of GUYANA_NEIGHBORHOODS) {
    if (seen.has(hood.name)) continue;

    // Check all aliases (which include the lowercase version of the name)
    const found = hood.aliases.some(alias => {
      // Word boundary check — avoid partial matches (e.g., "lodge" inside "cummings lodge")
      const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(lower);
    });

    if (found) {
      matches.push(hood);
      seen.add(hood.name);
    }
  }

  // Sort by name length descending — more specific matches first
  return matches.sort((a, b) => b.name.length - a.name.length);
}
