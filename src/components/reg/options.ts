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
    "VIJAYAPURA",
    "YADGIR",
  ],
};

export const TALUKS: Record<string, readonly string[]> = {
  "BENGALURU URBAN": ["Bengaluru East", "Bengaluru North", "Bengaluru South", "Anekal", "Yelahanka"],
  "BENGALURU RURAL": ["Devanahalli", "Doddaballapura", "Hoskote", "Nelamangala"],
  MYSURU: ["Mysuru", "Nanjangud", "Hunsur", "T Narasipura", "Periyapatna"],
  BELAGAVI: ["Belagavi", "Bailhongal", "Chikodi", "Gokak", "Athani"],
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
