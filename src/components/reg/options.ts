export const COLLEGES = [
  "AVK COLLEGE HASSAN",
  "TERESIAN COLLEGE MYSORE",
  "CENTRAL COMMERCE COLLEGE HASSAN",
  "MALNAD COLLEGE OF ENGINEERING HASSAN",
  "PES COLLEGE MANDYA",
  "GOVT COLLEGE CHANNARAYAPATNA",
  "GOVT FIRST GRADE WOMENS COLLEGE YADGIRI",
  "MARI MALLAPPA WOMENS COLLEGE MYSORE",
  "SIDHARTHA COLLEGE BIDAR",
  "KSAWU VIJAYAPURA",
  "Dadapheer Huballi",
  "Hubballi Center ",
  "SJAM College Ramnagar",
  "Dr.G Shankar Govt Women's First Grade College & PG Study Centre, Ajjarkadu",
  "Government First Grade College & Centre for Post Graduate Studies, Thenkanidiyur",
  "JPM College Channapatna ",
  "VSMS SOMASHEKHAR R KOTHIWALE INSTITUTE OF TECHNOLOGY, NIPANI",
  "Angadi Institute of Technology Belagavi",
  "Shivakumar",
  "Pandavpura Govt College",
  "Vijaya First Grade Co-Education College B.Ed",
  "K R Pete Govt College Co-Education",
  "Girls College K R Pete",
  "Channarayapatna Govt College",
  "BGS College Channarayapatna",
] as const;

export const COLLEGE_ALIASES: Record<string, readonly string[]> = {
  "Angadi Institute of Technology Belagavi": [
    "Angadi Institute of Technology Belagavi",
    "ANGADI INSTITUTE OF TECHNOLOGY BELAGAVI",
    "Angadi Institute of Technology Management Belagavi",
    "AITM BELAGAVI",
    "AITM",
  ],
  "AVK COLLEGE HASSAN": [
    "AVK COLLEGE HASSAN",
    "AVK WOMENS COLLEGE",
    "AV KANTHAMMA COLLEGE FOR WOMEN",
    "AVK COLLEGE FOR WOMEN HASSAN",
    "AVK COLLEGE FOR WOMEN",
    "A V KANTHAMMA COLLEGE FOR WOMEN",
    "A.V.K COLLEGE FOR WOMEN",
    "AVK COLLEGE FOR WOMEN HASSA",
    "A V KANTHAMMA COLLEGE FOR WOMEN,HASSAN",
    "A V K COLLEGE FOR WOMEN",
    "A.V.KCOLLEGE",
    "A V KANTHAMMA COLLEGE FOR WOMEN HASSAN",
    "A. V. K. FOR WOMEN HASSAN",
    "AVK COLLLEGE FOR WOMENS HASSAN",
    "A V KANTHAMMA COLLEG FOR WOMEN HASSAN",
    "A V KANTHAMMA COLLEGE FOR WOMEN, HASSAN",
    "AVKCOLLEGEFORWOMENHASSAN",
    "A V K COLLEGE FOR WOMEN HASSAN",
    "AVK COLLEGE FOR WOMEN, HASSAN",
    "AVK WOMEN'S COLLAGE",
    "AVK COLLEGE FOR WOMENS",
    "A.V KANTHAMMA (AVK) COLLEGE FOR WOMEN",
    "A.V KANTHAMMA COLLEGE FOR WOMEN, HASSAN",
    "HASSAN UNIVERSITY",
  ],
  "TERESIAN COLLEGE MYSORE": [
    "TERESIAN COLLEGE MYSORE",
    "TERESIAN COLLEGE",
  ],
  "CENTRAL COMMERCE COLLEGE HASSAN": [
    "CENTRAL COMMERCE COLLEGE HASSAN",
    "CENTRAL COMMERCE COLLEGE",
    "CENTRAL COMMERCE FIRST GRADE COLLEGE",
    "CENTRAL COMMERCE COLLEGE,HASSAN",
  ],
  "MALNAD COLLEGE OF ENGINEERING HASSAN": [
    "MALNAD COLLEGE OF ENGINEERING HASSAN",
    "MALNAD COLLEGE OF ENGINEERING",
    "MCE HASSAN",
  ],
  "KSAWU VIJAYAPURA": [
    "KSAWU VIJAYAPURA",
  ],
  "Shivakumar": [
    "Shivakumar",
    "SHIVAKUMAR",
    "SHIVAKUMAR E",
    "SHIVAKUMAR. A",
  ],
  "PES COLLEGE MANDYA": ["PES COLLEGE MANDYA"],
  "GOVT COLLEGE CHANNARAYAPATNA": ["GOVT COLLEGE CHANNARAYAPATNA"],
  "GOVT FIRST GRADE WOMENS COLLEGE YADGIRI": ["GOVT FIRST GRADE WOMENS COLLEGE YADGIRI"],
  "MARI MALLAPPA WOMENS COLLEGE MYSORE": ["MARI MALLAPPA WOMENS COLLEGE MYSORE"],
  "SIDHARTHA COLLEGE BIDAR": ["SIDHARTHA COLLEGE BIDAR"],
  "Dadapheer Huballi": ["Dadapheer Huballi"],
  "Hubballi Center ": ["Hubballi Center ", "Hubballi Center"],
};

export function normalizeCollegeName(rawName?: string | null): string {
  if (!rawName) return "";
  const trimmed = rawName.trim();
  if (!trimmed) return "";

  for (const [canonical, aliases] of Object.entries(COLLEGE_ALIASES)) {
    if (canonical.trim().toLowerCase() === trimmed.toLowerCase()) return canonical;
    if (aliases.some((a) => a.trim().toLowerCase() === trimmed.toLowerCase())) {
      return canonical;
    }
  }

  const upper = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (upper.includes("AVK") || upper.includes("KANTHAMMA")) return "AVK COLLEGE HASSAN";
  if (upper.includes("TERESIAN")) return "TERESIAN COLLEGE MYSORE";
  if (upper.includes("CENTRALCOMMERCE")) return "CENTRAL COMMERCE COLLEGE HASSAN";
  if (upper.includes("MALNAD") || upper === "MCE" || upper.includes("MCEHASSAN")) return "MALNAD COLLEGE OF ENGINEERING HASSAN";
  if (upper.includes("SHIVAKUMAR")) return "Shivakumar";
  if (upper.includes("KSAW")) return "KSAWU VIJAYAPURA";
  if (upper.includes("PES") && upper.includes("MANDYA")) return "PES COLLEGE MANDYA";
  if (upper.includes("CHANNARAYAPATNA")) return "GOVT COLLEGE CHANNARAYAPATNA";
  if (upper.includes("YADGIR")) return "GOVT FIRST GRADE WOMENS COLLEGE YADGIRI";
  if (upper.includes("MALLAPPA")) return "MARI MALLAPPA WOMENS COLLEGE MYSORE";
  if (upper.includes("SIDHARTHA") || upper.includes("BIDAR")) return "SIDHARTHA COLLEGE BIDAR";
  if (upper.includes("DADAPHEER")) return "Dadapheer Huballi";
  if (upper.includes("HUBBALLI") || upper.includes("HUBBALI")) return "Hubballi Center ";
  if (upper.includes("ANGADI") || upper.includes("AITM")) return "Angadi Institute of Technology Belagavi";

  return trimmed;
}

export function getCollegeAliases(canonicalName: string): string[] {
  const trimmed = canonicalName.trim();
  for (const [canonical, aliases] of Object.entries(COLLEGE_ALIASES)) {
    if (canonical.trim().toLowerCase() === trimmed.toLowerCase()) {
      return Array.from(new Set([canonical, ...aliases]));
    }
  }
  return [canonicalName];
}


export const RELIGIONS = ["Buddhist", "Christian", "Hindu", "Jain", "Muslim", "Other", "Sikh"] as const;

export const CATEGORIES = ["General", "SC", "ST", "OBC", "Minority"] as const;

export const CASTE_CERTIFICATE_TYPES = ["RD Number", "Upload Physical Document"] as const;

export const SPECIALLY_ABLED_TYPES = [
  "Visual",
  "Locomotive",
  "Hearing",
  "Other",
  "Intellectual",
  "Physical",
  "Speech",
] as const;

export const SPECIALLY_ABLED_SUB_TYPES = [
  "Low Vision",
  "Blindness",
  "One Leg Affected",
  "Both Legs Affected",
  "One Arm Affected",
  "Hard of Hearing",
  "Deaf",
  "Speech and Language Disability",
  "Intellectual Disability",
  "Multiple Disabilities",
] as const;

export const SALUTATIONS = ["Mr.", "Ms.", "Mrs.", "Dr."] as const;

export const STATES = [
  "ANDAMAN AND NICOBAR ISLANDS",
  "ANDHRA PRADESH",
  "ARUNACHAL PRADESH",
  "ASSAM",
  "BIHAR",
  "CHANDIGARH",
  "CHHATTISGARH",
  "DADRA AND NAGAR HAVELI",
  "DAMAN AND DIU",
  "DELHI",
  "GOA",
  "GUJARAT",
  "HARYANA",
  "HIMACHAL PRADESH",
  "JAMMU AND KASHMIR",
  "JHARKHAND",
  "KARNATAKA",
  "KERALA",
  "LAKSHADWEEP",
  "MADHYA PRADESH",
  "MAHARASHTRA",
  "MANIPUR",
  "MEGHALAYA",
  "MIZORAM",
  "NAGALAND",
  "ODISHA",
  "PUDUCHERRY",
  "PUNJAB",
  "RAJASTHAN",
  "SIKKIM",
  "TAMIL NADU",
  "TELANGANA",
  "TRIPURA",
  "UTTAR PRADESH",
  "UTTARAKHAND",
  "WEST BENGAL",
] as const;

export const DISTRICTS: Record<string, readonly string[]> = {
  KARNATAKA: [
    "BAGALKOT",
    "BALLARI",
    "BELAGAVI",
    "BENGALURU RURAL",
    "BENGALURU URBAN",
    "BIDAR",
    "CHAMARAJANAGARA",
    "CHIKKABALLAPURA",
    "CHIKKAMAGALURU",
    "CHITRADURGA",
    "DAKSHINA KANNADA",
    "DAVANAGERE",
    "DHARWAD",
    "GADAG",
    "HASSAN",
    "HAVERI",
    "KALABURAGI",
    "KODAGU",
    "KOLAR",
    "KOPPAL",
    "MANDYA",
    "MYSURU",
    "RAICHUR",
    "RAMANAGARA",
    "SHIVAMOGGA",
    "TUMAKURU",
    "UDUPI",
    "UTTARA KANNADA",
    "VIJAYANAGARA",
    "VIJAYAPURA",
    "YADGIR",
  ],
};

export const TALUKS: Record<string, readonly string[]> = {
  "BAGALKOT": ["Bagalkot", "Badami", "Bilgi", "Hunagund", "Jamkhandi", "Mudhol", "Guledgudda", "Rabkavi Banhatti", "Ilkal"],
  "BALLARI": ["Ballari", "Kurugodu", "Sandur", "Siruguppa", "Kampli"],
  "BELAGAVI": ["Belagavi", "Athani", "Bailhongal", "Chikodi", "Gokak", "Hukkeri", "Khanapur", "Raybag", "Ramdurg", "Saundatti", "Nippani", "Kagwad", "Mudalgi"],
  "BENGALURU RURAL": ["Devanahalli", "Doddaballapura", "Hoskote", "Nelamangala"],
  "BENGALURU URBAN": ["Bengaluru East", "Bengaluru North", "Bengaluru South", "Anekal", "Yelahanka"],
  "BIDAR": ["Bidar", "Bhalki", "Humnabad", "Aurad", "Basavakalyan", "Chitgoppa", "Kamalnagar"],
  "CHAMARAJANAGARA": ["Chamarajanagara", "Gundlupet", "Kollegal", "Yelandur", "Hanur"],
  "CHIKKABALLAPURA": ["Chikkaballapura", "Bagepalli", "Chintamani", "Gauribidanur", "Sidlaghatta", "Gudibanda"],
  "CHIKKAMAGALURU": ["Chikkamagaluru", "Kadur", "Koppa", "Mudigere", "Sringeri", "Tarikere", "Narasimharajapura"],
  "CHITRADURGA": ["Chitradurga", "Challakere", "Hiriyur", "Holalkere", "Hosadurga", "Molakalmuru"],
  "DAKSHINA KANNADA": ["Mangaluru", "Bantwal", "Puttur", "Sullia", "Belthangady", "Moodabidri", "Kadaba"],
  "DAVANAGERE": ["Davanegere", "Harihar", "Channagiri", "Honnali", "Jagalur"],
  "DHARWAD": ["Dharwad", "Hubballi", "Kalghatgi", "Kundgol", "Navalagund", "Alnavar", "Annigeri"],
  "GADAG": ["Gadag", "Ron", "Shirahatti", "Nargund", "Mundargi", "Gajendragad", "Lakshmeshwar"],
  "HASSAN": ["Hassan", "Alur", "Arkalgud", "Arsikere", "Belur", "Channarayapatna", "Holenarasipura", "Sakleshpur"],
  "HAVERI": ["Haveri", "Byadgi", "Hangal", "Hirekerur", "Ranebennur", "Savanur", "Shiggaon", "Rattihalli"],
  "KALABURAGI": ["Kalaburagi", "Afzalpur", "Aland", "Chincholi", "Chitapur", "Jevargi", "Sedam", "Shahabad", "Kalgi", "Kamalapur", "Yadrami"],
  "KODAGU": ["Madikeri", "Somwarpet", "Virajpet", "Kushalnagar", "Ponnampet"],
  "KOLAR": ["Kolar", "Bangarapet", "Malur", "Mulbagal", "Srinivaspur", "KGF"],
  "KOPPAL": ["Koppal", "Gangavathi", "Kushtagi", "Yelburga", "Kanakagiri", "Karatagi", "Kuknoor"],
  "MANDYA": ["Mandya", "Maddur", "Malavalli", "Srirangapatna", "Pandavapura", "Krishnarajapet", "Nagamangala"],
  "MYSURU": ["Mysuru", "Nanjangud", "Hunsur", "T Narasipura", "Periyapatna", "KR Nagar", "Saragur", "Saligrama"],
  "RAICHUR": ["Raichur", "Devadurga", "Lingsugur", "Manvi", "Sindhanur", "Maski", "Sirwar"],
  "RAMANAGARA": ["Ramanagara", "Channapatna", "Kanakapura", "Magadi"],
  "SHIVAMOGGA": ["Shivamogga", "Bhadravathi", "Hosanagara", "Sagar", "Shikaripur", "Sorab", "Thirthahalli"],
  "TUMAKURU": ["Tumakuru", "Chiknayakanhalli", "Gubbi", "Koratagere", "Kunigal", "Madhugiri", "Pavagada", "Sira", "Tiptur", "Turuvekere"],
  "UDUPI": ["Udupi", "Karkala", "Kundapura", "Byndoor", "Brahmavara", "Kaup", "Hebri"],
  "UTTARA KANNADA": ["Karwar", "Ankola", "Bhatkal", "Haliyal", "Honnavar", "Joida", "Kumta", "Mundgod", "Siddapur", "Sirsi", "Yellapur", "Dandeli"],
  "VIJAYANAGARA": ["Hosapete", "Harapanahalli", "Hagaribommanahalli", "Kottur", "Hadagali", "Kudligi"],
  "VIJAYAPURA": ["Vijayapura", "Indi", "Muddebihal", "Sindgi", "Basavana Bagewadi", "Babaleshwar", "Kolhar", "Nidgundi", "Devara Hipparagi", "Chadchan", "Talikoti"],
  "YADGIR": ["Yadgir", "Shahapur", "Shorapur", "Gurmitkal", "Hunasagi", "Wadagera"]
};

export const EDUCATION_LEVELS = [
  "10th",
  "PUC",
  "Diploma",
  "ITI",
  "Graduate",
  "Post Graduate",
] as const;

export const STREAMS: Record<string, readonly string[]> = {
  PUC: ["Arts", "Commerce", "Science"],
  Diploma: ["Diploma"],
  ITI: ["ITI"],
  Graduate: ["Arts", "Commerce", "Science", "Engineering", "Management", "Law", "Education"],
  "Post Graduate": ["Arts", "Commerce", "Science", "Engineering", "Management", "Law"],
  "High School": ["General"],
};

export const SUBJECTS: Record<string, readonly string[]> = {
  Arts: ["History", "Economics", "Political Science", "Sociology", "Kannada"],
  Commerce: ["Accountancy", "Business Studies", "Statistics"],
  Science: ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science"],
  Engineering: ["Civil", "Mechanical", "Electrical", "Electronics", "Computer Science"],
  Management: ["Finance", "Marketing", "Human Resources", "Operations"],
  Diploma: ["Civil", "Mechanical", "Electrical", "Electronics", "Computer Science"],
  ITI: ["Fitter", "Electrician", "Welder", "Turner", "Mechanic"],
};

export const LANGUAGES_KNOWN = ["Kannada", "English", "Hindi", "Telugu", "Tamil"] as const;

export const SKILLS = [
  "AWS Academy Cloud Foundation",
  "Computer Hardware and Networking",
  "Computer Programming",
  "AWS Solution Architect Associate",
  "Business Development Guidance",
  "Cisco IT Essentials",
  "AWS Solution Architect Associate with Academy Cloud Foundation",
  "Accounts Executive - Tally ERP 9",
] as const;


export const TRAINING_DURATIONS = ["2 - 4 weeks"] as const;

export const PASSING_YEARS = Array.from({ length: 2026 - 2017 + 1 }, (_, i) => String(2017 + i));

export const LAST_SALARY = ["Less than 10,000", "10,000 to 20,000", "20,000 and 25,000", "25,000 and above"] as const;

export const EXPECTED_SALARY = [
  "7,500 to 10,000",
  "10,000 to 15,000",
  "15,000 to 20,000",
  "20,000 to 25,000",
  "25,000 and above",
] as const;

export const MIGRATION_AREAS = ["Outside District", "Outside State", "Outside Country", "Bangalore"] as const;
