export const RELIGIONS = ["Buddhist", "Christian", "Hindu", "Jain", "Muslim", "Other", "Sikh"] as const;

export const CATEGORIES = ["General", "SC", "ST", "OBC", "Minority"] as const;

export const OBC_SUB_CATEGORIES = ["General", "SC", "ST", "OBC", "Minority"] as const;

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

export const TRAINEE_CLASSIFICATIONS = ["Ex-Service Personnel"] as const;

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
  "No Schooling",
  "Primary School",
  "Middle School",
  "High School",
  "PUC / Diploma / ITI",
  "Graduate",
  "Post Graduate",
  "10th",
] as const;

export const STREAMS: Record<string, readonly string[]> = {
  "PUC / Diploma / ITI": ["Arts", "Commerce", "Science", "Diploma", "ITI"],
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
  "Tractor operator",
  "Animal Health Worker",
  "Organic grower",
  "Quality Seed Grower",
  "Dairy Farmer/ Entrepreneur",
  "Small poultry farmer",
  "Green House Operator",
  "Micro Irrigation Technician",
  "Gardener",
  "Aquaculture worker",
  "In-line Checker",
  "Sewing Machine Operator",
  "Sewing Machine Operator - knits",
  "Pressman",
  "Hand Embroiderer",
  "Packer",
  "Export Assistant",
  "Washing Machine Operator",
  "Self Employed Tailor",
  "Measurement checker",
  "Store Keeper",
  "Cutting Supervisor",
  "Specialised Sewing Machine Operator",
  "Commercial Vehicle Driver Level 4",
  "Auto / E Rickshaw Driver & Service Technician",
  "Automotive Service Technician (Two and Three Wheelers)",
  "Automotive Electrician Level 4",
  "Accessory Fitter",
  "Assistant Beauty Therapist",
  "Beauty Therapist",
  "Assistant Hair Stylist",
  "Hair Stylist",
  "Life Insurance Agent",
  "Equity Dealer",
  "Mutual Fund Agent",
  "Debt Recovery Agent",
  "Micro Finance Executive",
  "Accounts Executive - Payroll",
  "CNC Operator Turning",
  "Draughtsman Mechanical",
  "Fitter Fabrication",
  "Fitter Mechanical Assembly",
  "Mason General",
  "Mason Tiling",
  "Bar Bender and Steel Fixer",
  "Assistant Electrician",
  "General Housekeeper",
  "Child Caretaker",
  "Elderly Caretaker (Non-Clinical)",
  "CCTV Installation Technician",
  "Field Technician Computing and Peripherals",
  "Mobile Phone Hardware Repair Technician",
  "Solar Panel Installation Technician",
  "TV Repair Technician",
  "Craft Baker",
  "Baking Technician",
  "Carpenter - Wooden Furniture",
  "Solar PV Installer (Suryamitra)",
  "Junior Software Developer",
  "Domestic Data entry Operator",
  "CRM Domestic Voice",
  "Forklift Operator",
  "Warehouse Picker",
  "Courier Delivery Executive",
  "General Duty Assistant",
  "Home Health Aide",
  "Emergency Medical Technician-Basic",
] as const;

export const TRAINING_DURATIONS = [
  "less than 2 weeks",
  "2 - 4 weeks",
  "4 - 6 weeks",
  "6 - 8 weeks",
  "8 - 12 weeks",
  "12 - 24 weeks",
] as const;

export const LAST_SALARY = ["Less than 10,000", "10,000 to 20,000", "20,000 and 25,000", "25,000 and above"] as const;

export const EXPECTED_SALARY = [
  "7,500 to 10,000",
  "10,000 to 15,000",
  "15,000 to 20,000",
  "20,000 to 25,000",
  "25,000 and above",
] as const;

export const MIGRATION_AREAS = ["Outside District", "Outside State", "Outside Country", "Bangalore"] as const;
