import { Commodity, CommodityId, UnitType } from '../types';

export const COMMODITIES: Record<CommodityId, Commodity> = {
  paddy_grade_a: {
    id: 'paddy_grade_a',
    name: {
      en: 'Paddy / Rice (Grade A)',
      te: 'వరి / ధాన్యం (గ్రేడ్-A)',
      hi: 'धान (ग्रेड-ए / Paddy Grade A)',
    },
    mspPerQtl: 2203,
    mspPerKg: 22.03,
    maxMoisture: 17,
    icon: '🌾',
    color: 'emerald',
  },
  paddy_common: {
    id: 'paddy_common',
    name: {
      en: 'Paddy / Rice (Common)',
      te: 'సాధారణ ధాన్యం (Common)',
      hi: 'धान (सामान्य / Paddy Common)',
    },
    mspPerQtl: 2183,
    mspPerKg: 21.83,
    maxMoisture: 17,
    icon: '🌾',
    color: 'teal',
  },
  maize: {
    id: 'maize',
    name: {
      en: 'Maize / Corn (Makka)',
      te: 'మొక్కజొన్న (Maize/Makka)',
      hi: 'मक्का (Maize)',
    },
    mspPerQtl: 2090,
    mspPerKg: 20.90,
    maxMoisture: 14,
    icon: '🌽',
    color: 'amber',
  },
  black_gram: {
    id: 'black_gram',
    name: {
      en: 'Black Gram / Urad',
      te: 'మినుములు (Black Gram/Urad)',
      hi: 'उड़द (Black Gram)',
    },
    mspPerQtl: 6950,
    mspPerKg: 69.50,
    maxMoisture: 12,
    icon: '🌱',
    color: 'stone',
  },
};

export const UNIT_LABELS: Record<UnitType, { en: string; te: string; hi: string; short: string }> = {
  bag: {
    en: 'Bags / Kattalu / Bori (50 kg)',
    te: 'బస్తాలు / కట్టలు (50 kg)',
    hi: 'बोरी / बैग (50 kg)',
    short: 'bags',
  },
  qtl: {
    en: 'Quintals (qtl)',
    te: 'క్వింటాళ్ళు (qtl)',
    hi: 'क्विंटल (qtl)',
    short: 'qtl',
  },
  kg: {
    en: 'Kilograms (kg)',
    te: 'కిలోగ్రాములు (kg)',
    hi: 'किलोग्राम (kg)',
    short: 'kg',
  },
  ton: {
    en: 'Metric Tonnes (MT)',
    te: 'మెట్రిక్ టన్నులు (MT)',
    hi: 'मीट्रिक टन (MT)',
    short: 'MT',
  },
  maund: {
    en: 'Maund / Mann (40 kg)',
    te: 'మణగు (40 kg)',
    hi: 'मन / माउंड (40 kg)',
    short: 'maund',
  },
};

export interface ConvertedUnits {
  kg: number;
  qtl: number;
  ton: number;
  bag: number;
  maund: number;
}

/**
 * Converts any quantity in a given unit into all standard agricultural units.
 * Base conversions:
 * - 1 kg = 1 kg
 * - 1 Quintal (qtl) = 100 kg
 * - 1 Metric Tonne (MT) = 1,000 kg = 10 qtl
 * - 1 Standard Bag (Kattalu/Bori) = 50 kg = 0.5 qtl
 * - 1 Maund (Mann) = 40 kg = 0.4 qtl
 */
export function convertUnits(quantity: number, fromUnit: UnitType): ConvertedUnits {
  const safeQty = Math.max(0, Number(quantity) || 0);

  let baseKg = 0;
  switch (fromUnit) {
    case 'kg':
      baseKg = safeQty;
      break;
    case 'qtl':
      baseKg = safeQty * 100;
      break;
    case 'ton':
      baseKg = safeQty * 1000;
      break;
    case 'bag':
      baseKg = safeQty * 50;
      break;
    case 'maund':
      baseKg = safeQty * 40;
      break;
    default:
      baseKg = safeQty;
  }

  const qtl = Number((baseKg / 100).toFixed(2));
  const ton = Number((baseKg / 1000).toFixed(3));
  const bag = Number((baseKg / 50).toFixed(1));
  const maund = Number((baseKg / 40).toFixed(2));
  const kg = Math.round(baseKg);

  return { kg, qtl, ton, bag, maund };
}

/**
 * Formats a conversion summary string:
 * e.g. "120 Bags (50kg) ➔ Equivalent to: 60.0 Quintals | 6.0 Metric Tonnes | 6,000 kg"
 */
export function formatConversionSummary(quantity: number, unit: UnitType): string {
  const c = convertUnits(quantity, unit);
  const unitName = UNIT_LABELS[unit].short;
  return `${quantity} ${unitName} ➔ ${c.qtl} Quintals | ${c.ton} MT | ${c.kg.toLocaleString()} kg | ${c.maund} Maunds`;
}

/**
 * Calculates estimated MSP payout based on commodity and converted quintals
 */
export function calculateEstimatedPayout(commodityId: CommodityId, quintals: number): number {
  const comm = COMMODITIES[commodityId] || COMMODITIES.paddy_grade_a;
  return Math.round(quintals * comm.mspPerQtl);
}

/**
 * Calculates settlement payout based on actual net quintals and moisture penalty if applicable
 */
export function calculateSettlementPayout(
  commodityId: CommodityId,
  netWeightKg: number,
  moisturePct: number
): {
  netQuintals: number;
  netBags: number;
  basePayout: number;
  moistureDeductionPct: number;
  deductionAmount: number;
  finalPayout: number;
  moistureStatus: 'PASS' | 'HIGH_MOISTURE_WARNING';
} {
  const comm = COMMODITIES[commodityId] || COMMODITIES.paddy_grade_a;
  const netQuintals = Number((netWeightKg / 100).toFixed(2));
  const netBags = Number((netWeightKg / 50).toFixed(1));
  const basePayout = Math.round(netQuintals * comm.mspPerQtl);

  let moistureDeductionPct = 0;
  let moistureStatus: 'PASS' | 'HIGH_MOISTURE_WARNING' = 'PASS';

  if (moisturePct > comm.maxMoisture) {
    moistureStatus = 'HIGH_MOISTURE_WARNING';
    // 0.75% value deduction per 1% excess moisture beyond permissible threshold
    const excess = moisturePct - comm.maxMoisture;
    moistureDeductionPct = Number(Math.min(12, excess * 0.75).toFixed(2));
  }

  const deductionAmount = Math.round((basePayout * moistureDeductionPct) / 100);
  const finalPayout = Math.max(0, basePayout - deductionAmount);

  return {
    netQuintals,
    netBags,
    basePayout,
    moistureDeductionPct,
    deductionAmount,
    finalPayout,
    moistureStatus,
  };
}
