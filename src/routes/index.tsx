import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { PageBanner, SiteHeader, SiteFooter } from "@/components/reg/SiteChrome";
import {
  DateField,
  Field,
  FileField,
  MultiSelect,
  RadioGroup,
  Row,
  Section,
  SelectField,
  TextField,
} from "@/components/reg/fields";
import { CASTES, CASTE_CATEGORIES, CASTE_NAMES, NIGAMAS } from "@/components/reg/castes";
import {
  CASTE_CERTIFICATE_TYPES,
  CATEGORIES,
  DISTRICTS,
  EDUCATION_LEVELS,
  LANGUAGES_KNOWN,
  LAST_SALARY,
  RELIGIONS,
  SALUTATIONS,
  PASSING_YEARS,
  SKILLS,
  SPECIALLY_ABLED_SUB_TYPES,
  SPECIALLY_ABLED_TYPES,
  STATES,
  STREAMS,
  SUBJECTS,
  TALUKS,
  TRAINING_DURATIONS,
} from "@/components/reg/options";


const title = "Registration Form | Karnataka Skill Development Corporation";
const description =
  "Register with Kaushalkar for skilling, apprenticeship, employment or self-employment with the Karnataka Skill Development Corporation.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegistrationPage,
});

type Address = {
  location: string;
  street1: string;
  street2: string;
  state: string;
  district: string;
  taluk: string;
  city: string;
  village: string;
  zip: string;
};

const emptyAddress = (): Address => ({
  location: "Urban",
  street1: "",
  street2: "",
  state: "",
  district: "",
  taluk: "",
  city: "",
  village: "",
  zip: "",
});

type Errors = Record<string, string>;

function RegistrationPage() {
  // Center / Institution
  const [institutionName, setInstitutionName] = useState("");
  const [centerLocation, setCenterLocation] = useState("");

  // Personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [marital, setMarital] = useState("Single");
  const [speciallyAbled, setSpeciallyAbled] = useState("No");
  const [saTypes, setSaTypes] = useState<string[]>([]);
  const [saSubTypes, setSaSubTypes] = useState<string[]>([]);
  const [saProof, setSaProof] = useState("");
  const [religion, setReligion] = useState("");
  const [category, setCategory] = useState("General");
  const [caste, setCaste] = useState("");
  const casteInfo = CASTES.find((c) => c.name === caste);
  const [casteSubCategory, setCasteSubCategory] = useState("");
  const [rdNumber, setRdNumber] = useState("");
  const [casteCertIssueDate, setCasteCertIssueDate] = useState("");
  const [casteProof, setCasteProof] = useState("");

  const certExpiryDate = casteCertIssueDate
    ? new Date(new Date(casteCertIssueDate).setFullYear(new Date(casteCertIssueDate).getFullYear() + 6))
    : null;
  const isCertValid = certExpiryDate ? certExpiryDate >= new Date() : false;
  const [aadhaarNumber, setAadhaarNumber] = useState("");


  // Guardian
  const [guardianship, setGuardianship] = useState("Father");
  const [salutation, setSalutation] = useState("Mr.");
  const [gFirstName, setGFirstName] = useState("");
  const [gLastName, setGLastName] = useState("");

  // Address
  const [current, setCurrent] = useState<Address>(emptyAddress());
  const [sameAddress, setSameAddress] = useState("No");
  const [permanent, setPermanent] = useState<Address>(emptyAddress());

  // Education
  const [education, setEducation] = useState("");
  const [stream, setStream] = useState("");
  const [subject, setSubject] = useState("");
  const [langInstruction, setLangInstruction] = useState("English");
  const [otherLanguage, setOtherLanguage] = useState("");
  const [yearOfPassing, setYearOfPassing] = useState("");
  const [languagesKnown, setLanguagesKnown] = useState<string[]>([]);
  const [pastSkillExp, setPastSkillExp] = useState("No");
  const [skillExpProof, setSkillExpProof] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [trainingDuration, setTrainingDuration] = useState("");
  const [apprenticeship, setApprenticeship] = useState("No");

  // Employment
  const [currentlyEmployed, setCurrentlyEmployed] = useState("No");
  const [employedFrom, setEmployedFrom] = useState("");
  const [currentEmployer, setCurrentEmployer] = useState("");
  const [currentDesignation, setCurrentDesignation] = useState("");
  const [previouslyEmployed, setPreviouslyEmployed] = useState("No");
  const [workExperience, setWorkExperience] = useState("");
  const [lastEmployer, setLastEmployer] = useState("");
  const [lastDesignation, setLastDesignation] = useState("");
  const [lastSalary, setLastSalary] = useState("");
  const [lastEmployerAddress, setLastEmployerAddress] = useState("");
  const [empProof, setEmpProof] = useState("");

  // Documents & submit
  const [eduProof, setEduProof] = useState("");
  const [ageProof, setAgeProof] = useState("");
  const [profileImg, setProfileImg] = useState("");
  const [declaration, setDeclaration] = useState(true);

  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generatedRefId, setGeneratedRefId] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Password Protection for Edit and Link Actions
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTargetAction, setAuthTargetAction] = useState<"edit" | "link" | null>(null);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isActionAuthenticated, setIsActionAuthenticated] = useState(false);

  // Edit Existing Application States
  const [isEditing, setIsEditing] = useState(false);
  const [activeEditingRef, setActiveEditingRef] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [inputLookupRef, setInputLookupRef] = useState("");
  const [editSearchResults, setEditSearchResults] = useState<any[]>([]);
  const [editSearching, setEditSearching] = useState(false);
  const [editLookupLoading, setEditLookupLoading] = useState(false);
  const [editLookupError, setEditLookupError] = useState("");

  // Link SAF Number States
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkSearchInput, setLinkSearchInput] = useState("");
  const [linkSearchResults, setLinkSearchResults] = useState<any[]>([]);
  const [selectedLinkRecord, setSelectedLinkRecord] = useState<any | null>(null);
  const [inputSafDigits, setInputSafDigits] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkSearching, setLinkSearching] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkSuccessMessage, setLinkSuccessMessage] = useState("");

  const streamOptions = useMemo(() => STREAMS[education] ?? [], [education]);
  const subjectOptions = useMemo(() => SUBJECTS[stream] ?? [], [stream]);

  const setAddr = (which: "current" | "permanent", patch: Partial<Address>) => {
    const setter = which === "current" ? setCurrent : setPermanent;
    setter((prev) => ({ ...prev, ...patch }));
  };

  const validateAddress = (prefix: string, a: Address, e: Errors) => {
    if (!a.street1.trim()) e[`${prefix}_street1`] = "Street address is required";
    if (!a.state) e[`${prefix}_state`] = "State is required";
    if (!a.district) e[`${prefix}_district`] = "District is required";
    if (!a.taluk) e[`${prefix}_taluk`] = "Taluk is required";
    if (a.location === "Urban" && !a.city.trim()) e[`${prefix}_city`] = "City is required";
    if (a.location === "Rural" && !a.village.trim()) e[`${prefix}_village`] = "Village is required";
    if (!/^\d{6}$/.test(a.zip)) e[`${prefix}_zip`] = "Enter a valid 6 digit postal code";
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!institutionName.trim()) e["institutionName"] = "Name of College / Institute / University is required";
    if (!centerLocation) e["centerLocation"] = "Center location is required";
    if (!firstName.trim()) e["firstName"] = "First name is required";
    if (!lastName.trim()) e["lastName"] = "Last name is required";
    if (!gender) e["gender"] = "Gender is required";
    if (!marital) e["marital"] = "Marital status is required";
    if (!/^[6-9]\d{9}$/.test(phone)) e["phone"] = "Enter a valid 10 digit phone number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e["email"] = "Enter a valid email address";
    if (!dob) {
      e["dob"] = "Date of birth is required";
    } else {
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        e["dob"] = "Applicant must be at least 18 years old";
      } else if (age > 25) {
        e["dob"] = "Applicant must be 25 years old or younger";
      }
    }
    if (!religion) e["religion"] = "Religion is required";
    if (speciallyAbled === "Yes") {
      if (saTypes.length === 0) e["saTypes"] = "Select at least one type";
      if (saSubTypes.length === 0) e["saSubTypes"] = "Select at least one sub type";
    }
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      e["aadhaarNumber"] = "Enter a valid 12 digit Aadhaar number";
    }
    if (category !== "General") {
      if (category === "OBC") {
        if (!caste) e["caste"] = "Caste is required";
        if (!casteSubCategory) e["casteSubCategory"] = "Category is required";
      }
      if (!rdNumber.trim()) e["rdNumber"] = "RD number is required";
      if (!casteCertIssueDate) e["casteCertIssueDate"] = "Certificate issue date is required";
      if (!casteProof) e["casteProof"] = "Caste proof document upload is required";
    }
    if (!gFirstName.trim()) e["gFirstName"] = "First name is required";
    if (!gLastName.trim()) e["gLastName"] = "Last name is required";


    validateAddress("cur", current, e);
    if (sameAddress === "No") validateAddress("per", permanent, e);

    if (!education) e["education"] = "Education is required";
    if (education !== "10th") {
      if (streamOptions.length > 0 && !stream) e["stream"] = "Stream is required";
      if (subjectOptions.length > 0 && !subject) e["subject"] = "Subject is required";
    }
    if (langInstruction === "Other" && !otherLanguage.trim()) e["otherLanguage"] = "Other language is required";
    if (!yearOfPassing) e["yearOfPassing"] = "Year of passing is required";
    if (languagesKnown.length === 0) e["languagesKnown"] = "Select at least one language";
    if (pastSkillExp === "Yes" && !skillExpProof) e["skillExpProof"] = "Proof of past skill experience is required";
    if (skills.length !== 1) e["skills"] = "Select one skill";
    if (!trainingDuration) e["trainingDuration"] = "Preferred duration is required";

    if (currentlyEmployed === "Yes") {
      if (!employedFrom) e["employedFrom"] = "Employed from is required";
      if (!currentEmployer.trim()) e["currentEmployer"] = "Current employer is required";
      if (!currentDesignation.trim()) e["currentDesignation"] = "Current designation is required";
    }
    if (previouslyEmployed === "Yes") {
      if (!workExperience.trim()) e["workExperience"] = "Work experience is required";
      if (!lastEmployer.trim()) e["lastEmployer"] = "Last employer is required";
      if (!lastDesignation.trim()) e["lastDesignation"] = "Last designation is required";
      if (!lastSalary) e["lastSalary"] = "Last drawn salary is required";
      if (!lastEmployerAddress.trim()) e["lastEmployerAddress"] = "Address of last employer is required";
      if (!empProof) e["empProof"] = "Proof of experience is required";
    }

    if (!eduProof) e["eduProof"] = "Proof of education is required";
    if (!ageProof) e["ageProof"] = "Proof of age is required";
    if (!profileImg) e["profileImg"] = "Profile image is required";
    if (!declaration) e["declaration"] = "You must accept the declaration";
    return e;
  };

  const resetForm = () => {
    setInstitutionName("");
    setCenterLocation("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setDob("");
    setGender("Male");
    setMarital("Single");
    setSpeciallyAbled("No");
    setSaTypes([]);
    setSaSubTypes([]);
    setSaProof("");
    setReligion("");
    setCategory("General");
    setCaste("");
    setCasteSubCategory("");
    setRdNumber("");
    setCasteProof("");
    setAadhaarNumber("");
    setGuardianship("Father");
    setSalutation("Mr.");
    setGFirstName("");
    setGLastName("");
    setCurrent(emptyAddress());
    setSameAddress("No");
    setPermanent(emptyAddress());
    setEducation("");
    setStream("");
    setSubject("");
    setLangInstruction("English");
    setOtherLanguage("");
    setYearOfPassing("");
    setLanguagesKnown([]);
    setPastSkillExp("No");
    setSkillExpProof("");
    setSkills([]);
    setTrainingDuration("");
    setApprenticeship("No");
    setCurrentlyEmployed("No");
    setEmployedFrom("");
    setCurrentEmployer("");
    setCurrentDesignation("");
    setPreviouslyEmployed("No");
    setWorkExperience("");
    setLastEmployer("");
    setLastDesignation("");
    setLastSalary("");
    setLastEmployerAddress("");
    setEmpProof("");
    setEduProof("");
    setAgeProof("");
    setProfileImg("");
    setIsEditing(false);
    setActiveEditingRef("");
    setErrors({});
  };

  const handleSearchForEdit = async (term: string) => {
    setInputLookupRef(term);
    const clean = term.trim().toUpperCase();
    if (!clean) {
      setEditSearchResults([]);
      return;
    }

    setEditSearching(true);
    setEditLookupError("");

    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc("search_registrations_for_link", {
        search_term: clean,
      });

      if (!rpcErr && rpcData) {
        setEditSearchResults(rpcData);
      } else {
        const { data: directData } = await supabase
          .from("registrations")
          .select("reference_number, first_name, last_name, phone, email")
          .not("reference_number", "is", null)
          .or(`reference_number.ilike.%${clean}%,first_name.ilike.%${clean}%,last_name.ilike.%${clean}%,phone.ilike.%${clean}%`)
          .limit(10);
        setEditSearchResults(directData || []);
      }
    } catch (err: any) {
      console.error("Edit search error:", err);
    } finally {
      setEditSearching(false);
    }
  };

  const loadByReferenceId = async (refOverride?: string) => {
    const targetRef = (refOverride || inputLookupRef).trim().toUpperCase();
    if (!targetRef) {
      setEditLookupError("Please enter or select a Reference ID (e.g. KSAW 001)");
      return;
    }
    setEditLookupLoading(true);
    setEditLookupError("");

    try {
      // 1. Try querying via RPC or direct select
      let rowData: any = null;

      const { data: rpcData, error: rpcError } = await supabase.rpc("get_registration_by_ref", {
        ref_id: targetRef,
      });

      if (!rpcError && rpcData && rpcData.length > 0) {
        rowData = rpcData[0];
      } else {
        const { data: directData, error: directError } = await supabase
          .from("registrations")
          .select("*")
          .ilike("reference_number", targetRef)
          .maybeSingle();

        if (!directError && directData) {
          rowData = directData;
        }
      }

      if (!rowData) {
        setEditLookupError(`No application found with Reference ID "${targetRef}". Please check and try again.`);
        return;
      }

      // Prefill form states
      setInstitutionName(rowData.institution_name || "");
      setCenterLocation(rowData.center_location || "");
      setFirstName(rowData.first_name || "");
      setLastName(rowData.last_name || "");
      setPhone(rowData.phone || "");
      setEmail(rowData.email || "");
      setDob(rowData.dob ? String(rowData.dob).split("T")[0] : "");
      setGender(rowData.gender || "Male");
      setMarital(rowData.marital_status || "Single");
      setSpeciallyAbled(rowData.specially_abled || "No");
      setSaTypes(rowData.sa_types || []);
      setSaSubTypes(rowData.sa_sub_types || []);
      setSaProof(rowData.sa_proof || "");
      setReligion(rowData.religion || "");
      setCategory(rowData.category || "General");
      setCaste(rowData.caste || "");
      setCasteSubCategory(rowData.caste_sub_category || "");
      setRdNumber(rowData.rd_number || "");
      setCasteCertIssueDate(rowData.caste_cert_issue_date ? String(rowData.caste_cert_issue_date).split("T")[0] : "");
      setCasteProof(rowData.caste_proof || "");
      setAadhaarNumber(rowData.aadhaar_number || "");
      setAgeProof(rowData.aadhaar_proof || rowData.age_proof || "");
      setGuardianship(rowData.guardianship || "Father");
      setSalutation(rowData.guardian_salutation || "Mr.");
      setGFirstName(rowData.guardian_first_name || "");
      setGLastName(rowData.guardian_last_name || "");

      setCurrent({
        location: rowData.cur_location || "Urban",
        street1: rowData.cur_street1 || "",
        street2: rowData.cur_street2 || "",
        state: rowData.cur_state || "",
        district: rowData.cur_district || "",
        taluk: rowData.cur_taluk || "",
        city: rowData.cur_city || "",
        village: rowData.cur_village || "",
        zip: rowData.cur_zip || "",
      });

      setSameAddress(rowData.same_address || "No");

      setPermanent({
        location: rowData.per_location || "Urban",
        street1: rowData.per_street1 || "",
        street2: rowData.per_street2 || "",
        state: rowData.per_state || "",
        district: rowData.per_district || "",
        taluk: rowData.per_taluk || "",
        city: rowData.per_city || "",
        village: rowData.per_village || "",
        zip: rowData.per_zip || "",
      });

      setEducation(rowData.education || "");
      setStream(rowData.stream || "");
      setSubject(rowData.subject || "");
      setLangInstruction(rowData.language_of_instruction || "English");
      setOtherLanguage(rowData.other_language || "");
      setYearOfPassing(rowData.year_of_passing || "");
      setLanguagesKnown(rowData.languages_known || []);
      setPastSkillExp(rowData.past_skill_experience || "No");
      setSkillExpProof(rowData.skill_experience_proof || "");
      setSkills(rowData.skill_sought ? [rowData.skill_sought] : []);
      setTrainingDuration(rowData.training_duration || "");
      setApprenticeship(rowData.apprenticeship || "No");
      setCurrentlyEmployed(rowData.currently_employed || "No");
      setEmployedFrom(rowData.employed_from ? String(rowData.employed_from).split("T")[0] : "");
      setCurrentEmployer(rowData.current_employer || "");
      setCurrentDesignation(rowData.current_designation || "");
      setPreviouslyEmployed(rowData.previously_employed || "No");
      setWorkExperience(rowData.work_experience || "");
      setLastEmployer(rowData.last_employer || "");
      setLastDesignation(rowData.last_designation || "");
      setLastSalary(rowData.last_salary || "");
      setLastEmployerAddress(rowData.last_employer_address || "");
      setEmpProof(rowData.employment_proof || "");
      setEduProof(rowData.education_proof || "");
      setProfileImg(rowData.profile_image || "");
      setDeclaration(true);

      setIsEditing(true);
      setActiveEditingRef(targetRef);
      setShowEditModal(false);
      setInputLookupRef("");
      setEditSearchResults([]);
      setSubmitError("");
      setSubmitted(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Lookup error:", err);
      setEditLookupError(err.message || "Failed to load application data");
    } finally {
      setEditLookupLoading(false);
    }
  };

  const handleSearchForLink = async (term: string) => {
    setLinkSearchInput(term);
    const clean = term.trim().toUpperCase();
    if (!clean) {
      setLinkSearchResults([]);
      return;
    }

    setLinkSearching(true);
    setLinkError("");

    try {
      // Search via RPC function or direct select
      const { data: rpcData, error: rpcErr } = await supabase.rpc("search_registrations_for_link", {
        search_term: clean,
      });

      if (!rpcErr && rpcData) {
        setLinkSearchResults(rpcData);
      } else {
        const { data: directData } = await supabase
          .from("registrations")
          .select("reference_number, first_name, last_name, phone, email, saf_number")
          .not("reference_number", "is", null)
          .or(`reference_number.ilike.%${clean}%,first_name.ilike.%${clean}%,last_name.ilike.%${clean}%,phone.ilike.%${clean}%`)
          .limit(10);
        setLinkSearchResults(directData || []);
      }
    } catch (err: any) {
      console.error("SAF Link search error:", err);
      setLinkError(err.message || "Error searching applications");
    } finally {
      setLinkSearching(false);
    }
  };

  const handleSelectForLink = (rec: any) => {
    setSelectedLinkRecord(rec);
    setLinkSearchResults([]);
    setLinkSearchInput(rec.reference_number || "");
    // If it already had a SAF number (e.g. SAF1477116), strip 'SAF' prefix for the numeric field
    if (rec.saf_number) {
      const digits = rec.saf_number.replace(/^SAF/i, "").trim();
      setInputSafDigits(digits);
    } else {
      setInputSafDigits("");
    }
    setLinkError("");
    setLinkSuccessMessage("");
  };

  const triggerProtectedAction = (action: "edit" | "link") => {
    if (isActionAuthenticated) {
      if (action === "edit") {
        setEditLookupError("");
        setInputLookupRef("");
        setEditSearchResults([]);
        setShowEditModal(true);
      } else {
        setLinkSearchInput("");
        setLinkSearchResults([]);
        setSelectedLinkRecord(null);
        setInputSafDigits("");
        setLinkError("");
        setLinkSuccessMessage("");
        setShowLinkModal(true);
      }
      return;
    }

    setAuthTargetAction(action);
    setEnteredPassword("");
    setAuthError("");
    setShowAuthModal(true);
  };

  const verifyActionPassword = () => {
    if (enteredPassword.trim() === "Gleamator@2025") {
      setIsActionAuthenticated(true);
      setShowAuthModal(false);
      const action = authTargetAction;
      setAuthTargetAction(null);
      setEnteredPassword("");
      setAuthError("");

      if (action === "edit") {
        setEditLookupError("");
        setInputLookupRef("");
        setEditSearchResults([]);
        setShowEditModal(true);
      } else if (action === "link") {
        setLinkSearchInput("");
        setLinkSearchResults([]);
        setSelectedLinkRecord(null);
        setInputSafDigits("");
        setLinkError("");
        setLinkSuccessMessage("");
        setShowLinkModal(true);
      }
    } else {
      setAuthError("Incorrect password. Please try again.");
    }
  };

  const handleSaveSafLink = async () => {
    if (!selectedLinkRecord || !selectedLinkRecord.reference_number) {
      setLinkError("Please select a valid application Reference ID first.");
      return;
    }
    const cleanDigits = inputSafDigits.trim().replace(/^SAF/i, "");
    if (!cleanDigits) {
      setLinkError("Please enter the SAF number digits.");
      return;
    }

    const fullSafNumber = `SAF${cleanDigits}`;
    setLinkLoading(true);
    setLinkError("");
    setLinkSuccessMessage("");

    try {
      const { data: isLinked, error: rpcErr } = await supabase.rpc("link_saf_number", {
        ref_id: selectedLinkRecord.reference_number.trim(),
        saf_num: fullSafNumber,
      });

      if (rpcErr || isLinked === false) {
        // Fallback: direct update matching reference_number
        const { error: directErr } = await (supabase.from("registrations") as any)
          .update({ saf_number: fullSafNumber, updated_at: new Date().toISOString() })
          .ilike("reference_number", selectedLinkRecord.reference_number.trim());
        
        if (directErr && rpcErr) throw (rpcErr || directErr);
      }

      setLinkSuccessMessage(`Reference ID ${selectedLinkRecord.reference_number} has been successfully linked with ${fullSafNumber}!`);
      setSelectedLinkRecord((prev: any) => prev ? { ...prev, saf_number: fullSafNumber } : null);
    } catch (err: any) {
      console.error("Link save error:", err);
      setLinkError(err.message || "Failed to link SAF number. Please try again.");
    } finally {
      setLinkLoading(false);
    }
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setSubmitError("Please fill all mandatory fields correctly.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitted(false);

    try {
      // Check for duplicate Aadhaar registration
      const cleanAadhaar = aadhaarNumber.trim();
      let existingRecord: any = null;

      const { data: dupCheckData, error: dupCheckErr } = await supabase.rpc("check_aadhaar_registered", {
        aadhaar_num: cleanAadhaar,
        exclude_ref: isEditing ? activeEditingRef : null,
      });

      if (!dupCheckErr && dupCheckData && dupCheckData.length > 0) {
        existingRecord = dupCheckData[0];
      } else {
        let q = supabase
          .from("registrations")
          .select("reference_number, first_name, last_name")
          .eq("aadhaar_number", cleanAadhaar);
        
        if (isEditing && activeEditingRef) {
          q = q.neq("reference_number", activeEditingRef);
        }
        const { data: directDup } = await q.maybeSingle();
        if (directDup) existingRecord = directDup;
      }

      if (existingRecord) {
        setSubmitError("Already submitted this application.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setSubmitting(false);
        return;
      }

      let refId = activeEditingRef;

      if (!isEditing) {
        // Try atomic sequence generator from database first
        try {
          const { data: seqData, error: seqErr } = await supabase.rpc("get_next_ksaw_reference_id");
          if (!seqErr && seqData) {
            refId = seqData;
          }
        } catch (_) {
          // ignore RPC fallback
        }

        // Robust client-side fallback if RPC is not run yet: find highest numeric ID in DB + 1
        if (!refId) {
          const { data: rows } = await supabase
            .from("registrations")
            .select("reference_number")
            .not("reference_number", "is", null);

          let maxNum = 0;
          if (rows && rows.length > 0) {
            for (const item of rows) {
              if (item.reference_number) {
                const digits = item.reference_number.replace(/\D/g, "");
                const parsed = parseInt(digits, 10);
                if (!isNaN(parsed) && parsed > maxNum) {
                  maxNum = parsed;
                }
              }
            }
          }
          const nextNum = maxNum + 1;
          refId = `KSAW ${String(nextNum).padStart(3, "0")}`;
        }
      }

      const payload: Record<string, any> = {
        reference_number: refId,
        institution_name: institutionName.trim() || null,
        center_location: centerLocation || null,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        email: email,
        dob: dob || null,
        gender: gender,
        marital_status: marital,
        specially_abled: speciallyAbled,
        sa_types: saTypes,
        sa_sub_types: saSubTypes,
        sa_proof: speciallyAbled === "Yes" ? saProof || null : null,
        religion: religion,
        category: category,
        caste: caste || null,
        caste_sub_category: casteSubCategory || null,
        nigama: casteInfo?.nigama || null,
        rd_number: rdNumber || null,
        caste_cert_issue_date: casteCertIssueDate || null,
        caste_cert_expiry_date: certExpiryDate ? certExpiryDate.toISOString().split("T")[0] : null,
        caste_proof: casteProof || null,
        aadhaar_number: aadhaarNumber,
        aadhaar_proof: ageProof,
        guardianship: guardianship,
        guardian_salutation: salutation,
        guardian_first_name: gFirstName,
        guardian_last_name: gLastName,
        cur_location: current.location,
        cur_street1: current.street1,
        cur_street2: current.street2 || null,
        cur_state: current.state,
        cur_district: current.district,
        cur_taluk: current.taluk,
        cur_city: current.location === "Urban" ? current.city : null,
        cur_village: current.location === "Rural" ? current.village : null,
        cur_zip: current.zip,
        same_address: sameAddress,
        per_location: sameAddress === "Yes" ? current.location : permanent.location,
        per_street1: sameAddress === "Yes" ? current.street1 : permanent.street1,
        per_street2: (sameAddress === "Yes" ? current.street2 : permanent.street2) || null,
        per_state: sameAddress === "Yes" ? current.state : permanent.state,
        per_district: sameAddress === "Yes" ? current.district : permanent.district,
        per_taluk: sameAddress === "Yes" ? current.taluk : permanent.taluk,
        per_city: sameAddress === "Yes" ? (current.location === "Urban" ? current.city : null) : (permanent.location === "Urban" ? permanent.city : null),
        per_village: sameAddress === "Yes" ? (current.location === "Rural" ? current.village : null) : (permanent.location === "Rural" ? permanent.village : null),
        per_zip: sameAddress === "Yes" ? current.zip : permanent.zip,
        education: education,
        stream: stream,
        subject: subject || null,
        language_of_instruction: langInstruction,
        other_language: langInstruction === "Other" ? otherLanguage : null,
        year_of_passing: yearOfPassing,
        languages_known: languagesKnown,
        past_skill_experience: pastSkillExp,
        skill_experience_proof: pastSkillExp === "Yes" ? skillExpProof : null,
        skill_sought: skills[0] || "",
        training_duration: trainingDuration,
        apprenticeship: apprenticeship,
        currently_employed: currentlyEmployed,
        employed_from: currentlyEmployed === "Yes" ? employedFrom || null : null,
        current_employer: currentlyEmployed === "Yes" ? currentEmployer : null,
        current_designation: currentlyEmployed === "Yes" ? currentDesignation : null,
        previously_employed: previouslyEmployed,
        work_experience: previouslyEmployed === "Yes" ? workExperience : null,
        last_employer: previouslyEmployed === "Yes" ? lastEmployer : null,
        last_designation: previouslyEmployed === "Yes" ? lastDesignation : null,
        last_salary: previouslyEmployed === "Yes" ? lastSalary : null,
        last_employer_address: previouslyEmployed === "Yes" ? lastEmployerAddress : null,
        employment_proof: previouslyEmployed === "Yes" ? empProof : null,
        education_proof: eduProof,
        age_proof: ageProof,
        profile_image: profileImg,
        declaration_accepted: declaration,
      };

      if (isEditing) {
        // Try updating via RPC function first
        let { data: rpcSuccess, error: rpcErr } = await supabase.rpc("update_registration_by_ref", {
          ref_id: refId,
          payload: payload,
        });

        if (rpcErr || !rpcSuccess) {
          // Direct fallback update
          const { error: directErr } = await (supabase.from("registrations") as any)
            .update(payload)
            .ilike("reference_number", refId);

          if (directErr) throw directErr;
        }
      } else {
        // Insert record and retrieve generated reference_number
        const { data: insertedData, error: dbError } = await (supabase.from("registrations") as any)
          .insert(payload)
          .select("reference_number")
          .single();

        if (dbError) throw dbError;
        if (insertedData?.reference_number) {
          refId = insertedData.reference_number;
        }
      }

      setGeneratedRefId(refId);
      setShowSuccessDialog(true);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Submission error:", err);
      setSubmitError(err.message || "Failed to save registration. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = () => {
    window.location.reload();
  };

  const addressBlock = (which: "current" | "permanent", a: Address, prefix: string) => (
    <>
      <Row>
        <RadioGroup
          label="Location"
          required
          name={`${which}_location`}
          value={a.location}
          onChange={(v) => setAddr(which, { location: v })}
          options={["Urban", "Rural"]}
        />
        <TextField
          label="Street Address"
          required
          placeholder="Street Address"
          value={a.street1}
          onChange={(v) => setAddr(which, { street1: v })}
          error={errors[`${prefix}_street1`]}
        />
        <TextField
          label="Street Address Line 2"
          placeholder="Street Address Line 2"
          value={a.street2}
          onChange={(v) => setAddr(which, { street2: v })}
        />
      </Row>
      <Row>
        <SelectField
          label="State"
          required
          value={a.state}
          onChange={(v) => setAddr(which, { state: v, district: "", taluk: "" })}
          options={STATES}
          error={errors[`${prefix}_state`]}
        />
        <SelectField
          label="District"
          required
          value={a.district}
          onChange={(v) => setAddr(which, { district: v, taluk: "" })}
          options={DISTRICTS[a.state] ?? []}
          error={errors[`${prefix}_district`]}
        />
        <SelectField
          label="Taluk"
          required
          value={a.taluk}
          onChange={(v) => setAddr(which, { taluk: v })}
          options={TALUKS[a.district] ?? []}
          error={errors[`${prefix}_taluk`]}
        />
      </Row>
      <Row>
        {a.location === "Urban" ? (
          <TextField
            label="City"
            required
            info="Enter your city name"
            placeholder="City"
            value={a.city}
            onChange={(v) => setAddr(which, { city: v })}
            error={errors[`${prefix}_city`]}
          />
        ) : (
          <TextField
            label="Village"
            required
            placeholder="Village"
            value={a.village}
            onChange={(v) => setAddr(which, { village: v })}
            error={errors[`${prefix}_village`]}
          />
        )}
        <TextField
          label="Postal / Zip Code"
          required
          info="Enter 6 digit postal code"
          placeholder="Postal / Zip Code"
          inputMode="numeric"
          maxLength={6}
          value={a.zip}
          onChange={(v) => setAddr(which, { zip: v.replace(/\D/g, "") })}
          error={errors[`${prefix}_zip`]}
        />
      </Row>
    </>
  );

  return (
    <div className="kk-page min-h-screen flex flex-col justify-between">
      <div>
        <SiteHeader />
        <PageBanner
          isEditing={isEditing}
          activeRef={activeEditingRef}
        />

        <main className="kk-form">
        <div className="kk-wrap">
          {isEditing && (
            <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  ✏️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Editing Application: <span className="font-mono text-primary">{activeEditingRef}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    You can edit any personal, address, course details, or re-upload documents.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => resetForm()}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer w-max"
              >
                ✕ Cancel Edit & Clear Form
              </button>
            </div>
          )}

          {submitted ? (
            <div className="kk-alert" role="status">
              Your registration details have been {isEditing ? "updated" : "submitted"} successfully.
            </div>
          ) : null}

          {submitError ? (
            <div className="kk-alert" role="status" style={{ backgroundColor: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" }}>
              Error saving form: {submitError}
            </div>
          ) : null}

          <form onSubmit={onSubmit} noValidate>
            <Section title="Center / Institute Details">
              <Row>
                <TextField
                  label="Name of College / Institute / University"
                  required
                  placeholder="Enter Name of College / Institute / University"
                  value={institutionName}
                  onChange={(v) => setInstitutionName(v.toUpperCase())}
                  error={errors["institutionName"]}
                />
                <SelectField
                  label="Center Location"
                  required
                  value={centerLocation}
                  onChange={setCenterLocation}
                  options={DISTRICTS.KARNATAKA}
                  placeholder="Select District"
                  error={errors["centerLocation"]}
                />
              </Row>
            </Section>

            <Section title="Personal Details">
              <Row>
                <TextField
                  label="First Name"
                  required
                  placeholder="First Name"
                  value={firstName}
                  onChange={setFirstName}
                  error={errors["firstName"]}
                />
                <TextField
                  label="Last Name"
                  required
                  placeholder="Last Name"
                  value={lastName}
                  onChange={setLastName}
                  error={errors["lastName"]}
                />
                <TextField
                  label="Phone Number"
                  required
                  info="Enter 10 digit mobile number without country code"
                  placeholder="10 Digit Phone Number"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(v) => setPhone(v.replace(/\D/g, ""))}
                  error={errors["phone"]}
                />
              </Row>
              <Row>
                <TextField
                  label="Email"
                  required
                  type="email"
                  placeholder="email address"
                  value={email}
                  onChange={setEmail}
                  error={errors["email"]}
                />
                {(() => {
                  const today = new Date();
                  const maxDob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().split("T")[0];
                  const minDob = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate() + 1).toISOString().split("T")[0];
                  return (
                    <DateField
                      label="Date of Birth"
                      required
                      value={dob}
                      onChange={setDob}
                      error={errors["dob"]}
                      min={minDob}
                      max={maxDob}
                    />
                  );
                })()}
                <RadioGroup
                  label="Gender"
                  required
                  name="gender"
                  value={gender}
                  onChange={setGender}
                  options={["Male", "Female", "Other"]}
                />
              </Row>
              <Row>
                <RadioGroup
                  label="Marital Status"
                  required
                  name="marital_status"
                  value={marital}
                  onChange={setMarital}
                  options={["Single", "Married", "Widow"]}
                />
                <RadioGroup
                  label="Specially Abled"
                  name="is_physically_challenged"
                  value={speciallyAbled}
                  onChange={setSpeciallyAbled}
                  options={["Yes", "No"]}
                />
              </Row>
              {speciallyAbled === "Yes" ? (
                <Row>
                  <MultiSelect
                    label="Specially Abled Types"
                    required
                    options={SPECIALLY_ABLED_TYPES}
                    value={saTypes}
                    onChange={setSaTypes}
                    error={errors["saTypes"]}
                  />
                  <MultiSelect
                    label="Specially Abled Sub Types"
                    required
                    options={SPECIALLY_ABLED_SUB_TYPES}
                    value={saSubTypes}
                    onChange={setSaSubTypes}
                    error={errors["saSubTypes"]}
                  />
                  <FileField label="Proof of Specially Abled Type" value={saProof} onChange={setSaProof} />
                </Row>
              ) : null}
              <Row>
                <SelectField
                  label="Religion"
                  required
                  value={religion}
                  onChange={setReligion}
                  options={RELIGIONS}
                  error={errors["religion"]}
                />
                <TextField
                  label="Aadhaar Number"
                  required
                  info="Enter 12 digit Aadhaar number"
                  placeholder="12 Digit Aadhaar Number"
                  inputMode="numeric"
                  maxLength={12}
                  value={aadhaarNumber}
                  onChange={(v) => setAadhaarNumber(v.replace(/\D/g, ""))}
                  error={errors["aadhaarNumber"]}
                />
              </Row>
              <Row>
                <div className="fcol fcol-12" style={{ marginBottom: -8 }}>
                  <span className="blink-text">⚠️ Please refer to your caste certificate and select the correct caste and category.</span>
                </div>
                <RadioGroup
                  label="Category"
                  required
                  span={8}
                  name="category"
                  value={category}
                  onChange={setCategory}
                  options={CATEGORIES}
                />
              </Row>
              {category !== "General" ? (
                <Row>
                  {category === "OBC" ? (
                    <>
                      <MultiSelect
                        label="Caste"
                        required
                        searchable
                        single
                        options={CASTE_NAMES}
                        value={caste ? [caste] : []}
                        onChange={(v) => {
                          const selectedCaste = v[0] ?? "";
                          setCaste(selectedCaste);
                          const info = CASTES.find((c) => c.name === selectedCaste);
                          if (info) {
                            setCasteSubCategory(info.category);
                          }
                        }}
                        error={errors["caste"]}
                      />
                      <SelectField
                        label="Nigama"
                        value={casteInfo?.nigama ?? ""}
                        onChange={() => { }}
                        options={NIGAMAS}
                        placeholder="Auto-filled from caste"
                        disabled
                      />
                      <SelectField
                        label="Category"
                        value={casteSubCategory}
                        onChange={setCasteSubCategory}
                        options={CASTE_CATEGORIES}
                        placeholder="Select Category"
                        error={errors["casteSubCategory"]}
                      />
                    </>
                  ) : null}

                  <TextField
                    label="RD Number"
                    required
                    placeholder="RD Number"
                    value={rdNumber}
                    onChange={(v) => setRdNumber(v.toUpperCase())}
                    error={errors["rdNumber"]}
                  />
                  <DateField
                    label="Caste Certificate Issue Date"
                    required
                    value={casteCertIssueDate}
                    onChange={setCasteCertIssueDate}
                    error={errors["casteCertIssueDate"]}
                    max={new Date().toISOString().split("T")[0]}
                  />
                  <FileField
                    label="Proof of Caste"
                    required
                    hint="Upload your caste certificate"
                    value={casteProof}
                    onChange={setCasteProof}
                    error={errors["casteProof"]}
                  />
                </Row>
              ) : null}
            </Section>




            <Section title="Father/Mother/Guardian Details">
              <Row>
                <Field span={4}>
                  <div className="inline-group">
                    <div className="radio-block">
                      {["Father", "Mother", "Guardian"].map((o) => (
                        <label key={o} className="radio-inline">
                          <input
                            type="radio"
                            name="guardianship"
                            checked={guardianship === o}
                            onChange={() => setGuardianship(o)}
                          />
                          <span>{o}</span>
                        </label>
                      ))}
                    </div>
                    <select
                      className="form-ctrl salutation-select"
                      aria-label="Salutation"
                      value={salutation}
                      onChange={(e) => setSalutation(e.target.value)}
                    >
                      {SALUTATIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>
                <TextField
                  label="First Name"
                  required
                  placeholder="First Name"
                  value={gFirstName}
                  onChange={setGFirstName}
                  error={errors["gFirstName"]}
                />
                <TextField
                  label="Last Name"
                  required
                  placeholder="Last Name"
                  value={gLastName}
                  onChange={setGLastName}
                  error={errors["gLastName"]}
                />
              </Row>
            </Section>

            <Section title="ADDRESS" variant="main" />
            <Section title="Current Address">{addressBlock("current", current, "cur")}</Section>

            <Section title="Permanent Address">
              <Row>
                <RadioGroup
                  label="Is your permanent address same as current address?"
                  required
                  span={8}
                  name="sameas_permanent_address"
                  value={sameAddress}
                  onChange={setSameAddress}
                  options={["Yes", "No"]}
                />
              </Row>
              {sameAddress === "No" ? addressBlock("permanent", permanent, "per") : null}
            </Section>

            <Section title="EDUCATION" variant="main" />
            <Section title="Educational Details">
              <Row>
                <SelectField
                  label="Education"
                  required
                  value={education}
                  onChange={(v) => {
                    setEducation(v);
                    setStream("");
                    setSubject("");
                    setSkills([]);
                  }}
                  options={EDUCATION_LEVELS}
                  error={errors["education"]}
                />
                {education !== "10th" ? (
                  <>
                    <SelectField
                      label="Stream"
                      required
                      value={stream}
                      onChange={(v) => {
                        setStream(v);
                        setSubject("");
                      }}
                      options={streamOptions}
                      error={errors["stream"]}
                    />
                    <SelectField
                      label="Subject"
                      required
                      value={subject}
                      onChange={setSubject}
                      options={subjectOptions}
                      placeholder={subjectOptions.length ? "Select" : "N/A"}
                      error={errors["subject"]}
                    />
                  </>
                ) : null}
              </Row>
              <Row>
                <RadioGroup
                  label="Language of Instruction"
                  required
                  name="language_instruction"
                  value={langInstruction}
                  onChange={setLangInstruction}
                  options={["English", "Kannada", "Other"]}
                />
                {langInstruction === "Other" ? (
                  <TextField
                    label="Other Language"
                    required
                    placeholder="Other Language"
                    value={otherLanguage}
                    onChange={setOtherLanguage}
                    error={errors["otherLanguage"]}
                  />
                ) : null}
                <SelectField
                  label="Year of Passing"
                  required
                  placeholder="Select Year"
                  options={PASSING_YEARS}
                  value={yearOfPassing}
                  onChange={setYearOfPassing}
                  error={errors["yearOfPassing"]}
                />
              </Row>
              <Row>
                <MultiSelect
                  label="Languages Known"
                  required
                  searchable
                  options={LANGUAGES_KNOWN}
                  value={languagesKnown}
                  onChange={setLanguagesKnown}
                  error={errors["languagesKnown"]}
                />
                <RadioGroup
                  label="Past Skill Experience ?"
                  name="past_skill_exp"
                  value={pastSkillExp}
                  onChange={setPastSkillExp}
                  options={["Yes", "No"]}
                />
                {pastSkillExp === "Yes" ? (
                  <FileField
                    label="Proof of Past Skill Experience"
                    required
                    value={skillExpProof}
                    onChange={setSkillExpProof}
                    error={errors["skillExpProof"]}
                  />
                ) : null}
              </Row>
              <Row>
                <MultiSelect
                  label="Skill Sought / Course"
                  required
                  searchable
                  single
                  options={useMemo(() => {
                    if (education === "10th") {
                      return SKILLS.filter((s) =>
                        s === "Cisco IT Essentials" ||
                        s === "Computer Hardware and Networking" ||
                        s === "Computer Programming"
                      );
                    }
                    if (stream === "Commerce") {
                      return SKILLS;
                    }
                    return SKILLS.filter((s) => s !== "Accounts Executive - Tally ERP 9");
                  }, [education, stream])}
                  value={skills}
                  onChange={setSkills}
                  error={errors["skills"]}
                />
                <SelectField
                  label="Preferred Duration Of Training Required"
                  required
                  value={trainingDuration}
                  onChange={setTrainingDuration}
                  options={TRAINING_DURATIONS}
                  error={errors["trainingDuration"]}
                />
                <RadioGroup
                  label="Willing To Take Apprenticeship ?"
                  required
                  name="apprenticeship"
                  value={apprenticeship}
                  onChange={setApprenticeship}
                  options={["Yes", "No"]}
                />
              </Row>
              <p className="required-text" style={{ marginBottom: 14 }}>
                *( You Can Select Only 1 Skill. )
              </p>
            </Section>

            <Section title="EMPLOYMENT" variant="main">
              <Row>
                <RadioGroup
                  label="Currently Employed"
                  name="currently_employed"
                  value={currentlyEmployed}
                  onChange={setCurrentlyEmployed}
                  options={["Yes", "No"]}
                />
                {currentlyEmployed === "Yes" ? (
                  <>
                    <DateField
                      label="Employed From"
                      required
                      value={employedFrom}
                      onChange={setEmployedFrom}
                      error={errors["employedFrom"]}
                    />
                    <TextField
                      label="Name Of Current Employer"
                      required
                      placeholder="Name Of Current Employer"
                      value={currentEmployer}
                      onChange={setCurrentEmployer}
                      error={errors["currentEmployer"]}
                    />
                    <TextField
                      label="Current Designation"
                      required
                      placeholder="Current Designation"
                      value={currentDesignation}
                      onChange={setCurrentDesignation}
                      error={errors["currentDesignation"]}
                    />
                  </>
                ) : null}
              </Row>
              <Row>
                <RadioGroup
                  label="Have You Been Previously Employed"
                  required
                  name="previously_employed"
                  value={previouslyEmployed}
                  onChange={setPreviouslyEmployed}
                  options={["Yes", "No"]}
                />
              </Row>
              {previouslyEmployed === "Yes" ? (
                <>
                  <Row>
                    <TextField
                      label="Total Years Of Work Experience"
                      required
                      placeholder="Total Years Of Work Experience"
                      value={workExperience}
                      onChange={setWorkExperience}
                      error={errors["workExperience"]}
                    />
                    <TextField
                      label="Name Of Last Employer"
                      required
                      placeholder="Name Of Last Employer"
                      value={lastEmployer}
                      onChange={setLastEmployer}
                      error={errors["lastEmployer"]}
                    />
                    <TextField
                      label="Last Designation"
                      required
                      placeholder="Last Designation"
                      value={lastDesignation}
                      onChange={setLastDesignation}
                      error={errors["lastDesignation"]}
                    />
                  </Row>
                  <Row>
                    <SelectField
                      label="Last Drawn Salary In Rs"
                      required
                      value={lastSalary}
                      onChange={setLastSalary}
                      options={LAST_SALARY}
                      error={errors["lastSalary"]}
                    />
                    <Field label="Address Of Last Employer" required error={errors["lastEmployerAddress"]} span={4}>
                      <textarea
                        className={`form-ctrl${errors["lastEmployerAddress"] ? " is-invalid" : ""}`}
                        style={{ height: "auto", minHeight: 76 }}
                        value={lastEmployerAddress}
                        onChange={(e) => setLastEmployerAddress(e.target.value)}
                      />
                    </Field>
                    <FileField
                      label="Proof of Experience"
                      required
                      value={empProof}
                      onChange={setEmpProof}
                      error={errors["empProof"]}
                    />
                  </Row>
                </>
              ) : null}
              <Row>
                <FileField
                  label="Proof of Education (Highest Qualification Marksheet Or Convocation Certificate)"
                  required
                  value={eduProof}
                  onChange={setEduProof}
                  error={errors["eduProof"]}
                />
                <FileField
                  label="Proof of Age (Upload Aadhaar Photo)"
                  required
                  hint="PDF only, max 1 MB"
                  accept="application/pdf"
                  maxSizeMb={1}
                  value={ageProof}
                  onChange={setAgeProof}
                  error={errors["ageProof"]}
                />
                <FileField
                  label="Profile Image (Upload Latest Passport Image)"
                  required
                  accept="image/*"
                  hint="Image, max 1 MB"
                  value={profileImg}
                  onChange={setProfileImg}
                  error={errors["profileImg"]}
                />
              </Row>

              <div className="declaration">
                <input
                  id="declaration"
                  type="checkbox"
                  checked={declaration}
                  onChange={(e) => setDeclaration(e.target.checked)}
                />
                <label htmlFor="declaration">
                  <a href="#">Acknowledgement &amp; Aadhaar Consent</a> — I hereby declare that the details &amp;
                  documents furnished in Kaushalkar.com are true and correct to the best of my knowledge and belief.
                </label>
              </div>
              {errors["declaration"] ? <p className="err-msg">{errors["declaration"]}</p> : null}
              {submitError && <p className="err-msg">{submitError}</p>}
              {submitted && <p className="success-msg">Registration submitted successfully!</p>}

              <div className="kk-actions">
                <button type="button" className="btn-kk btn-cancel-kk" onClick={onCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn-kk btn-primary-kk" disabled={submitting}>
                  {submitting ? (isEditing ? "Saving Changes..." : "Submitting...") : isEditing ? "💾 Save Changes" : "Submit"}
                </button>
              </div>
            </Section>
          </form>
        </div>
      </main>
      </div>

      {/* Password Authentication Modal for Edit & Link SAF */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl border border-border text-center flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-600 text-xl mb-2">
              🔒
            </div>

            <h3 className="text-lg font-bold text-foreground">
              {authTargetAction === "edit" ? "Edit Application" : "Link SAF Number"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Please enter the administrator access password to continue.
            </p>

            <div className="mt-4 w-full text-left">
              <label className="text-xs font-semibold text-foreground block mb-1">
                Access Password *
              </label>
              <input
                type="password"
                placeholder="Enter password..."
                className="w-full form-ctrl text-sm py-2 px-3 tracking-wider"
                value={enteredPassword}
                onChange={(e) => {
                  setEnteredPassword(e.target.value);
                  setAuthError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    verifyActionPassword();
                  }
                }}
                autoFocus
              />
              {authError && (
                <p className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 font-medium">
                  {authError}
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  setEnteredPassword("");
                  setAuthError("");
                  setAuthTargetAction(null);
                }}
                className="btn-kk btn-cancel-kk text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={verifyActionPassword}
                disabled={!enteredPassword.trim()}
                className="btn-kk btn-primary-kk text-xs py-2 px-4 shadow-xs"
              >
                Verify &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference ID Lookup Modal for Editing */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 animate-in fade-in duration-200 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-border text-center flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl mb-2">
              🔍
            </div>
            
            <h3 className="text-lg font-bold text-foreground">Edit Your Application</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Search by Application Reference ID (e.g. <strong>KSAW 001</strong>), candidate name, or phone number.
            </p>

            <div className="mt-4 w-full text-left relative">
              <label className="text-xs font-semibold text-foreground block mb-1">
                Reference ID / Search *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Reference ID (e.g. KSAW 001) or Name..."
                  className="w-full form-ctrl font-mono uppercase text-sm py-2 px-3 tracking-wider"
                  value={inputLookupRef}
                  onChange={(e) => void handleSearchForEdit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void loadByReferenceId();
                    }
                  }}
                />
                {editSearching && (
                  <span className="text-xs text-muted-foreground self-center">Searching...</span>
                )}
              </div>

              {/* Dropdown list of matching results for edit */}
              {editSearchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg p-1">
                  {editSearchResults.map((rec) => (
                    <button
                      type="button"
                      key={rec.reference_number}
                      onClick={() => {
                        setInputLookupRef(rec.reference_number);
                        setEditSearchResults([]);
                        void loadByReferenceId(rec.reference_number);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-md hover:bg-muted/80 flex items-center justify-between transition-colors cursor-pointer border-b border-border/50 last:border-b-0"
                    >
                      <div>
                        <span className="font-bold font-mono text-primary mr-2">
                          {rec.reference_number}
                        </span>
                        <span className="text-foreground font-medium">
                          {rec.first_name} {rec.last_name}
                        </span>
                        <span className="text-muted-foreground ml-2">({rec.phone})</span>
                      </div>
                      <span className="text-[11px] font-semibold text-primary">
                        Select &amp; Load →
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {editLookupError && (
                <p className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 font-medium">
                  {editLookupError}
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditLookupError("");
                  setEditSearchResults([]);
                }}
                className="btn-kk btn-cancel-kk text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void loadByReferenceId()}
                disabled={editLookupLoading || !inputLookupRef.trim()}
                className="btn-kk btn-primary-kk text-xs py-2 px-4 shadow-xs"
              >
                {editLookupLoading ? "Loading..." : "Load Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 animate-in fade-in duration-200 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border text-center flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 mb-3">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-foreground">
              {isEditing ? "Application Updated Successfully!" : "Application Submitted Successfully!"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Your details have been registered with Karnataka State Akkamahadevi Women's University.
            </p>

            <div className="my-5 w-full rounded-xl bg-muted/40 p-4 border border-border flex flex-col items-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Application Reference ID
              </span>
              <span className="my-1.5 text-2xl font-extrabold tracking-widest text-primary font-mono select-all">
                {generatedRefId}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (generatedRefId) {
                    navigator.clipboard.writeText(generatedRefId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }
                }}
                className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {copied ? "✓ Copied to Clipboard" : "📋 Copy Reference ID"}
              </button>
            </div>

            {!isEditing && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-left w-full mb-4">
                <div className="flex gap-2">
                  <span className="text-amber-600 text-base">⚠️</span>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    <strong>Important:</strong> Please note down or copy this <strong>Reference ID</strong> immediately for your future reference and tracking. It will not be shown again after you close this window.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowSuccessDialog(false);
                resetForm();
              }}
              className="btn-kk btn-primary-kk w-full py-2.5 font-semibold rounded-lg text-center shadow-xs"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* Link SAF Number Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 animate-in fade-in duration-200 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-border text-center flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 text-xl mb-2">
              🔗
            </div>
            
            <h3 className="text-lg font-bold text-foreground">Link Reference ID to SAF Number</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Search by Application Reference ID, candidate name, or phone number.
            </p>

            <div className="mt-4 w-full text-left space-y-4">
              {/* Step 1: Search & Select Reference ID */}
              <div className="relative">
                <label className="text-xs font-semibold text-foreground block mb-1">
                  1. Search Application Reference ID *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Reference ID (e.g. KSAW 001) or Name..."
                    className="w-full form-ctrl font-mono uppercase text-sm py-2 px-3 tracking-wider"
                    value={linkSearchInput}
                    onChange={(e) => void handleSearchForLink(e.target.value)}
                  />
                  {linkSearching && (
                    <span className="text-xs text-muted-foreground self-center">Searching...</span>
                  )}
                </div>

                {/* Dropdown list of matching results */}
                {linkSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg p-1">
                    {linkSearchResults.map((rec) => (
                      <button
                        type="button"
                        key={rec.reference_number}
                        onClick={() => handleSelectForLink(rec)}
                        className="w-full text-left px-3 py-2 text-xs rounded-md hover:bg-muted/80 flex items-center justify-between transition-colors cursor-pointer border-b border-border/50 last:border-b-0"
                      >
                        <div>
                          <span className="font-bold font-mono text-primary mr-2">
                            {rec.reference_number}
                          </span>
                          <span className="text-foreground font-medium">
                            {rec.first_name} {rec.last_name}
                          </span>
                          <span className="text-muted-foreground ml-2">({rec.phone})</span>
                        </div>
                        {rec.saf_number && (
                          <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 px-2 py-0.5 rounded border border-emerald-500/30">
                            Linked: {rec.saf_number}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 2: Selected Record Details & SAF Number Input */}
              {selectedLinkRecord && (
                <div className="rounded-xl bg-muted/40 p-3.5 border border-border space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground block">Selected Candidate</span>
                      <strong className="text-sm font-semibold text-foreground">
                        {selectedLinkRecord.first_name} {selectedLinkRecord.last_name}
                      </strong>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-primary/10 text-primary font-mono text-xs font-bold">
                      {selectedLinkRecord.reference_number}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      2. Enter SAF Number *
                    </label>
                    <div className="flex items-center rounded-lg border border-border bg-card overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                      <span className="bg-muted px-3 py-2 font-bold font-mono text-sm text-muted-foreground border-r border-border select-none">
                        SAF
                      </span>
                      <input
                        type="text"
                        placeholder="1477116"
                        className="w-full bg-transparent px-3 py-2 text-sm font-mono text-foreground outline-none font-semibold"
                        value={inputSafDigits}
                        onChange={(e) => setInputSafDigits(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Full SAF ID will be formatted as: <strong className="text-foreground font-mono">SAF{inputSafDigits || "XXXXXXX"}</strong>
                    </p>
                  </div>
                </div>
              )}

              {linkError && (
                <p className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 font-medium">
                  {linkError}
                </p>
              )}

              {linkSuccessMessage && (
                <p className="text-xs text-emerald-700 bg-emerald-500/15 p-2 rounded border border-emerald-500/30 font-medium">
                  ✓ {linkSuccessMessage}
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedLinkRecord(null);
                  setInputSafDigits("");
                  setLinkError("");
                  setLinkSuccessMessage("");
                }}
                className="btn-kk btn-cancel-kk text-xs py-2 px-4"
              >
                Close
              </button>
              {selectedLinkRecord && (
                <button
                  type="button"
                  onClick={() => void handleSaveSafLink()}
                  disabled={linkLoading || !inputSafDigits.trim()}
                  className="btn-kk btn-primary-kk text-xs py-2 px-4 shadow-xs"
                >
                  {linkLoading ? "Saving..." : "🔗 Link & Save SAF Number"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Site Footer with Password Protected Actions */}
      <SiteFooter
        onEdit={() => triggerProtectedAction("edit")}
        onLinkSAF={() => triggerProtectedAction("link")}
        isEditing={isEditing}
      />
    </div>
  );
}
