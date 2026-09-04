import {
  COLLEGES,
  RELIGIONS,
  CATEGORIES,
  SALUTATIONS,
  STATES,
  DISTRICTS,
  EDUCATION_LEVELS,
  SKILLS,
  TRAINING_DURATIONS,
  PASSING_YEARS,
  LAST_SALARY,
  CASTE_CERTIFICATE_TYPES,
} from "@/components/reg/options";

export type ColumnDef = {
  key: string;
  label: string;
  group: string;
  type?: "text" | "date" | "array" | "bool" | "select";
  options?: readonly string[];
};

export const STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Pending Document"] as const;

export const COLUMNS: ColumnDef[] = [
  { key: "reference_number", label: "Reference ID", group: "Meta" },
  { key: "saf_number", label: "SAF Number", group: "Meta" },
  { key: "created_at", label: "Submitted On", group: "Meta", type: "date" },
  { key: "status", label: "Status", group: "Meta", type: "select", options: STATUS_OPTIONS },
  { key: "admin_notes", label: "Admin Notes", group: "Meta" },

  { key: "institution_name", label: "College / Institute / University", group: "Institution", type: "select", options: COLLEGES },
  { key: "center_location", label: "Center Location", group: "Institution", type: "select", options: DISTRICTS.KARNATAKA },

  { key: "first_name", label: "First Name", group: "Personal" },
  { key: "last_name", label: "Last Name", group: "Personal" },
  { key: "phone", label: "Phone", group: "Personal" },
  { key: "email", label: "Email", group: "Personal" },
  { key: "dob", label: "Date Of Birth", group: "Personal", type: "date" },
  { key: "gender", label: "Gender", group: "Personal", type: "select", options: ["Male", "Female", "Other"] },
  { key: "marital_status", label: "Marital Status", group: "Personal", type: "select", options: ["Single", "Married", "Divorced", "Widowed"] },
  { key: "specially_abled", label: "Specially Abled", group: "Personal", type: "select", options: ["No", "Yes"] },
  { key: "sa_types", label: "Disability Types", group: "Personal", type: "array" },
  { key: "sa_sub_types", label: "Disability Sub Types", group: "Personal", type: "array" },
  { key: "sa_proof", label: "Disability Proof", group: "Personal" },
  { key: "religion", label: "Religion", group: "Personal", type: "select", options: RELIGIONS },
  { key: "category", label: "Category", group: "Personal", type: "select", options: CATEGORIES },
  { key: "caste", label: "Caste", group: "Personal" },
  { key: "nigama", label: "Nigama", group: "Personal" },
  { key: "rd_number", label: "RD Number", group: "Personal" },
  { key: "caste_cert_type", label: "Caste Certificate Type", group: "Personal", type: "select", options: CASTE_CERTIFICATE_TYPES },
  { key: "caste_cert_issue_date", label: "Caste Certificate Issue Date", group: "Personal", type: "date" },
  { key: "caste_cert_expiry_date", label: "Caste Certificate Expiry Date", group: "Personal", type: "date" },
  { key: "caste_proof", label: "Caste Proof", group: "Personal" },
  { key: "aadhaar_number", label: "Aadhaar Number", group: "Personal" },

  { key: "guardianship", label: "Guardianship", group: "Guardian", type: "select", options: ["Father", "Mother", "Guardian"] },
  { key: "guardian_salutation", label: "Salutation", group: "Guardian", type: "select", options: SALUTATIONS },
  { key: "guardian_first_name", label: "Guardian First Name", group: "Guardian" },
  { key: "guardian_last_name", label: "Guardian Last Name", group: "Guardian" },

  { key: "cur_location", label: "Current Location Type", group: "Current Address", type: "select", options: ["Urban", "Rural"] },
  { key: "cur_street1", label: "Current Street Address", group: "Current Address" },
  { key: "cur_street2", label: "Current Street Address 2", group: "Current Address" },
  { key: "cur_state", label: "Current State", group: "Current Address", type: "select", options: STATES },
  { key: "cur_district", label: "Current District", group: "Current Address" },
  { key: "cur_taluk", label: "Current Taluk", group: "Current Address" },
  { key: "cur_city", label: "Current City", group: "Current Address" },
  { key: "cur_village", label: "Current Village", group: "Current Address" },
  { key: "cur_zip", label: "Current Zip", group: "Current Address" },

  { key: "same_address", label: "Same As Current", group: "Permanent Address", type: "select", options: ["Yes", "No"] },
  { key: "per_location", label: "Permanent Location Type", group: "Permanent Address", type: "select", options: ["Urban", "Rural"] },
  { key: "per_street1", label: "Permanent Street Address", group: "Permanent Address" },
  { key: "per_street2", label: "Permanent Street Address 2", group: "Permanent Address" },
  { key: "per_state", label: "Permanent State", group: "Permanent Address", type: "select", options: STATES },
  { key: "per_district", label: "Permanent District", group: "Permanent Address" },
  { key: "per_taluk", label: "Permanent Taluk", group: "Permanent Address" },
  { key: "per_city", label: "Permanent City", group: "Permanent Address" },
  { key: "per_village", label: "Permanent Village", group: "Permanent Address" },
  { key: "per_zip", label: "Permanent Zip", group: "Permanent Address" },

  { key: "education", label: "Education", group: "Education", type: "select", options: EDUCATION_LEVELS },
  { key: "stream", label: "Stream", group: "Education" },
  { key: "subject", label: "Subject", group: "Education" },
  { key: "language_of_instruction", label: "Language Of Instruction", group: "Education", type: "select", options: ["English", "Kannada", "Hindi"] },
  { key: "other_language", label: "Other Language", group: "Education" },
  { key: "year_of_passing", label: "Year Of Passing", group: "Education", type: "select", options: PASSING_YEARS },
  { key: "languages_known", label: "Languages Known", group: "Education", type: "array" },
  { key: "past_skill_experience", label: "Past Skill Experience", group: "Education", type: "select", options: ["No", "Yes"] },
  { key: "skill_experience_proof", label: "Skill Experience Proof", group: "Education" },
  { key: "skill_sought", label: "Skill Sought / Course", group: "Education", type: "select", options: SKILLS },
  { key: "training_duration", label: "Training Duration", group: "Education", type: "select", options: TRAINING_DURATIONS },
  { key: "apprenticeship", label: "Apprenticeship", group: "Education", type: "select", options: ["No", "Yes"] },

  { key: "currently_employed", label: "Currently Employed", group: "Employment", type: "select", options: ["No", "Yes"] },
  { key: "employed_from", label: "Employed From", group: "Employment", type: "date" },
  { key: "current_employer", label: "Current Employer", group: "Employment" },
  { key: "current_designation", label: "Current Designation", group: "Employment" },
  { key: "previously_employed", label: "Previously Employed", group: "Employment", type: "select", options: ["No", "Yes"] },
  { key: "work_experience", label: "Work Experience", group: "Employment" },
  { key: "last_employer", label: "Last Employer", group: "Employment" },
  { key: "last_designation", label: "Last Designation", group: "Employment" },
  { key: "last_salary", label: "Last Drawn Salary", group: "Employment", type: "select", options: LAST_SALARY },
  { key: "last_employer_address", label: "Last Employer Address", group: "Employment" },
  { key: "employment_proof", label: "Employment Proof", group: "Employment" },

  { key: "education_proof", label: "Proof Of Education", group: "Documents" },
  { key: "age_proof", label: "Proof Of Age", group: "Documents" },
  { key: "aadhaar_proof", label: "Aadhaar Proof (Upload Aadhaar Photo)", group: "Documents" },
  { key: "profile_image", label: "Profile Image", group: "Documents" },
  { key: "declaration_accepted", label: "Declaration Accepted", group: "Documents", type: "bool" },
];

export const EDITABLE_KEYS = COLUMNS.filter((c) => c.key !== "created_at").map((c) => c.key);

export function formatCell(value: unknown, type?: ColumnDef["type"]): string {
  if (value === null || value === undefined || value === "") return "N/A";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (type === "bool") return value ? "Yes" : "No";
  if (type === "date") {
    const d = new Date(String(value));
    if (!Number.isNaN(d.getTime())) {
      return String(value).length > 10 ? d.toLocaleString("en-IN") : d.toLocaleDateString("en-IN");
    }
  }
  return String(value);
}
