import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { PageBanner, SiteHeader } from "@/components/reg/SiteChrome";
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
  const [casteProof, setCasteProof] = useState("");
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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
    if (!firstName.trim()) e["firstName"] = "First name is required";
    if (!lastName.trim()) e["lastName"] = "Last name is required";
    if (!gender) e["gender"] = "Gender is required";
    if (!marital) e["marital"] = "Marital status is required";
    if (!/^[6-9]\d{9}$/.test(phone)) e["phone"] = "Enter a valid 10 digit phone number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e["email"] = "Enter a valid email address";
    if (!dob) e["dob"] = "Date of birth is required";
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
    setDeclaration(true);
    setErrors({});
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
      const { error: dbError } = await supabase
        .from("registrations")
        .insert({
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
        });

      if (dbError) throw dbError;

      setShowSuccessDialog(true);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Submission error:", err);
      setSubmitError(err.message || "Failed to submit registration. Please try again.");
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
    <div className="kk-page">
      <SiteHeader />
      <PageBanner />

      <main className="kk-form">
        <div className="kk-wrap">
          {submitted ? (
            <div className="kk-alert" role="status">
              Your registration details have been submitted successfully.
            </div>
          ) : null}

          {submitError ? (
            <div className="kk-alert" role="status" style={{ backgroundColor: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" }}>
              Error submitting form: {submitError}
            </div>
          ) : null}

          <form onSubmit={onSubmit} noValidate>
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
                <DateField label="Date of Birth" required value={dob} onChange={setDob} error={errors["dob"]} />
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
                    placeholder="Rd Number"
                    value={rdNumber}
                    onChange={setRdNumber}
                    error={errors["rdNumber"]}
                  />
                  <FileField
                    label="Proof of Caste"
                    required
                    hint="Upload a valid caste certificate (caste certificate should be valid up to 2027)"
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
                    if (stream === "Commerce") {
                      return SKILLS;
                    }
                    return SKILLS.filter((s) => s !== "Accounts Executive - Tally ERP 9");
                  }, [stream])}
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
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </Section>
          </form>
        </div>
      </main>

      {showSuccessDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl border border-border text-center flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground">Submission Successful</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Your registration details have been submitted successfully.
            </p>
            <button
              onClick={() => {
                setShowSuccessDialog(false);
                resetForm();
              }}
              className="mt-5 btn-kk btn-primary-kk w-full py-2.5 font-medium rounded-lg text-center"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
