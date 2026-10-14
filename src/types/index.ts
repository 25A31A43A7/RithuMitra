export type Language = 'en' | 'te' | 'hi';

export type Persona = 'farmer' | 'operator' | 'admin';
export type UserRole = Persona;

export type CommodityId = 'paddy_grade_a' | 'paddy_common' | 'maize' | 'black_gram';

export type UnitType = 'bag' | 'qtl' | 'kg' | 'ton' | 'maund';

export interface Commodity {
  id: CommodityId;
  name: {
    en: string;
    te: string;
    hi: string;
  };
  mspPerQtl: number; // in INR
  mspPerKg: number;  // in INR
  maxMoisture: number; // in %
  icon: string;
  color: string;
}

export type CentreStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface ProcurementCentre {
  id: string;
  name: string;
  nameTe: string;
  nameHi: string;
  coords: [number, number]; // [lat, lng]
  distanceKm: number; // dynamically computed from farmer's current GPS location
  govtVerified: boolean;
  currentCapacityPct: number;
  status: CentreStatus;
  queueTimeStr: string;
  queueHours: number;
  dailyLimitTonnes: number;
  currentProcuredTonnes: number;
  acceptedCommodities: CommodityId[];
  address: string;
  contactPhone: string;
  baysCount: number;
  emergencyFull: boolean;
  region: 'rajahmundry' | 'tirupati' | 'vijayawada' | 'guntur';
}

export type VehicleType = 'Tractor-Trolley' | 'Mini-Truck' | 'Pickup Van' | 'Auto-Trolley';

export interface FarmerProfile {
  id: string;
  name: string;
  phone: string;
  village: string;
  mandal: string;
  district: string;
  khasraNumber: string; // PM-KISAN / Rythu Bharosa / Pattadar Passbook
  vehicleType: VehicleType;
  vehicleNumber: string;
  aadhaarLast4: string;
  bankName: string;
  bankAccLast4: string;
  coords: [number, number];
}

export interface UserAccount {
  id: string;
  role: UserRole;
  name: string;
  loginId: string; // phone or username ID
  password: string;
  badge: string;
  title: string;
  phone?: string;
  villageOrFacility?: string;
  khasraOrLicense?: string;
  department?: string;
  govId?: string;
  farmerProfile?: FarmerProfile;
  createdAt: string;
}

export type IntakeStatus = 'BOOKED' | 'IN_YARD' | 'GROSS_WEIGHED' | 'ASSAYED' | 'SETTLED' | 'CANCELLED';

export interface BookingRecord {
  id: string; // e.g. RM-RJY-PDY-104
  centreId: string;
  centreName: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  village: string;
  khasraNumber: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  commodityId: CommodityId;
  commodityName: string;
  inputQuantity: number;
  inputUnit: UnitType;
  // Standardized equivalents
  quintals: number;
  kg: number;
  metricTonnes: number;
  bags: number;
  maunds: number;
  estimatedPayoutInr: number;
  slotDate: string;
  slotTime: string;
  assignedBay: string;
  createdAt: string;
  status: IntakeStatus;
  
  // Operator processing
  arrivedAt?: string;
  grossWeightKg?: number;
  grossLoggedAt?: string;
  moisturePct?: number;
  moistureStatus?: 'PASS' | 'HIGH_MOISTURE_WARNING';
  tareWeightKg?: number;
  tareLoggedAt?: string;
  netWeightKg?: number;
  netQuintals?: number;
  netBags?: number;
  moistureDeductionPct?: number;
  finalPayoutInr?: number;
  dbtReferenceId?: string;
  dbtDisbursedAt?: string;
}

export interface MandalLocation {
  id: string;
  name: string;
  nameTe: string;
  coords: [number, number];
}
