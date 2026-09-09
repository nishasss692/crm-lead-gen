'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Lead } from './LeadsTable';
import { X, Check, ChevronDown, Calendar, AlertTriangle, Building2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { resolvePincodeTerritory, PINCODE_TERRITORY_CATALOG } from '@/lib/karnatakaTerritory';

interface UpdateLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (id: number, updates: Partial<Lead>) => Promise<void>;
  initialTab?: 'outcome' | 'source';
}

// Division-scoped Post Office and Pincode Mapping for Karnataka Postal Circle
export const DIVISION_PINCODES_MAP: Record<string, Record<string, string[]>> = {
  "Mysuru": {
    "570001": ["Mysuru Head Post Office", "Mysuru Fort SO", "K R Circle SO", "Lakshmipuram SO"],
    "570002": ["Mysuru Fort SO", "Agrahara SO", "Vani Vilas Market SO"],
    "570004": ["Nazarbad SO", "Ittigegud SO", "Mysuru Palace SO"],
    "570008": ["Chamundipuram SO", "Vidyaranyapuram SO", "Jayanagar Mysuru SO"],
    "570009": ["Tilaknagar SO", "Mandi Mohalla SO"],
    "570016": ["Belagola Industrial Area SO", "Metagalli SO", "Hebbal SO"],
    "570017": ["Bannimantap SO", "Bamboo Bazar SO"],
    "570018": ["Hootagalli Industrial Area SO", "Koorgalli BO", "Belavadi SO"],
    "570019": ["Vijayanagar SO", "Gokulam SO"],
    "570020": ["Kuvempunagar SO", "Vivekanandanagar SO"],
    "570022": ["Ramakrishnanagar SO", "Bogadi SO"],
    "570023": ["Saraswathipuram SO", "Tonachikoppal SO", "Jayalakshmipuram SO"],
    "570025": ["Srirampura SO", "JP Nagar Mysuru SO"],
    "570026": ["Dattagalli SO", "Roopa Nagar SO"],
    "570027": ["Hebbal Industrial Area SO", "Kumbarakoppal SO"],
    "570028": ["Siddartha Nagar SO", "Alanahalli SO"],
    "571114": ["Kadakola SO", "Thandavapura SO"],
    "571301": ["Nanjangud SO", "Industrial Estate Nanjangud SO"],
    "571311": ["T Narasipura SO", "Bannur SO"],
    "571313": ["Chamarajanagar SO", "Ramasamudra SO"]
  },
  "Bengaluru East": {
    "560001": ["Bengaluru GPO", "Raj Bhavan SO", "Vidhana Soudha SO"],
    "560005": ["Frazer Town SO", "Cox Town SO"],
    "560008": ["HAL II Stage SO", "Indiranagar SO", "Domlur SO"],
    "560016": ["Doorvaninagar SO", "Ramamurthy Nagar SO"],
    "560017": ["HAL Old Airport Road SO", "Vimanapura SO"],
    "560024": ["Hebbal SO", "Anandnagar SO"],
    "560025": ["Museum Road SO", "Ashoknagar SO", "Richmond Town SO"],
    "560032": ["RT Nagar SO", "Ganganagar SO"],
    "560033": ["Maruthi Seva Nagar SO", "Cooke Town SO"],
    "560038": ["Indiranagar SO", "Defence Colony SO"],
    "560042": ["St. Thomas Town SO", "Lingarajapuram SO"],
    "560043": ["Banaswadi SO", "Kalyan Nagar SO"],
    "560045": ["Manyata Tech Park SO", "Nagawara SO"],
    "560048": ["Hoodi SO", "Mahadevapura SO"],
    "560064": ["Yelahanka Satellite Town SO", "Attur BO"],
    "560066": ["Whitefield SO", "Kadugodi SO", "Immadihalli BO"],
    "560071": ["Domlur SO", "Airport Road SO"],
    "560075": ["HAL III Stage SO", "New Thippasandra SO"],
    "560077": ["Kothanur SO", "Hennur SO"],
    "560080": ["Sadashivanagar SO", "Palace Guttahalli SO"],
    "560092": ["Sahakarnagar SO", "Hebbal Agricultural Farm SO", "Kodigehalli BO", "Byatarayanapura SO"],
    "560094": ["RMV Extension II Stage SO", "Sanjaynagar SO"]
  },
  "Bengaluru South": {
    "560002": ["Bengaluru City SO", "Dharmaram College SO", "Town Hall SO"],
    "560004": ["Basavanagudi SO", "Pampa Mahakavi Road SO", "N R Colony SO"],
    "560009": ["K.G. Road SO", "Majestic SO"],
    "560011": ["Jayanagar SO", "Tilaknagar SO"],
    "560026": ["Mysore Road SO", "Kasturba Nagar SO"],
    "560027": ["Lalbagh West SO", "Sudhamanagar SO"],
    "560029": ["Dharmaram College SO", "Taverekere SO"],
    "560034": ["Koramangala SO", "St. Johns Medical College SO", "Agara SO"],
    "560053": ["Chickpet SO", "City Market SO"],
    "560068": ["Madivala SO", "Bommanahalli SO"],
    "560070": ["Banashankari II Stage SO", "Padmanabhanagar SO"],
    "560076": ["BTM 2nd Stage SO", "Bannerghatta Road SO"],
    "560078": ["JP Nagar SO", "Sarakki SO"],
    "560082": ["Jayanagar East SO", "Yediyur SO"],
    "560085": ["Banashankari 3rd Stage SO", "Kathriguppe SO"],
    "560095": ["Koramangala 4th Block SO", "ST Bed SO"],
    "560099": ["Bommasandra Industrial Estate SO", "Hebbagodi BO"],
    "560100": ["Electronic City SO", "Konappana Agrahara SO"],
    "560105": ["Austin Town SO", "Viveknagar SO"]
  },
  "Bengaluru West": {
    "560003": ["Malleswaram SO", "Vyalikaval SO"],
    "560010": ["Rajajinagar SO", "Industrial Estate SO", "Prakash Nagar SO"],
    "560013": ["Jalahalli SO", "MS Ramaiah SO"],
    "560020": ["Seshadripuram SO", "Palace Guttahalli SO"],
    "560021": ["Srirampuram SO", "Dayananda Nagar SO"],
    "560022": ["Yeshwanthpur Industrial Suburb SO", "Yeshwantpur SO"],
    "560023": ["Magadi Road SO", "Binnypet SO"],
    "560040": ["Vijayanagar Bengaluru SO", "RPC Layout SO"],
    "560054": ["Mathikere SO", "Gokula SO"],
    "560057": ["Peenya Dasarahalli SO", "Jalahalli West SO"],
    "560058": ["Peenya 1st Stage SO", "Peenya Small Industries SO"],
    "560079": ["Basaveshwaranagar SO", "Kamakshipalya SO"],
    "560086": ["Mahalakshmi Layout SO", "West of Chord Road SO"],
    "560091": ["Viswaneedam SO", "Magadi Main Road SO"],
    "560097": ["Vidyaranyapura SO", "Tindlu BO"],
    "561203": ["Doddaballapur SO", "KIADB SO"],
    "562107": ["Nelamangala SO", "Arishinakunte BO"]
  },
  "Belagavi": {
    "590001": ["Belagavi Head Post Office", "Camp Belagavi SO", "Khade Bazar SO"],
    "590005": ["Shahapur SO", "Vadgaon SO"],
    "590006": ["Tilakwadi SO", "Angol SO"],
    "590008": ["Belagavi City SO", "Khasbag SO"],
    "590010": ["Hindwadi SO", "Congress Road SO"],
    "590011": ["Auto Nagar SO", "Kanakadasa Nagar SO"],
    "590014": ["Machhe Industrial Area SO", "Vadgaon SO"],
    "590015": ["Angol SO", "Bhagyanagar SO"],
    "590016": ["Udyambag SO", "KIADB Belagavi SO"],
    "591304": ["Gokak Falls SO", "Konnur SO"]
  },
  "Dharwad": {
    "580001": ["Dharwad Head Post Office", "Station Road SO"],
    "580008": ["Sattur SO", "SDM Medical SO"],
    "580011": ["Navanagar SO", "APMC SO"],
    "580020": ["Hubballi Main SO", "Durgad Bail SO"],
    "580023": ["Railway Colony SO", "Deshpande Nagar SO"],
    "580024": ["Keshwapur SO", "Kusugal Road SO"],
    "580025": ["Old Hubballi SO", "Anand Nagar SO"],
    "580026": ["Gokul Road Industrial Estate SO", "Tarihal SO"],
    "580030": ["Vidyanagar Hubballi SO", "Shirur Park SO"],
    "580031": ["Bhairidevarakoppa SO", "Unkal SO"],
    "581110": ["Haveri SO", "Ashwini Nagar SO"]
  },
  "Mangaluru": {
    "575001": ["Mangaluru Head Post Office", "Hampankatta SO", "Bunder SO"],
    "575002": ["Kankanady SO", "Falnir SO"],
    "575003": ["Kodialbail SO", "Ashoknagar Mangaluru SO"],
    "575005": ["Kankanady SO", "Valencia SO"],
    "575008": ["Kadri SO", "Mallikatte SO"],
    "575011": ["Baikampady Industrial Estate SO", "Panambur SO"],
    "575018": ["Surathkal SO", "NITK SO"],
    "574118": ["Manipal SO", "Endpoint BO"],
    "576101": ["Udupi Head Post Office", "Court Road SO"]
  },
  "Kalaburagi": {
    "585101": ["Kalaburagi Head Post Office", "Main Road SO"],
    "585102": ["Super Market SO", "Station Road SO"],
    "585103": ["MSK Mill SO", "Brahampur SO"],
    "585104": ["Sedam Road SO", "Gulbarga University SO"],
    "585105": ["Kapnoor Industrial Area SO", "Humnabad Base SO"],
    "585310": ["Humnabad Road SO", "Farhatabad SO"]
  },
  "Ballari": {
    "583101": ["Ballari Head Post Office", "Brucepet SO"],
    "583102": ["Cowlbazar SO", "Cantonment SO"],
    "583103": ["Cantonment SO", "Millerpet SO"],
    "583104": ["Gandhi Nagar Ballari SO", "Satyanarayanapet SO"],
    "583118": ["Kudithini SO", "Jindal Steel BO"],
    "583121": ["Siruguppa SO", "Tekkalakote SO"],
    "583126": ["Toranagallu SO", "JSW Steel Complex SO"],
    "583201": ["Hospet Head Post Office", "Station Road SO"]
  },
  "Tumakuru": {
    "572101": ["Tumakuru Head Post Office", "Ashoka Road SO"],
    "572102": ["Siddaganga Mutt SO", "Kyathsandra SO"],
    "572103": ["B H Road SO", "Mandipet SO"],
    "572104": ["SSIT SO", "Maralur SO"],
    "572106": ["Antharasanahalli Industrial Area SO", "Batwadi SO"],
    "572126": ["Kunigal SO", "Huliyurdurga SO"],
    "572128": ["Tiptur SO", "B H Road Tiptur SO"]
  },
  "Udupi": {
    "576101": ["Udupi Head Post Office", "Court Road SO"],
    "576102": ["Kunjibettu SO", "Manipal Road SO"],
    "576104": ["Malpe SO", "Fisheries Wharf SO"],
    "574118": ["Manipal SO", "Endpoint BO"],
    "576201": ["Kundapura SO", "Chikkatoto SO"],
    "576213": ["Byndoor SO", "Shiroor SO"],
    "576219": ["Brahmavara SO", "Saligrama SO"]
  },
  "Shivamogga": {
    "577201": ["Shivamogga Head Post Office", "Durgigudi SO"],
    "577202": ["Vinobha Nagar SO", "Gopala SO"],
    "577204": ["Kallahalli SO", "Industrial Estate Shivamogga SO"],
    "577222": ["Bhadravathi Old Town SO", "VISL SO"],
    "577301": ["Bhadravathi SO", "Paper Town SO"],
    "577401": ["Sagar SO", "Subhash Nagar SO"]
  }
};

// Aliases
DIVISION_PINCODES_MAP["BG East"] = DIVISION_PINCODES_MAP["Bengaluru East"];
DIVISION_PINCODES_MAP["BG EAST"] = DIVISION_PINCODES_MAP["Bengaluru East"];
DIVISION_PINCODES_MAP["bg east"] = DIVISION_PINCODES_MAP["Bengaluru East"];
DIVISION_PINCODES_MAP["bg east division"] = DIVISION_PINCODES_MAP["Bengaluru East"];
DIVISION_PINCODES_MAP["BG South"] = DIVISION_PINCODES_MAP["Bengaluru South"];
DIVISION_PINCODES_MAP["BG SOUTH"] = DIVISION_PINCODES_MAP["Bengaluru South"];
DIVISION_PINCODES_MAP["bg south"] = DIVISION_PINCODES_MAP["Bengaluru South"];
DIVISION_PINCODES_MAP["BG West"] = DIVISION_PINCODES_MAP["Bengaluru West"];
DIVISION_PINCODES_MAP["BG WEST"] = DIVISION_PINCODES_MAP["Bengaluru West"];
DIVISION_PINCODES_MAP["bg west"] = DIVISION_PINCODES_MAP["Bengaluru West"];
DIVISION_PINCODES_MAP["Tumkur"] = DIVISION_PINCODES_MAP["Tumakuru"];
DIVISION_PINCODES_MAP["tumkur"] = DIVISION_PINCODES_MAP["Tumakuru"];
DIVISION_PINCODES_MAP["Shimoga"] = DIVISION_PINCODES_MAP["Shivamogga"];
DIVISION_PINCODES_MAP["shimoga"] = DIVISION_PINCODES_MAP["Shivamogga"];
DIVISION_PINCODES_MAP["Hubballi"] = DIVISION_PINCODES_MAP["Dharwad"];
DIVISION_PINCODES_MAP["dharwad"] = DIVISION_PINCODES_MAP["Dharwad"];
DIVISION_PINCODES_MAP["bagalkot"] = DIVISION_PINCODES_MAP["Bagalkote"] || {};
DIVISION_PINCODES_MAP["channapatna"] = DIVISION_PINCODES_MAP["Channapatna"] || {};

export const getDivisionPincodesMap = (divName: string): Record<string, string[]> => {
  if (!divName) return DIVISION_PINCODES_MAP["Mysuru"] || {};
  const clean = divName.replace(/ division/i, '').trim();
  if (DIVISION_PINCODES_MAP[clean]) return DIVISION_PINCODES_MAP[clean];
  if (DIVISION_PINCODES_MAP[divName]) return DIVISION_PINCODES_MAP[divName];
  const lower = clean.toLowerCase();
  for (const [key, val] of Object.entries(DIVISION_PINCODES_MAP)) {
    if (key.toLowerCase() === lower || key.toLowerCase().replace(/ division/i, '').trim() === lower) {
      return val;
    }
  }
  return DIVISION_PINCODES_MAP["Mysuru"] || {};
};

// Flattened fallback lookup
const ALL_PINCODE_OFFICES: Record<string, string[]> = {};
Object.values(DIVISION_PINCODES_MAP).forEach(divPins => {
  Object.entries(divPins).forEach(([pin, offices]) => {
    if (!ALL_PINCODE_OFFICES[pin]) ALL_PINCODE_OFFICES[pin] = offices;
  });
});

export default function UpdateLeadModal({ lead, onClose, onSave, initialTab = 'outcome' }: UpdateLeadModalProps) {
  const [activeTab, setActiveTab] = useState<'outcome' | 'source'>(initialTab);

  // Read current user
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Determine active territory / division for this ME
  const activeDivision = lead.division || currentUser?.assigned_division || currentUser?.division || 'Mysuru';
  const cleanActiveDiv = activeDivision.replace(/ division/i, "").trim();

  // Find pre-configured division pincodes case-insensitively
  const initialDivMap = getDivisionPincodesMap(cleanActiveDiv);
  const [divisionPinsMap, setDivisionPinsMap] = useState<Record<string, string[]>>(initialDivMap);
  const [divisionPincodes, setDivisionPincodes] = useState<string[]>(Object.keys(initialDivMap));
  const [isCustomPin, setIsCustomPin] = useState<boolean>(false);


  // Initial Pin: use lead.pincode if valid, else first pincode of ME's division (e.g. 570001 for Mysuru)
  const defaultDivPin = Object.keys(initialDivMap)[0] || '570001';
  const initialPin = (lead.pincode && lead.pincode.trim().length === 6) ? lead.pincode.trim() : defaultDivPin;
  const initialOffices = initialDivMap[initialPin] || ALL_PINCODE_OFFICES[initialPin] || [`Post Office - ${initialPin}`];

  const [meOptions, setMeOptions] = useState<string[]>([]);
  const [meDropdownOpen, setMeDropdownOpen] = useState(false);
  const meDropdownRef = useRef<HTMLDivElement>(null);
  const date1Ref = useRef<HTMLInputElement>(null);
  const date2Ref = useRef<HTMLInputElement>(null);
  const date3Ref = useRef<HTMLInputElement>(null);

  const openDatePicker = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === 'function') {
        inputRef.current.showPicker();
      } else {
        inputRef.current.focus();
      }
    }
  };

  const [meMobileMap, setMeMobileMap] = useState<Record<string, string>>({});
  const [availableOffices, setAvailableOffices] = useState<string[]>(initialOffices);

  const initialDate1 = lead.contactedDate1 || lead.contacted_date_1 || lead.dateOfMeeting || new Date().toISOString().split('T')[0];
  const initialDate2 = lead.contactedDate2 || lead.contacted_date_2 || '';
  const initialDate3 = lead.contactedDate3 || lead.contacted_date_3 || '';

  const userMobile = currentUser?.mobile_number ? String(currentUser.mobile_number).replace(/\D/g, '').slice(0, 10) : '';
  const initialContactNumber = lead.contactNumber ? String(lead.contactNumber).replace(/\D/g, '').slice(0, 10) : '';

  const [formData, setFormData] = useState({
    assignedMeName: lead.assignedMeName || (currentUser?.role === 'ME' ? (currentUser.name || currentUser.username || '') : ''),
    meMobile: userMobile,
    dateOfMeeting: initialDate1,
    contactedDate1: initialDate1,
    contactedDate2: initialDate2,
    contactedDate3: initialDate3,
    exporterName: lead.exporterName || '',
    address: lead.address || '',
    pincode: initialPin,
    poName: lead.poName || initialOffices[0] || '',
    customerMet: lead.customerMet || '',
    contactNumber: initialContactNumber,
    alternativeNumber: '',
    email: lead.email || '',
    productType: '',
    serviceUsing: lead.serviceUsing || 'DHL',
    monthlyVolume: lead.monthlyVolume || '',
    meetingOutcome: lead.meetingOutcome || 'Interested',
    willingToOnboard: 'Yes',
    contractId: lead.contractId || '',
    remarks: lead.remarks || '',
    division: cleanActiveDiv,
    region: lead.region || '',
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch dynamic division-scoped pincodes and offices from backend
  useEffect(() => {
    if (!cleanActiveDiv) return;
    const controller = new AbortController();

    apiFetch(`/api/division-pincodes/${encodeURIComponent(cleanActiveDiv)}`, { signal: controller.signal })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data.pincodes) && data.pincodes.length > 0) {
          const map: Record<string, string[]> = {};
          const pins: string[] = [];
          data.pincodes.forEach((item: any) => {
            if (item.pincode) {
              map[item.pincode] = item.offices || [];
              pins.push(item.pincode);
            }
          });
          setDivisionPinsMap(prev => ({ ...prev, ...map }));
          setDivisionPincodes(pins);

          // If current pin is not in the division, select the primary division pin
          if (!pins.includes(formData.pincode) && !lead.pincode && pins[0]) {
            setFormData(p => ({
              ...p,
              pincode: pins[0],
              poName: map[pins[0]]?.[0] || p.poName
            }));
          }
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [cleanActiveDiv]);

  // Close ME combobox dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (meDropdownRef.current && !meDropdownRef.current.contains(e.target as Node)) {
        setMeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync logged in user details and MEs list
  useEffect(() => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        const u = JSON.parse(userStr);
        setCurrentUser(u);
        const name = u.name || u.username || u.employee_id;
        const mobile = (u.mobile_number || u.mobile || '').replace(/\D/g, '').slice(0, 10);

        if (name) {
          setFormData(prev => ({
            ...prev,
            assignedMeName: prev.assignedMeName || name,
            meMobile: prev.meMobile || mobile
          }));

          setMeOptions(prev => Array.from(new Set([name, ...prev])));
          if (mobile) {
            setMeMobileMap(prev => ({ ...prev, [name]: mobile }));
          }
        }
      }
    } catch (e) {
      console.warn('Error reading user info:', e);
    }

    // Fetch MEs list from backend
    apiFetch('/api/mes')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const names = data.map((m: any) => m.name || m.employee_id).filter(Boolean);
          const mobiles: Record<string, string> = {};
          data.forEach((m: any) => {
            const n = m.name || m.employee_id;
            if (n && m.mobile_number) {
              mobiles[n] = String(m.mobile_number).replace(/\D/g, '').slice(0, 10);
            }
          });
          setMeOptions(prev => Array.from(new Set([...prev, ...names])));
          setMeMobileMap(prev => ({ ...prev, ...mobiles }));
        }
      })
      .catch(() => {});
  }, [lead.assignedMeName]);

  // Handle selection of a pincode
  const handlePincodeSelect = (newPin: string) => {
    const cleanPin = newPin.trim().replace(/\D/g, '');
    const offices = divisionPinsMap[cleanPin] || ALL_PINCODE_OFFICES[cleanPin] || [`Post Office - ${cleanPin}`];
    setAvailableOffices(offices);
    setFormData(prev => ({
      ...prev,
      pincode: cleanPin,
      poName: offices[0] || ''
    }));
  };

  // Fetch or lookup post offices when pincode changes
  useEffect(() => {
    const cleanPin = (formData.pincode || '').trim().replace(/\D/g, '');
    if (!cleanPin) {
      setAvailableOffices([]);
      return;
    }

    // 1. Initial lookup from division map or pre-defined map
    let currentOffices = divisionPinsMap[cleanPin] || ALL_PINCODE_OFFICES[cleanPin] || [`Post Office - ${cleanPin}`];
    setAvailableOffices(currentOffices);
    
    // Auto-select first office if poName is empty or not in new offices
    setFormData(prev => ({
      ...prev,
      poName: currentOffices.includes(prev.poName) ? prev.poName : (currentOffices[0] || '')
    }));

    // 2. Dynamic fetch if 6 digits
    if (cleanPin.length === 6) {
      const controller = new AbortController();
      
      apiFetch(`/api/pincode-offices/${cleanPin}`, { signal: controller.signal })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && Array.isArray(data.offices) && data.offices.length > 0) {
            setAvailableOffices(data.offices);
            setFormData(prev => ({
              ...prev,
              poName: data.offices.includes(prev.poName) ? prev.poName : (data.offices[0] || '')
            }));
          }
        })
        .catch(() => {
          fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, { signal: controller.signal })
            .then(r => r.json())
            .then(res => {
              if (Array.isArray(res) && res[0]?.Status === 'Success' && Array.isArray(res[0]?.PostOffice)) {
                const fetched = res[0].PostOffice.map((p: any) => 
                  `${p.Name} ${p.BranchType === 'Sub Post Office' ? 'SO' : p.BranchType === 'Branch Post Office' ? 'BO' : p.BranchType === 'Head Post Office' ? 'HO' : ''}`.trim()
                );
                if (fetched.length > 0) {
                  setAvailableOffices(fetched);
                  setFormData(prev => ({
                    ...prev,
                    poName: fetched.includes(prev.poName) ? prev.poName : (fetched[0] || '')
                  }));
                }
              }
            })
            .catch(() => {});
        });

      return () => controller.abort();
    }
  }, [formData.pincode, divisionPinsMap]);

  // Prevent background body scrolling when modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMeChange = (selectedMe: string) => {
    const mobile = meMobileMap[selectedMe] || '';
    setFormData(prev => ({
      ...prev,
      assignedMeName: selectedMe,
      meMobile: mobile || prev.meMobile
    }));
  };

  const sourceTerritory = useMemo(() => {
    const pin = (formData.pincode || initialPin || '').trim();
    return resolvePincodeTerritory(pin, formData.division || cleanActiveDiv);
  }, [formData.pincode, formData.division, initialPin, cleanActiveDiv]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Validate 10-digit phone numbers
      if (formData.contactNumber && formData.contactNumber.length !== 10) {
        alert('Contact number must be exactly 10 digits.');
        setSaving(false);
        return;
      }
      if (formData.meMobile && formData.meMobile.length !== 10) {
        alert('ME mobile number must be exactly 10 digits.');
        setSaving(false);
        return;
      }
      if (formData.alternativeNumber && formData.alternativeNumber.length !== 10) {
        alert('Alternative number must be exactly 10 digits.');
        setSaving(false);
        return;
      }

      if (activeTab === 'source') {
        const cleanPo = formData.poName.includes('[') ? formData.poName.split('[')[0].trim() : formData.poName.trim();
        const updates: Partial<Lead> = {
          exporterName: formData.exporterName.trim(),
          address: formData.address.trim(),
          pincode: formData.pincode.trim(),
          poName: cleanPo || formData.poName.trim(),
          division: sourceTerritory.division,
          region: sourceTerritory.region,
        };

        await onSave(lead.id, updates);
        setSaveSuccess(true);
        setTimeout(() => {
          onClose();
        }, 400);
        return;
      }

      const updates: Partial<Lead> & {
        contactedDate1?: string;
        contactedDate2?: string;
        contactedDate3?: string;
        contacted_date_1?: string;
        contacted_date_2?: string;
        contacted_date_3?: string;
      } = {
        exporterName: formData.exporterName,
        address: formData.address,
        pincode: formData.pincode,
        poName: formData.poName,
        division: formData.division,
        region: formData.region,
        assignedMeName: formData.assignedMeName,
        customerMet: formData.customerMet,
        contactNumber: formData.contactNumber,
        email: formData.email,
        serviceUsing: formData.serviceUsing,
        monthlyVolume: formData.monthlyVolume,
        meetingOutcome: formData.meetingOutcome || 'Interested',
        contractId: formData.contractId,
        remarks: formData.remarks,
        dateOfMeeting: formData.contactedDate1 || formData.dateOfMeeting,
        contactedDate1: formData.contactedDate1,
        contacted_date_1: formData.contactedDate1,
        contactedDate2: formData.contactedDate2,
        contacted_date_2: formData.contactedDate2,
        contactedDate3: formData.contactedDate3,
        contacted_date_3: formData.contactedDate3,
      };

      await onSave(lead.id, updates);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err) {
      console.error('Failed to save lead contact outcome:', err);
    } finally {
      setSaving(false);
    }
  };

  // Filtered MEs for typing suggestions
  const filterText = (formData.assignedMeName || '').trim().toLowerCase();
  const filteredMeOptions = filterText
    ? meOptions.filter(opt => opt.toLowerCase().includes(filterText))
    : meOptions;
  const displayMeOptions = filteredMeOptions.length > 0 ? filteredMeOptions : meOptions;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Dark Blur Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[1080px] flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 border border-slate-200 z-10 overflow-hidden font-sans my-auto">
        
        {/* Top Decorative Border */}
        <div className="h-1 bg-[#b91c1c] w-full shrink-0" />

        {/* Header Section */}
        <div className="px-6 pt-4 pb-3 flex items-start justify-between bg-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-wider uppercase text-[#b91c1c] block leading-none">
                {activeTab === 'source' ? 'AUTHORIZED DATA CORRECTION' : 'CONTACT OUTCOME'}
              </span>
              <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                📍 {activeTab === 'source' ? sourceTerritory.divisionLabel : `${cleanActiveDiv} Division Territory`}
              </span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-[#1e3a8a] tracking-tight mt-1 leading-none">
              {activeTab === 'source' ? 'Modify lead source details' : 'Update lead'}
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs Switcher Bar */}
        <div className="flex items-center gap-2 px-6 pt-2 pb-2 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('outcome')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'outcome'
                ? 'bg-white text-[#1e3a8a] shadow-xs border border-slate-200 ring-1 ring-[#1e3a8a]/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <span>📋</span>
            <span>Contact Outcome</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('source')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'source'
                ? 'bg-white text-[#b91c1c] shadow-xs border border-slate-200 ring-1 ring-[#b91c1c]/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <span>✏️</span>
            <span>Modify Lead Source Details</span>
          </button>
        </div>

        {/* Scrollable / Directly viewable Form Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 custom-scrollbar">
          <form id="update-lead-form" onSubmit={handleSubmit} className="space-y-3.5">
            
            {activeTab === 'source' ? (
              <div className="space-y-4 max-w-2xl py-1">
                {/* Amber Warning Notice Box */}
                <div className="flex items-start gap-3 bg-amber-50/90 border border-amber-200/90 rounded-lg p-3.5 text-amber-900 shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium leading-relaxed">
                    Only the four source fields below can be changed. Pincode and PO selection will automatically update the organizational mapping.
                  </p>
                </div>

                {/* Exporter name */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Exporter name
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.exporterName} 
                    onChange={e => handleChange('exporterName', e.target.value)}
                    placeholder="Business or Exporter Name"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs font-bold text-slate-900 uppercase focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs"
                  />
                </div>

                {/* Exporter address */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Exporter address
                  </label>
                  <textarea 
                    rows={3} 
                    required
                    value={formData.address} 
                    onChange={e => handleChange('address', e.target.value)}
                    placeholder="Full address, premises, street, city, state"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs resize-none"
                  />
                </div>

                {/* Pincode */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Pincode
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomPin(prev => !prev)}
                      className="text-[11px] text-[#1e3a8a] hover:underline font-semibold cursor-pointer"
                    >
                      {isCustomPin ? "Select from list" : "Enter custom PIN"}
                    </button>
                  </div>

                  {isCustomPin ? (
                    <input 
                      type="text" 
                      maxLength={6}
                      required
                      value={formData.pincode} 
                      onChange={e => handleChange('pincode', e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit Pincode"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs font-bold text-slate-800 font-mono focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs"
                    />
                  ) : (
                    <select
                      value={formData.pincode}
                      onChange={e => handlePincodeSelect(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs font-bold text-slate-800 font-mono focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer"
                    >
                      {Object.keys(PINCODE_TERRITORY_CATALOG).map(pin => {
                        const entry = PINCODE_TERRITORY_CATALOG[pin];
                        const firstOff = entry?.offices?.[0] ? ` — ${entry.offices[0].replace(/ (SO|BO|HO|GPO)$/, '')}` : '';
                        return (
                          <option key={pin} value={pin}>
                            {pin} ({entry?.division || 'Division'}){firstOff}
                          </option>
                        );
                      })}
                      {!Object.keys(PINCODE_TERRITORY_CATALOG).includes(formData.pincode) && formData.pincode && (
                        <option value={formData.pincode}>{formData.pincode} (Custom)</option>
                      )}
                    </select>
                  )}
                </div>

                {/* PO Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    PO Name
                  </label>
                  <select 
                    value={formData.poName} 
                    onChange={e => handleChange('poName', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer"
                  >
                    {sourceTerritory.offices.map((off, idx) => (
                      <option key={idx} value={off.label}>
                        {off.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Organizational Mapping Banner */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-center gap-2 shadow-2xs">
                  <Building2 className="w-4 h-4 text-[#1e3a8a] shrink-0" />
                  <p className="font-semibold text-slate-700 leading-snug">
                    <span className="text-[#1e3a8a] font-bold">{sourceTerritory.divisionLabel}</span> • {sourceTerritory.region} • Karnataka. <span className="text-slate-500 font-normal">Saving will apply this organizational mapping.</span>
                  </p>
                </div>
              </div>
            ) : (
              <>
            {/* ROW 1: Assigned ME (Input + Dropdown Combobox), ME mobile, Exporter name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div ref={meDropdownRef} className="relative">
                <label className="block text-xs font-bold text-slate-800 mb-1">Assigned ME</label>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={formData.assignedMeName} 
                    onChange={e => {
                      const val = e.target.value;
                      const mobile = meMobileMap[val] || formData.meMobile;
                      setFormData(prev => ({ ...prev, assignedMeName: val, meMobile: mobile }));
                      setMeDropdownOpen(true);
                    }}
                    onFocus={() => setMeDropdownOpen(true)}
                    placeholder="Type or select ME"
                    className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setMeDropdownOpen(prev => !prev)}
                    className="absolute right-2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
                    title="Toggle ME options"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${meDropdownOpen ? 'rotate-180 text-[#1e3a8a]' : ''}`} />
                  </button>
                </div>

                {/* Combobox Dropdown Menu */}
                {meDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar py-1">
                    {displayMeOptions.map((opt, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          handleMeChange(opt);
                          setMeDropdownOpen(false);
                        }}
                        className={`px-3 py-2 text-xs cursor-pointer font-medium transition-colors flex items-center justify-between ${
                          formData.assignedMeName === opt 
                            ? 'bg-red-50 text-[#b91c1c] font-bold' 
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{opt}</span>
                        {formData.assignedMeName === opt && <Check className="w-3.5 h-3.5 text-[#b91c1c]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">ME mobile</label>
                  <span className={`text-[10px] font-mono font-bold ${
                    formData.meMobile.length === 10 ? 'text-emerald-600' : formData.meMobile.length > 0 ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {formData.meMobile ? `${formData.meMobile.length}/10` : ''}
                  </span>
                </div>
                <input 
                  type="text" 
                  maxLength={10}
                  value={formData.meMobile} 
                  onChange={e => handleChange('meMobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#1e3a8a] outline-none shadow-2xs font-mono" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Exporter name</label>
                <input 
                  type="text" 
                  value={formData.exporterName} 
                  onChange={e => handleChange('exporterName', e.target.value)}
                  placeholder="Exporter Business Name"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 uppercase focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>
            </div>

            {/* DEDICATED SECTION: Contact Timeline & Outreach (Contacted Date 1, 2, 3) */}
            <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 sm:p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#1e3a8a]" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                    Contact Timeline & Outreach Dates
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                    (3 Interaction Touchpoints)
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                  Click calendar icon to pick
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Contacted Date 1 */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs hover:border-slate-300 transition-all focus-within:border-[#1e3a8a] focus-within:ring-1 focus-within:ring-[#1e3a8a]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      Contacted Date 1
                    </label>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-[#1e3a8a] border border-blue-100">
                      Initial Contact
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input 
                      ref={date1Ref}
                      type="date" 
                      value={formData.contactedDate1} 
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, contactedDate1: val, dateOfMeeting: val }));
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-9 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] outline-none cursor-pointer" 
                    />
                    <button
                      type="button"
                      onClick={() => openDatePicker(date1Ref)}
                      className="absolute right-2 p-1 text-slate-400 hover:text-[#1e3a8a] hover:bg-blue-50 rounded transition-colors cursor-pointer"
                      title="Open Calendar for Contacted Date 1"
                    >
                      <Calendar className="w-4 h-4 text-[#1e3a8a]" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">First contact / initial meeting</p>
                </div>

                {/* Contacted Date 2 */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs hover:border-slate-300 transition-all focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      Contacted Date 2
                    </label>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-100">
                      Follow-Up 1
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input 
                      ref={date2Ref}
                      type="date" 
                      value={formData.contactedDate2} 
                      onChange={e => handleChange('contactedDate2', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-9 py-2 text-xs font-semibold text-slate-800 focus:border-amber-500 outline-none cursor-pointer" 
                    />
                    <button
                      type="button"
                      onClick={() => openDatePicker(date2Ref)}
                      className="absolute right-2 p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                      title="Open Calendar for Contacted Date 2"
                    >
                      <Calendar className="w-4 h-4 text-amber-700" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Secondary follow-up discussion</p>
                </div>

                {/* Contacted Date 3 */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs hover:border-slate-300 transition-all focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      Contacted Date 3
                    </label>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                      Follow-Up 2
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input 
                      ref={date3Ref}
                      type="date" 
                      value={formData.contactedDate3} 
                      onChange={e => handleChange('contactedDate3', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-9 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 outline-none cursor-pointer" 
                    />
                    <button
                      type="button"
                      onClick={() => openDatePicker(date3Ref)}
                      className="absolute right-2 p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                      title="Open Calendar for Contacted Date 3"
                    >
                      <Calendar className="w-4 h-4 text-emerald-700" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Third touchpoint / final outcome</p>
                </div>
              </div>
            </div>

            {/* ROW 2: Exporter address */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Exporter address</label>
              <textarea 
                rows={2} 
                value={formData.address} 
                onChange={e => handleChange('address', e.target.value)}
                placeholder="Full street address, building name, road, city, state"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs resize-none" 
              />
            </div>

            {/* ROW 3: Pincode, PO Name, Contact person, Contact number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Pincode
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomPin(prev => !prev)}
                    className="text-[10px] text-[#1e3a8a] hover:underline font-semibold cursor-pointer"
                  >
                    {isCustomPin ? "Select from list" : "Enter other"}
                  </button>
                </div>
                {isCustomPin ? (
                  <input 
                    type="text" 
                    value={formData.pincode} 
                    onChange={e => handleChange('pincode', e.target.value)}
                    placeholder="6-digit PIN"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 font-mono focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                  />
                ) : (
                  <div className="relative">
                    <select
                      value={formData.pincode}
                      onChange={e => handlePincodeSelect(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-7 py-2 text-xs font-bold text-slate-800 font-mono focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer appearance-none"
                    >
                      {divisionPincodes.map((pin) => {
                        const sampleOffice = divisionPinsMap[pin]?.[0] || '';
                        const shortOffice = sampleOffice.replace(/ (SO|BO|HO|GPO)$/, '');
                        return (
                          <option key={pin} value={pin}>
                            {pin} {shortOffice ? `— ${shortOffice}` : ''}
                          </option>
                        );
                      })}
                      {!divisionPincodes.includes(formData.pincode) && formData.pincode && (
                        <option value={formData.pincode}>{formData.pincode} (Custom)</option>
                      )}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
                <span className="text-[10px] text-slate-500 font-medium block mt-1 leading-tight">
                  Pincodes for {cleanActiveDiv} Division
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    PO Name
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {availableOffices.length} office{availableOffices.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="relative">
                  <select 
                    value={formData.poName} 
                    onChange={e => handleChange('poName', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-7 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer appearance-none"
                  >
                    {availableOffices.map((office, i) => (
                      <option key={i} value={office}>{office}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-400 font-medium block mt-1 leading-tight">
                  Offices in {cleanActiveDiv} for PIN {formData.pincode}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Contact person</label>
                <input 
                  type="text" 
                  value={formData.customerMet} 
                  onChange={e => handleChange('customerMet', e.target.value)}
                  placeholder="Key Contact / Customer Met"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">Contact number</label>
                  <span className={`text-[10px] font-mono font-bold ${
                    formData.contactNumber.length === 10 ? 'text-emerald-600' : formData.contactNumber.length > 0 ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {formData.contactNumber.length}/10 digits
                  </span>
                </div>
                <input 
                  type="text" 
                  maxLength={10}
                  value={formData.contactNumber} 
                  onChange={e => handleChange('contactNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit phone number"
                  className={`w-full bg-white border rounded-lg px-3 py-2 text-xs font-medium text-slate-800 font-mono outline-none shadow-2xs ${
                    formData.contactNumber && formData.contactNumber.length !== 10
                      ? 'border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                      : 'border-slate-300 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]'
                  }`} 
                />
                {formData.contactNumber && formData.contactNumber.length !== 10 && (
                  <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                    Must be exactly 10 digits
                  </span>
                )}
              </div>
            </div>

            {/* ROW 4: Alternative number, Email, Product type, Current provider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">Alternative number</label>
                  <span className={`text-[10px] font-mono font-bold ${
                    formData.alternativeNumber.length === 10 ? 'text-emerald-600' : formData.alternativeNumber.length > 0 ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {formData.alternativeNumber ? `${formData.alternativeNumber.length}/10 digits` : ''}
                  </span>
                </div>
                <input 
                  type="text" 
                  maxLength={10}
                  value={formData.alternativeNumber} 
                  onChange={e => handleChange('alternativeNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Optional 10-digit phone"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 font-mono focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Email</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="exporter@domain.com"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Product type</label>
                <input 
                  type="text" 
                  value={formData.productType} 
                  onChange={e => handleChange('productType', e.target.value)}
                  placeholder="e.g. Handicrafts, Textiles, Books"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Current provider</label>
                <select 
                  value={formData.serviceUsing} 
                  onChange={e => handleChange('serviceUsing', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer"
                >
                  <option value="DHL">DHL</option>
                  <option value="FedEx">FedEx</option>
                  <option value="UPS">UPS</option>
                  <option value="Aramex">Aramex</option>
                  <option value="Others">Others</option>
                  {formData.serviceUsing && !['DHL', 'FedEx', 'UPS', 'Aramex', 'Others'].includes(formData.serviceUsing) && (
                    <option value={formData.serviceUsing}>{formData.serviceUsing}</option>
                  )}
                </select>
              </div>
            </div>

            {/* ROW 5: Monthly volume (₹), Outcome, Willing to onboard, Contract ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Monthly volume (₹)</label>
                <input 
                  type="text" 
                  value={formData.monthlyVolume} 
                  onChange={e => handleChange('monthlyVolume', e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Outcome</label>
                <select 
                  value={formData.meetingOutcome} 
                  onChange={e => handleChange('meetingOutcome', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer"
                >
                  <option value="Interested">Interested</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                  <option value="Willing to Onboard">Willing to Onboard</option>
                  <option value="Onboarded">Onboarded</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Not Interested">Not Interested</option>
                  {formData.meetingOutcome && !['Interested', 'Follow-up Required', 'Willing to Onboard', 'Onboarded', 'Contacted', 'Not Interested'].includes(formData.meetingOutcome) && (
                    <option value={formData.meetingOutcome}>{formData.meetingOutcome}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Willing to onboard</label>
                <select 
                  value={formData.willingToOnboard} 
                  onChange={e => {
                    const val = e.target.value;
                    handleChange('willingToOnboard', val);
                    if (val === 'Yes' && !formData.meetingOutcome) {
                      handleChange('meetingOutcome', 'Interested');
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs cursor-pointer"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Contract ID</label>
                <input 
                  type="text" 
                  value={formData.contractId} 
                  onChange={e => handleChange('contractId', e.target.value)}
                  placeholder="Enter Contract ID if already created"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs" 
                />
              </div>
            </div>

            {/* ROW 6: Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Remarks</label>
              <textarea 
                rows={2} 
                value={formData.remarks} 
                onChange={e => handleChange('remarks', e.target.value)}
                placeholder="Meeting discussion notes, discount requests, follow up dates..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none shadow-2xs resize-none" 
              />
            </div>
            </>
            )}

          </form>
        </div>

        {/* Modal Sticky Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-end gap-3 shrink-0">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 mr-auto flex items-center gap-1">
              <Check className="w-4 h-4" /> {activeTab === 'source' ? 'Correction saved successfully!' : 'Lead saved successfully!'}
            </span>
          )}

          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="update-lead-form" 
            disabled={saving} 
            className="px-6 py-2 bg-[#b91c1c] hover:bg-[#991b1b] text-white rounded-lg text-xs font-bold shadow-md shadow-red-700/20 transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            {saving 
              ? (activeTab === 'source' ? 'Saving correction...' : 'Saving...') 
              : (activeTab === 'source' ? 'Save correction...' : 'Save contact outcome →')}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
