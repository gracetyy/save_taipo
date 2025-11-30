import { Station, SupplyStatus, NeedItem, Offering } from '../types';
import { staticStations } from './staticStations';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1W8A40TCVAY5prHNyVk-TqdSv2EumkVvN9l7LoUrY8-w/export?format=csv&gid=0';

const normalizeKey = (s: string) => s.replace(/^\d+\.?\s*/, '').replace(/\s*\(.+\)\s*$/, '').trim().toLowerCase();

// Exported sheet-level global alert; populated from a cell such as B2 in the CSV
export let sheetGlobalAlert: string | null = null;
export function getSheetGlobalAlert(): string | null { return sheetGlobalAlert; }

/* staticStations is provided by ./staticStations.ts */
// Build a normalized map for easier matching: normalizedName -> station data
const normalizedStaticStations: Record<string, any> = {};
for (const [k, v] of Object.entries(staticStations)) {
  // keep the original Chinese key as displayName for canonical station names
  normalizedStaticStations[normalizeKey(k)] = { ...v, displayName: k };
}

const ITEM_LOOKUP_TABLE: Record<string, { en: string, original?: string }> = {
  '一般義工': { en: 'General volunteers' },
  '醫護人員': { en: 'medic' },
  '社工': { en: 'social worker' },
  '車手': { en: 'driver' },
  '心理輔導員': { en: 'psychological counselor' },
  '保暖內衣': { en: 'Thermal underwear' },
  '求毛氈': { en: 'Blanket' },
  '反光錫紙': { en: 'Reflective foil' },
  '熱水': { en: 'Hot water', original: '熱水 hot water (連紙杯）' },
  '水': { en: 'Water' },
  '麵包': { en: 'Bread', original: '麵包(獨立包裝)' },
  '能量啫喱': { en: 'Energy gel' },
  '大毛巾': { en: 'Large towel', original: '(大)毛巾 towel' },
  '洗頭水': { en: 'Shampoo', original: '（細支裝為主）洗頭水 Shampoo' },
  '沐浴露': { en: 'Body wash', original: '（細支裝為主）沐浴露 body wash' },
  '垃圾袋': { en: 'Trash bag', original: '垃圾袋 trash bag' },
  '摺凳': { en: 'Folding stool', original: '摺凳 Chair' },
  '番梘': { en: 'Soap' },
  '尿袋': { en: 'Power bank', original: '尿袋/差電器/插蘇 Power Bank、Charger' },
  '照明用品': { en: 'Lighting (battery)', original: '照明用品（乾電）' },
  '差電線': { en: 'Charging cable', original: '差電線 Power Cable' },
  '床墊': { en: 'Mattress' },
  '枕頭': { en: 'Pillow' },
  '被': { en: 'Quilt/Blanket' },
  '眼罩': { en: 'Eye mask' },
  '耳塞': { en: 'Earplugs' },
  '75%支裝酒精': { en: '75% Alcohol' },
  '濕紙巾': { en: 'Wet wipes' },
  '女性用品': { en: 'Feminine hygiene products' },
  '貓狗罐頭': { en: 'Pet canned food' },
  '貓狗乾糧': { en: 'Pet dry food' },
  '寵物衣服': { en: 'Pet clothes', original: '寵物衣服、保暖用物品' },
  '藥品': { en: 'Medicine (Pet)' },
  '奶樽': { en: 'Baby bottle' },
  '奶粉': { en: 'Milk powder' },
  '尿片': { en: 'Diapers' },
  '文具': { en: 'Stationery', original: '文具 （粗marker、膠紙、界刀）' },
  '紅白藍膠袋': { en: 'Red-white-blue bag' },
  '大聲公': { en: 'Megaphone' }
};

function parseCSV(csvText: string): string[][] {
  // Robust CSV parser that supports quoted fields with embedded newlines and escaped quotes
  const rows: string[][] = [];
  let currentField = '';
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      // Handle escaped quotes inside a quoted field (""")
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row
      // If CRLF, skip the LF following CR
      if (char === '\r' && nextChar === '\n') {
        // push current field and row
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++; // skip LF
      } else {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      }
    } else {
      currentField += char;
    }
  }

  // push any last field/row
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

function mapStatus(status: string): SupplyStatus {
  const s = status || '';
  const lower = s.toLowerCase();
  if (s.startsWith('✅')) return SupplyStatus.AVAILABLE;
  if (s.startsWith('⚠️')) return SupplyStatus.LOW_STOCK;
  if (s.startsWith('‼️')) return SupplyStatus.URGENT;
  if (s.startsWith('🤨')) return SupplyStatus.NO_DATA;
  if (s.startsWith('🙅') || s.startsWith('🙅🏻')) return SupplyStatus.GOV_CONTROL;
  if (lower.includes('暫停') || lower.includes('paused')) return SupplyStatus.PAUSED;
  if (lower.includes('urgent')) return SupplyStatus.URGENT;
  if (lower.includes('low') || lower.includes('low stock')) return SupplyStatus.LOW_STOCK;
  if (lower.includes('no data')) return SupplyStatus.NO_DATA;
  return SupplyStatus.AVAILABLE; // default
}

function mapItem(itemName: string): string {
  // Check if itemName matches original in lookup
  const normalized = (itemName || '').trim();
  // Prefer exact matches first (original or key)
  for (const [key, value] of Object.entries(ITEM_LOOKUP_TABLE)) {
    const original = value.original || '';
    if (original === normalized || key === normalized) return key;
  }
  // Otherwise try to find the best partial match (longest key or original match)
  let bestMatch: string | null = null;
  for (const [key, value] of Object.entries(ITEM_LOOKUP_TABLE)) {
    const original = value.original || '';
    if ((original && normalized.includes(original)) || (key && normalized.includes(key))) {
      if (!bestMatch || key.length > bestMatch.length) {
        bestMatch = key;
      }
    }
  }
  if (bestMatch) return bestMatch;
  return itemName; // No match, show directly
}

export async function fetchSheetData(): Promise<Station[]> {
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error('Failed to fetch sheet');
    const csvText = await response.text();
    if ((import.meta as any).env && (import.meta as any).env.MODE !== 'production') console.debug('CSV Text:', csvText);
    const rows = parseCSV(csvText);
    if ((import.meta as any).env && (import.meta as any).env.MODE !== 'production') console.debug('Parsed Rows:', rows);

    const stations: Station[] = [];
    let skippedByMarker = 0;
    let skippedNoStatic = 0;
    const categories: string[] = [];
    const items: string[] = [];

    // Row 6 (index 5): categories
    // Because CSV can have variable row lengths and empty lines, perform safe checks for row existence and non-empty cells.
    if (rows[5] && rows[5].length > 2) {
      for (let i = 2; i < rows[5].length; i++) {
        const raw = rows[5][i];
        if (raw) categories.push(raw.trim());
      }
    }

    // Row 7 (index 6): items
    // Items should be parsed from the 'items' row only -- avoid accidentally pushing category group cells.
    if (rows[6] && rows[6].length > 2) {
      for (let i = 2; i < rows[6].length; i++) {
        const raw = rows[6][i];
        if (!raw) continue;
        const normalized = raw.trim();
        // Skip items that look like category headers or punctuation
        // Heuristic: a category header often contains '：' Chinese colon or '分類' or '&' connectors
        const isCategoryLike = /分類|：|&|Others|人手/.test(normalized);
        if (isCategoryLike) continue;
        items.push(mapItem(normalized));
      }
    }
    if ((import.meta as any).env && (import.meta as any).env.MODE !== 'production') console.debug('Parsed Items:', items);

    // Notification from B2 (row 1, col 1): this is a sheet-wide message
    const notification = rows[1]?.[1] || '';
    // Normalize whitespace (collapse newlines/spaces) for display
    sheetGlobalAlert = notification ? notification.replace(/\s+/g, ' ').trim() : null;

    // Build a filtered normalized static stations map from names that appear in the sheet
    const sheetNormalizedNames = new Set<string>();
    for (let i = 8; i < rows.length; i++) {
      const rawName = rows[i]?.[0]?.trim();
      if (!rawName) continue;
      const name = rawName.replace(/^ *\d+\.?\s*/, '').replace(/^\s+|\s+$/g, '').replace(/^\d+\.?\s*/, '');
      if (!name) continue;
      sheetNormalizedNames.add(normalizeKey(name));
    }

    const filteredNormalizedStaticStations: Record<string, any> = {};
    // Keep entries which appear in the sheet names (allow includes/startsWith)
    for (const [normKey, data] of Object.entries(normalizedStaticStations)) {
      // If exact name appears in sheetNormalizedNames, keep it
      if (sheetNormalizedNames.has(normKey)) {
        filteredNormalizedStaticStations[normKey] = { ...data };
        continue;
      }
      // If any sheet name contains the normalized static key, keep it
      for (const sheetKey of sheetNormalizedNames) {
        if (sheetKey.includes(normKey) || normKey.includes(sheetKey)) {
          filteredNormalizedStaticStations[normKey] = { ...data };
          break;
        }
      }
    }

    // Standardize and assign uniform IDs for filtered statics
    // Do not overwrite IDs provided by `staticStations`. If an ID is missing,
    // generate a uniform ID for consistency.
    const uniformKeyList = Object.keys(filteredNormalizedStaticStations).sort();
    uniformKeyList.forEach((k, idx) => {
      const uniformId = `s${String(idx + 1).padStart(2, '0')}`;
      if (!filteredNormalizedStaticStations[k].id) {
        filteredNormalizedStaticStations[k].id = uniformId;
      }
    });

    if ((import.meta as any).env && (import.meta as any).env.MODE !== 'production') console.debug(`Filtered static stations: ${uniformKeyList.length}`, uniformKeyList.map(k => ({ key: k, id: filteredNormalizedStaticStations[k].id })));

    // Data rows from row 9 (index 8)
    for (let i = 8; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;

      const rawName = row[0]?.trim();
      // Remove leading numbering like "15. " from name for display
      const name = rawName ? rawName.replace(/^\d+\.?\s*/, '') : rawName;
      // skip header rows, and rows that are likely status/notification (like an emoji-based status line)
      if (!name || name.includes('地點') || name.includes('更新時請寫上時間')) continue; // Skip header rows
      // Skip lines that are just status/notification headers (emoji or known keywords)
      const emojiMarkers = ['✅', '⚠️', '‼️', '🤨', '🙅', '暫停', '急需', 'Urgent', 'NO DATA'];
      if (emojiMarkers.some(m => (name as string).includes(m))) {
        // If the name contains place tokens it's probably a station name containing an urgency tag,
        // so don't skip. Otherwise it's likely a notification row.
        const placeTokens = ['地點', '中心', '街', '路', '村', '站', '屋', '樓', '大廈', '廣場', '公園', '醫院', '學校', '社區', '會堂', '大埔', '大埔區', '太和', '寶湖', '廣福'];
        const hasPlaceToken = placeTokens.some(t => (name as string).includes(t));
        if (!hasPlaceToken) {
          skippedByMarker++;
          console.warn(`Skipping non-station row detected by marker: ${name}`);
          continue;
        }
      }

      const normalizedName = normalizeKey(name || '');
      let staticData = null;
      // Try exact match in filtered normalized map first
      if (filteredNormalizedStaticStations[normalizedName]) {
        staticData = filteredNormalizedStaticStations[normalizedName];
      } else {
        // Try partial match - normalized: allow startsWith / includes / equals in lowercase
        for (const [stationKey, stationInfo] of Object.entries(filteredNormalizedStaticStations)) {
          if (
            normalizedName === stationKey ||
            normalizedName.startsWith(stationKey) ||
            stationKey.startsWith(normalizedName) ||
            normalizedName.includes(stationKey) ||
            stationKey.includes(normalizedName)
          ) {
            staticData = stationInfo;
            if ((import.meta as any).env && (import.meta as any).env.MODE !== 'production') console.debug(`Matched "${name}" with "${stationKey}"`);
            break;
          }
        }
      }

      if (!staticData) {
        // Skip stations that don't exist in our static data
        skippedNoStatic++;
        console.warn(`Skipping station not in static data: ${name}`);
        continue;
      }

      // The 'allItems' cell (col B) sometimes contains category labels and not an aggregated status.
      // Use the value only if it begins with an emoji or known status keywords; otherwise leave empty.
      const allItemsRaw = row[1]?.trim();
      const allItems = (allItemsRaw && /^(✅|⚠️|‼️|🤨|🙅|暫停|急需|Urgent|NO DATA)/.test(allItemsRaw)) ? allItemsRaw : '';
      const offerings: Offering[] = [];
      const needs: NeedItem[] = [];

      if ((import.meta as any).env && (import.meta as any).env.MODE !== 'production') console.debug(`Processing station: ${name}`, row);

      // Process item columns
      for (let j = 2; j < row.length && j - 2 < items.length; j++) {
        const status = row[j]?.trim();
        if (status) {
          const item = items[j - 2];
          const mappedStatus = mapStatus(status);
          if (mappedStatus === SupplyStatus.AVAILABLE || mappedStatus === SupplyStatus.LOW_STOCK || mappedStatus === SupplyStatus.URGENT) {
            offerings.push({ item, status: mappedStatus });
          }
          if (mappedStatus === SupplyStatus.URGENT || mappedStatus === SupplyStatus.LOW_STOCK) {
            needs.push({ item, status: mappedStatus });
          }
        }
      }
      // Do not dump offering details to console (verbosity reduced)

      // Volunteers at the end, but for now skip

      const station: Station = {
        id: staticData.id,
        // Prefer static canonical displayName when available
        name: staticData.displayName || name,
        name_en: staticData.name_en || undefined,
        address: staticData.address,
        lat: staticData.lat,
        lng: staticData.lng,
        type: staticData.type,
        organizer: staticData.organizer,
        status: allItems ? mapStatus(allItems) : SupplyStatus.NO_DATA,
        needs,
        offerings,
        lastUpdated: Date.now(),
        lastVerified: Date.now(),
        upvotes: 0,
        downvotes: 0,
        ...(staticData.contactNumber ? { contactNumber: staticData.contactNumber } : {}),
        ...(staticData.contactLink ? { contactLink: staticData.contactLink } : {}),
        ...(staticData.mapLink ? { mapLink: staticData.mapLink } : {}),
        remarks: staticData.remarks,
      };

      stations.push(station);
    }

    if ((import.meta as any).env && (import.meta as any).env.MODE !== 'production') console.debug(`Parsed ${stations.length} stations, skipped ${skippedByMarker} marker rows, ${skippedNoStatic} unknown station rows`);
    return stations;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return [];
  }
}

/**
 * Development helper: print parsed stations with offerings to dev console.
 * Attaches to window if in non-production mode for convenience.
 */
export async function debugPrintStations() {
  try {
    const stations = await fetchSheetData();
    // Print summary table and global sheet alert
    console.group('Parsed Stations from Sheet');
    if ((import.meta as any).env && (import.meta as any).env.MODE !== 'production') console.debug('Sheet global alert:', sheetGlobalAlert);
    console.table(stations.map(s => ({ id: s.id, name: s.name, type: s.type, status: s.status, offerings: s.offerings?.length ?? 0 })));
    // Print offerings detail
    stations.forEach(s => {
      console.group(`Station: ${s.id} ${s.name}`);
      // Offerings summary no longer printed to console for privacy and noise reduction
      console.groupEnd();
    });
    console.groupEnd();
  } catch (err) {
    console.error('debugPrintStations failed', err);
  }
}

// Expose a window helper in development for convenience
if (typeof window !== 'undefined' && (import.meta as any).env && (import.meta as any).env.MODE !== 'production') {
  (window as any).debugPrintStations = debugPrintStations;
}