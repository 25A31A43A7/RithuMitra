import { ProcurementCentre, FarmerProfile, BookingRecord, UserAccount, MandalLocation } from '../types';

const CENTRES_KEY = 'rythumitra_centres_v4';
const BOOKINGS_KEY = 'rythumitra_bookings_v4';
const PROFILES_KEY = 'rythumitra_profiles_v4';
const ACTIVE_PROFILE_KEY = 'rythumitra_active_profile_v4';
const USERS_KEY = 'rythumitra_users_v4';
const AUTH_SESSION_KEY = 'rythumitra_auth_session_v4';
const USER_LOCATION_KEY = 'rythumitra_user_coords_v4';

export interface QuickCity {
  id: string;
  name: string;
  nameTe: string;
  coords: [number, number];
  region: 'rajahmundry' | 'tirupati' | 'vijayawada' | 'guntur';
  aliases: string[];
}

export const QUICK_CITIES: QuickCity[] = [
  {
    id: 'rajahmundry',
    name: 'Rajahmundry',
    nameTe: 'రాజమండ్రి',
    coords: [17.0005, 81.8040],
    region: 'rajahmundry',
    aliases: ['rajahmundry', 'rajamahendravaram', '533101', '533102', '533103', '533104', '533105', 'kadiyam', 'morampudi', 'dowleswaram', 'rajanagaram', 'east godavari'],
  },
  {
    id: 'tirupati',
    name: 'Tirupati',
    nameTe: 'తిరుపతి',
    coords: [13.6288, 79.4192],
    region: 'tirupati',
    aliases: ['tirupati', '517501', '517502', '517507', 'renigunta', 'chandragiri', 'srikalahasti', 'chittoor', 'rayalaseema'],
  },
  {
    id: 'vijayawada',
    name: 'Vijayawada',
    nameTe: 'విజయవాడ',
    coords: [16.5062, 80.6480],
    region: 'vijayawada',
    aliases: ['vijayawada', 'bezawada', '520001', '520002', '520010', 'gollapudi', 'gannavaram', 'krishna', 'ntr'],
  },
  {
    id: 'guntur',
    name: 'Guntur',
    nameTe: 'గుంటూరు',
    coords: [16.3067, 80.4365],
    region: 'guntur',
    aliases: ['guntur', '522001', '522002', '522004', 'tenali', 'amaravati', 'mangalagiri'],
  },
];

export const MANDAL_LOCATIONS: MandalLocation[] = [
  {
    id: 'rajahmundry-urban',
    name: 'Rajahmundry Urban / Central',
    nameTe: 'రాజమండ్రి అర్బన్ / సెంట్రల్',
    coords: [17.0005, 81.8040],
  },
  {
    id: 'kadiyam',
    name: 'Kadiyam Mandal & Nursery Belt',
    nameTe: 'కడియం మండలం & నర్సరీ జోన్',
    coords: [16.9150, 81.8350],
  },
  {
    id: 'morampudi',
    name: 'Morampudi Agricultural Zone',
    nameTe: 'మోరంపూడి వ్యవసాయ ప్రాంతం',
    coords: [17.0260, 81.8190],
  },
  {
    id: 'rajanagaram',
    name: 'Rajanagaram Agro Hub',
    nameTe: 'రాజానగరం ఆగ్రో హబ్',
    coords: [17.0850, 81.9050],
  },
  {
    id: 'dowleswaram',
    name: 'Dowleswaram / Barrage Belt',
    nameTe: 'ధవళేశ్వరం / బ్యారేజ్ బెల్ట్',
    coords: [16.9400, 81.7700],
  },
  {
    id: 'tirupati-renigunta',
    name: 'Tirupati / Renigunta Agro Zone',
    nameTe: 'తిరుపతి / రేణిగుంట జోన్',
    coords: [13.6350, 79.4280],
  },
  {
    id: 'chandragiri',
    name: 'Chandragiri Farmers Belt',
    nameTe: 'చంద్రగిరి వ్యవసాయ బెల్ట్',
    coords: [13.5850, 79.3190],
  },
  {
    id: 'gollapudi',
    name: 'Gollapudi / Vijayawada Mandi Hub',
    nameTe: 'గొల్లపూడి / విజయవాడ మార్కెట్',
    coords: [16.5360, 80.5980],
  },
  {
    id: 'guntur-mandi',
    name: 'Guntur Central Mandi Yard',
    nameTe: 'గుంటూరు ప్రధాన మార్కెట్ యార్డ్',
    coords: [16.3120, 80.4480],
  },
];

export const RAJAHMUNDRY_DEFAULT_COORDS: [number, number] = [17.0005, 81.8040];

export const DEMO_USERS: UserAccount[] = [
  {
    id: 'user-demo-farmer',
    role: 'farmer',
    name: 'Ravi Kumar (Rajahmundry)',
    loginId: '9876543210',
    password: 'farmer@123',
    badge: 'Paddy & Maize Farmer (East Godavari)',
    title: 'Rythu Bharosa Holder · Passbook: AP-EG-RYT-9941',
    phone: '9876543210',
    villageOrFacility: 'Katheru, Rajahmundry Rural',
    khasraOrLicense: 'KH-8841/B',
    farmerProfile: {
      id: 'farmer-ravi',
      name: 'Ravi Kumar',
      phone: '9876543210',
      village: 'Katheru Village',
      mandal: 'Rajahmundry Rural',
      district: 'East Godavari',
      khasraNumber: 'AP-EG-RYT-9941',
      vehicleType: 'Tractor-Trolley',
      vehicleNumber: 'AP-05-TR-4912',
      aadhaarLast4: '7192',
      bankName: 'Andhra Pragathi Grameena Bank (Rajahmundry)',
      bankAccLast4: '3819',
      coords: [17.0005, 81.8040],
    },
    createdAt: '2026-10-14T00:00:00Z',
  },
  {
    id: 'user-demo-operator',
    role: 'operator',
    name: 'B. Srinivas (APMC Rajahmundry)',
    loginId: 'depot_rajahmundry',
    password: 'depot@123',
    badge: 'Weighbridge & Yard Operator (APMC Central Market Yard)',
    title: 'Senior Mandi Yard Superintendent · Rajahmundry',
    villageOrFacility: 'Rajamahendravaram APMC Central Market Yard',
    khasraOrLicense: 'APMC-EG-RJY-2026',
    createdAt: '2026-10-14T00:00:00Z',
  },
  {
    id: 'user-demo-admin',
    role: 'admin',
    name: 'Dr. M. Venkat, Joint Director',
    loginId: 'admin_eastgodavari',
    password: 'admin@123',
    badge: 'District Agriculture & Civil Supplies Authority',
    title: 'Joint Director of Agriculture · East Godavari District',
    department: 'Dept. of Agriculture, East Godavari (Kakinada / RJY)',
    govId: 'GOV-AP-AGRI-EG-01',
    createdAt: '2026-10-14T00:00:00Z',
  },
];

export const INITIAL_CENTRES: ProcurementCentre[] = [
  // --- RAJAHMUNDRY / EAST GODAVARI ---
  {
    id: 'centre-apmc-rjy',
    name: 'Rajamahendravaram APMC Central Market Yard',
    nameTe: 'రాజమహేంద్రవరం APMC సెంట్రల్ మార్కెట్ యార్డ్',
    nameHi: 'राजमहेंद्रवरम एपीएमसी सेंट्रल मार्केट यार्ड',
    coords: [17.0125, 81.7920],
    distanceKm: 2.1,
    govtVerified: true,
    currentCapacityPct: 94,
    status: 'RED',
    queueTimeStr: '~5.5 hrs',
    queueHours: 5.5,
    dailyLimitTonnes: 500,
    currentProcuredTonnes: 470,
    acceptedCommodities: ['paddy_grade_a', 'paddy_common', 'maize', 'black_gram'],
    address: 'Near Old Bus Stand Bypass, Kotipalli Road, Rajahmundry',
    contactPhone: '+91 883 2445101',
    baysCount: 6,
    emergencyFull: false,
    region: 'rajahmundry',
  },
  {
    id: 'centre-kadiyam-pacs',
    name: 'Kadiyam Rythu Bharosa Kendra / PACS Depot',
    nameTe: 'కడియం రైతు భరోసా కేంద్రం / PACS డిపో',
    nameHi: 'कडियम रायथु भरोसा केंद्र / पैक्स डिपो',
    coords: [16.9210, 81.8310],
    distanceKm: 8.2,
    govtVerified: true,
    currentCapacityPct: 32,
    status: 'GREEN',
    queueTimeStr: '~20 mins',
    queueHours: 0.33,
    dailyLimitTonnes: 350,
    currentProcuredTonnes: 112,
    acceptedCommodities: ['paddy_grade_a', 'paddy_common', 'maize'],
    address: 'National Highway 16 Link, Kadiyam Mandal Center',
    contactPhone: '+91 883 2478900',
    baysCount: 4,
    emergencyFull: false,
    region: 'rajahmundry',
  },
  {
    id: 'centre-morampudi-hub',
    name: 'Morampudi Farmers Cooperative Procurement Hub',
    nameTe: 'మోరంపూడి రైతు సహకార కొనుగోలు కేంద్రం',
    nameHi: 'मोरामपुडी किसान सहकारी खरीद केंद्र',
    coords: [17.0250, 81.8210],
    distanceKm: 3.4,
    govtVerified: false,
    currentCapacityPct: 76,
    status: 'YELLOW',
    queueTimeStr: '~2.5 hrs',
    queueHours: 2.5,
    dailyLimitTonnes: 200,
    currentProcuredTonnes: 152,
    acceptedCommodities: ['paddy_grade_a', 'black_gram'],
    address: 'Morampudi Junction, East Godavari Agro Corridor',
    contactPhone: '+91 883 2490112',
    baysCount: 3,
    emergencyFull: false,
    region: 'rajahmundry',
  },

  // --- TIRUPATI / RAYALASEEMA ---
  {
    id: 'centre-tirupati-apmc',
    name: 'Tirupati APMC Mandi Yard Central (Renigunta)',
    nameTe: 'తిరుపతి APMC మార్కెట్ యార్డ్ (రేణిగుంట రోడ్డు)',
    nameHi: 'तिरुपति एपीएमसी मंडी यार्ड सेंट्रल',
    coords: [13.6350, 79.4280],
    distanceKm: 3.5,
    govtVerified: true,
    currentCapacityPct: 92,
    status: 'RED',
    queueTimeStr: '~5.0 hrs',
    queueHours: 5.0,
    dailyLimitTonnes: 400,
    currentProcuredTonnes: 368,
    acceptedCommodities: ['paddy_grade_a', 'paddy_common', 'maize', 'black_gram'],
    address: 'Renigunta Road Industrial Bypass, Tirupati',
    contactPhone: '+91 877 2289101',
    baysCount: 5,
    emergencyFull: false,
    region: 'tirupati',
  },
  {
    id: 'centre-chandragiri-pacs',
    name: 'Chandragiri Rythu Seva Kendram Depot (Rayalaseema PACS)',
    nameTe: 'చంద్రగిరి రైతు సేవా కేంద్రం డిపో (రాయలసీమ PACS)',
    nameHi: 'चंद्रगिरि किसान सेवा केंद्र (रायలసీమ पैक्स)',
    coords: [13.5850, 79.3190],
    distanceKm: 9.8,
    govtVerified: true,
    currentCapacityPct: 28,
    status: 'GREEN',
    queueTimeStr: '~15 mins',
    queueHours: 0.25,
    dailyLimitTonnes: 300,
    currentProcuredTonnes: 84,
    acceptedCommodities: ['paddy_grade_a', 'maize', 'black_gram'],
    address: 'Chandragiri Main Bypass Road, Chittoor Highway',
    contactPhone: '+91 877 2294400',
    baysCount: 4,
    emergencyFull: false,
    region: 'tirupati',
  },
  {
    id: 'centre-srikalahasti-hub',
    name: 'Sri Kalahasti Cooperative Agro Yard',
    nameTe: 'శ్రీకాళహస్తి సహకార అగ్రికల్చర్ యార్డ్',
    nameHi: 'श्री कालहस्ती कृषि केंद्र',
    coords: [13.7500, 79.7000],
    distanceKm: 14.2,
    govtVerified: false,
    currentCapacityPct: 65,
    status: 'YELLOW',
    queueTimeStr: '~2.0 hrs',
    queueHours: 2.0,
    dailyLimitTonnes: 250,
    currentProcuredTonnes: 162,
    acceptedCommodities: ['paddy_grade_a', 'black_gram'],
    address: 'Swarnamukhi River Bank Agro Zone, Srikalahasti',
    contactPhone: '+91 877 2241199',
    baysCount: 3,
    emergencyFull: false,
    region: 'tirupati',
  },

  // --- VIJAYAWADA / KRISHNA ---
  {
    id: 'centre-vijayawada-apmc',
    name: 'Gollapudi APMC Agricultural Market Yard',
    nameTe: 'గొల్లపూడి APMC మార్కెట్ యార్డ్ (విజయవాడ)',
    nameHi: 'गोल्लापुडी एपीएमसी कृषि बाजार यार्ड',
    coords: [16.5360, 80.5980],
    distanceKm: 4.8,
    govtVerified: true,
    currentCapacityPct: 88,
    status: 'RED',
    queueTimeStr: '~4.5 hrs',
    queueHours: 4.5,
    dailyLimitTonnes: 600,
    currentProcuredTonnes: 528,
    acceptedCommodities: ['paddy_grade_a', 'paddy_common', 'maize', 'black_gram'],
    address: 'National Highway 65, Gollapudi, Vijayawada Rural',
    contactPhone: '+91 866 2419020',
    baysCount: 8,
    emergencyFull: false,
    region: 'vijayawada',
  },
  {
    id: 'centre-gannavaram-pacs',
    name: 'Gannavaram Rythu Bharosa PACS Hub',
    nameTe: 'గన్నవరం రైతు భరోసా PACS హబ్',
    nameHi: 'गन्नवरम रायथु भरोसा केंद्र',
    coords: [16.5410, 80.7980],
    distanceKm: 12.5,
    govtVerified: true,
    currentCapacityPct: 30,
    status: 'GREEN',
    queueTimeStr: '~25 mins',
    queueHours: 0.4,
    dailyLimitTonnes: 350,
    currentProcuredTonnes: 105,
    acceptedCommodities: ['paddy_grade_a', 'maize'],
    address: 'Airport Bypass Road, Gannavaram',
    contactPhone: '+91 866 2451100',
    baysCount: 4,
    emergencyFull: false,
    region: 'vijayawada',
  },

  // --- GUNTUR ---
  {
    id: 'centre-guntur-yard',
    name: 'Guntur Central Agricultural & Grain Yard',
    nameTe: 'గుంటూరు సెంట్రల్ అగ్రికల్చరల్ యార్డ్',
    nameHi: 'गुंटूर सेंट्रल कृषि यार्ड',
    coords: [16.3120, 80.4480],
    distanceKm: 3.2,
    govtVerified: true,
    currentCapacityPct: 95,
    status: 'RED',
    queueTimeStr: '~6.0 hrs',
    queueHours: 6.0,
    dailyLimitTonnes: 700,
    currentProcuredTonnes: 665,
    acceptedCommodities: ['paddy_grade_a', 'paddy_common', 'maize', 'black_gram'],
    address: 'GT Road Bypass, Central Mandi Zone, Guntur',
    contactPhone: '+91 863 2221440',
    baysCount: 8,
    emergencyFull: false,
    region: 'guntur',
  },
  {
    id: 'centre-tenali-pacs',
    name: 'Tenali Farmers Cooperative Procurement Hub',
    nameTe: 'తెనాలి రైతు సహకార కొనుగోలు కేంద్రం',
    nameHi: 'तेनाली किसान सहकारी खरीद केंद्र',
    coords: [16.2420, 80.6450],
    distanceKm: 11.0,
    govtVerified: true,
    currentCapacityPct: 35,
    status: 'GREEN',
    queueTimeStr: '~20 mins',
    queueHours: 0.33,
    dailyLimitTonnes: 320,
    currentProcuredTonnes: 112,
    acceptedCommodities: ['paddy_grade_a', 'maize'],
    address: 'Chenchu Peta Road, Tenali Rural Belt',
    contactPhone: '+91 863 2289900',
    baysCount: 4,
    emergencyFull: false,
    region: 'guntur',
  },
];

export const INITIAL_PROFILES: FarmerProfile[] = [
  {
    id: 'farmer-ravi',
    name: 'Ravi Kumar',
    phone: '9876543210',
    village: 'Katheru Village',
    mandal: 'Rajahmundry Rural',
    district: 'East Godavari',
    khasraNumber: 'AP-EG-RYT-9941',
    vehicleType: 'Tractor-Trolley',
    vehicleNumber: 'AP-05-TR-4912',
    aadhaarLast4: '7192',
    bankName: 'Andhra Pragathi Grameena Bank (Rajahmundry)',
    bankAccLast4: '3819',
    coords: [17.0005, 81.8040],
  },
  {
    id: 'farmer-satyanarayana',
    name: 'K. Satyanarayana',
    phone: '9848012345',
    village: 'Veerabhadra Puram',
    mandal: 'Kadiyam',
    district: 'East Godavari',
    khasraNumber: 'AP-EG-RYT-4412',
    vehicleType: 'Mini-Truck',
    vehicleNumber: 'AP-05-MT-7710',
    aadhaarLast4: '5521',
    bankName: 'State Bank of India (Kadiyam)',
    bankAccLast4: '1092',
    coords: [16.9180, 81.8320],
  },
  {
    id: 'farmer-lakshmi',
    name: 'M. Lakshmi Devi',
    phone: '9440187654',
    village: 'Dowleswaram West',
    mandal: 'Dowleswaram',
    district: 'East Godavari',
    khasraNumber: 'AP-EG-RYT-7701',
    vehicleType: 'Pickup Van',
    vehicleNumber: 'AP-05-PK-2290',
    aadhaarLast4: '9934',
    bankName: 'Canara Bank (Dowleswaram)',
    bankAccLast4: '4481',
    coords: [16.9420, 81.7750],
  },
];

export const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: 'RM-RJY-PDY-104',
    centreId: 'centre-apmc-rjy',
    centreName: 'Rajamahendravaram APMC Central Market Yard',
    farmerId: 'farmer-ravi',
    farmerName: 'Ravi Kumar',
    farmerPhone: '9876543210',
    village: 'Katheru Village, Rajahmundry',
    khasraNumber: 'AP-EG-RYT-9941',
    vehicleType: 'Tractor-Trolley',
    vehicleNumber: 'AP-05-TR-4912',
    commodityId: 'paddy_grade_a',
    commodityName: 'Paddy / Rice (Grade A)',
    inputQuantity: 120,
    inputUnit: 'bag',
    quintals: 60,
    kg: 6000,
    metricTonnes: 6,
    bags: 120,
    maunds: 150,
    estimatedPayoutInr: 132180,
    slotDate: 'Today (14 Oct)',
    slotTime: '10:00 - 12:00 PM',
    assignedBay: 'Bay 2 (Paddy Scale)',
    createdAt: '2026-10-14T07:15:00Z',
    status: 'BOOKED',
  },
  {
    id: 'RM-RJY-MZ-208',
    centreId: 'centre-kadiyam-pacs',
    centreName: 'Kadiyam Rythu Bharosa Kendra / PACS Depot',
    farmerId: 'farmer-satyanarayana',
    farmerName: 'K. Satyanarayana',
    farmerPhone: '9848012345',
    village: 'Veerabhadra Puram, Kadiyam',
    khasraNumber: 'AP-EG-RYT-4412',
    vehicleType: 'Mini-Truck',
    vehicleNumber: 'AP-05-MT-7710',
    commodityId: 'maize',
    commodityName: 'Maize / Corn (Makka)',
    inputQuantity: 80,
    inputUnit: 'qtl',
    quintals: 80,
    kg: 8000,
    metricTonnes: 8,
    bags: 160,
    maunds: 200,
    estimatedPayoutInr: 167200,
    slotDate: 'Today (14 Oct)',
    slotTime: '08:00 - 10:00 AM',
    assignedBay: 'Bay 1 (Fast-Lane)',
    createdAt: '2026-10-14T06:30:00Z',
    status: 'IN_YARD',
    arrivedAt: '2026-10-14T08:14:00Z',
  },
  {
    id: 'RM-RJY-BG-315',
    centreId: 'centre-kadiyam-pacs',
    centreName: 'Kadiyam Rythu Bharosa Kendra / PACS Depot',
    farmerId: 'farmer-lakshmi',
    farmerName: 'M. Lakshmi Devi',
    farmerPhone: '9440187654',
    village: 'Dowleswaram West',
    khasraNumber: 'AP-EG-RYT-7701',
    vehicleType: 'Pickup Van',
    vehicleNumber: 'AP-05-PK-2290',
    commodityId: 'black_gram',
    commodityName: 'Black Gram / Urad',
    inputQuantity: 40,
    inputUnit: 'bag',
    quintals: 20,
    kg: 2000,
    metricTonnes: 2,
    bags: 40,
    maunds: 50,
    estimatedPayoutInr: 139000,
    slotDate: 'Today (14 Oct)',
    slotTime: '08:00 - 10:00 AM',
    assignedBay: 'Bay 3',
    createdAt: '2026-10-14T05:45:00Z',
    status: 'SETTLED',
    arrivedAt: '2026-10-14T07:45:00Z',
    grossWeightKg: 4980,
    grossLoggedAt: '2026-10-14T08:00:00Z',
    moisturePct: 11.2,
    moistureStatus: 'PASS',
    tareWeightKg: 2980,
    tareLoggedAt: '2026-10-14T08:25:00Z',
    netWeightKg: 2000,
    netQuintals: 20,
    netBags: 40,
    moistureDeductionPct: 0,
    finalPayoutInr: 139000,
    dbtReferenceId: 'DBT-AP-EG-20261014-9941',
    dbtDisbursedAt: '2026-10-14T08:28:00Z',
  },
];

export function getUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS));
      return DEMO_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_USERS;
  }
}

export function saveUsers(users: UserAccount[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event('farmgain_storage_change'));
}

export function getCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserAccount | null): void {
  if (user) {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
  window.dispatchEvent(new Event('farmgain_auth_change'));
  window.dispatchEvent(new Event('farmgain_storage_change'));
}

export function registerUser(newUser: UserAccount): UserAccount {
  const users = getUsers();
  const existingIndex = users.findIndex((u) => u.loginId.toLowerCase() === newUser.loginId.toLowerCase());
  let updatedUsers: UserAccount[];
  if (existingIndex >= 0) {
    updatedUsers = [...users];
    updatedUsers[existingIndex] = newUser;
  } else {
    updatedUsers = [newUser, ...users];
  }
  saveUsers(updatedUsers);

  if (newUser.role === 'farmer' && newUser.farmerProfile) {
    const profiles = getProfiles();
    const pIndex = profiles.findIndex((p) => p.id === newUser.farmerProfile!.id);
    if (pIndex >= 0) {
      profiles[pIndex] = newUser.farmerProfile;
    } else {
      profiles.unshift(newUser.farmerProfile);
    }
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    setActiveProfile(newUser.farmerProfile.id);
  }

  setCurrentUser(newUser);
  return newUser;
}

export function authenticateUser(loginId: string, password: string): UserAccount | null {
  const users = getUsers();
  const cleanId = loginId.trim().toLowerCase();
  const found = users.find(
    (u) => u.loginId.toLowerCase() === cleanId && u.password === password
  );
  if (found) {
    setCurrentUser(found);
    if (found.role === 'farmer' && found.farmerProfile) {
      setActiveProfile(found.farmerProfile.id);
    }
    return found;
  }
  return null;
}

export function logoutUser(): void {
  setCurrentUser(null);
}

export function getCentres(): ProcurementCentre[] {
  try {
    const raw = localStorage.getItem(CENTRES_KEY);
    if (!raw) {
      localStorage.setItem(CENTRES_KEY, JSON.stringify(INITIAL_CENTRES));
      return INITIAL_CENTRES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CENTRES;
  }
}

export function saveCentres(centres: ProcurementCentre[]): void {
  localStorage.setItem(CENTRES_KEY, JSON.stringify(centres));
  window.dispatchEvent(new Event('farmgain_storage_change'));
}

export function getBookings(): BookingRecord[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (!raw) {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BOOKINGS;
  }
}

export function saveBookings(bookings: BookingRecord[]): void {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  window.dispatchEvent(new Event('farmgain_storage_change'));
}

export function addBooking(booking: BookingRecord): void {
  const current = getBookings();
  const updated = [booking, ...current];
  saveBookings(updated);
}

export function updateBooking(updatedBooking: BookingRecord): void {
  const current = getBookings();
  const next = current.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
  saveBookings(next);
}

export function getProfiles(): FarmerProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(INITIAL_PROFILES));
      return INITIAL_PROFILES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PROFILES;
  }
}

export function getActiveProfile(): FarmerProfile {
  const profiles = getProfiles();
  try {
    const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (activeId) {
      const match = profiles.find((p) => p.id === activeId);
      if (match) return match;
    }
  } catch {
    // fallback
  }
  return profiles[0];
}

export function setActiveProfile(profileId: string): void {
  localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  window.dispatchEvent(new Event('farmgain_storage_change'));
}

export function getUserCoords(): [number, number] {
  try {
    const raw = localStorage.getItem(USER_LOCATION_KEY);
    if (!raw) return RAJAHMUNDRY_DEFAULT_COORDS;
    return JSON.parse(raw);
  } catch {
    return RAJAHMUNDRY_DEFAULT_COORDS;
  }
}

export function setUserCoords(coords: [number, number]): void {
  localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(coords));
  window.dispatchEvent(new Event('farmgain_location_change'));
}

export function resetToDefaults(): void {
  localStorage.setItem(CENTRES_KEY, JSON.stringify(INITIAL_CENTRES));
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(INITIAL_BOOKINGS));
  localStorage.setItem(PROFILES_KEY, JSON.stringify(INITIAL_PROFILES));
  localStorage.setItem(ACTIVE_PROFILE_KEY, INITIAL_PROFILES[0].id);
  localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS));
  localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(RAJAHMUNDRY_DEFAULT_COORDS));
  window.dispatchEvent(new Event('farmgain_storage_change'));
  window.dispatchEvent(new Event('farmgain_location_change'));
}
