# MCE NEW DATA - Excel Data Migration Report

This document records the complete execution details, schema mappings, duplicate audits, and insertion results for importing student records from `MCE NEW DATA.xlsx` into the Supabase `registrations` database.

---

## 1. Executive Summary

| Metric | Count | Details |
| :--- | :---: | :--- |
| **Source File** | `public/MCE NEW DATA.xlsx` | Malnad College of Engineering (MCE Hassan) |
| **Total Rows in Excel** | **26** | Rows 2 through 27 |
| **Successfully Inserted Records** | **26** | 100% clean, new student registrations |
| **Reference ID Range** | **`KSAW 490` – `KSAW 515`** | Sequentially continued from DB max |
| **Skipped Duplicates (in DB)** | **0** | No pre-existing Aadhaar duplicates found |
| **Skipped Duplicates (in File)** | **0** | No intra-sheet duplicate rows |
| **Institution Name** | `MALNAD COLLEGE OF ENGINEERING HASSAN` | Standardized across all entries |
| **Initial Application Status** | `Pending` | Set by default |

---

## 2. Field Mapping & Transformation Rules

Unwanted / unneeded columns (`SL NO`, `USN NUMBER`, `SEMESTER`, and `MOTHER NAME`) were completely ignored. The remaining valid fields were transformed and mapped as follows:

| Excel Column Header | Target DB Column | Logic / Transformation |
| :--- | :--- | :--- |
| **`STUDENT FULL NAME`** | `first_name`, `last_name` | First word mapped to `first_name`; remaining tokens mapped to `last_name` (or `.` if single name). |
| **`FATHER NAME`** | `guardian_first_name`, `guardian_last_name` | Mapped to father's name parts; `guardianship` set to `"Father"`, `guardian_salutation` to `"Mr"`. |
| **`DATE OF BIRTH`** | `dob` | Formatted to ISO `YYYY-MM-DD`. |
| **`GENDER`** | `gender` | Capitalized (`Male` / `Female`). |
| **`RD NUMBER OF CASTE CERTIFICATE`** | `rd_number` | Stripped and sanitized. |
| **`CASTE`** | `caste` | Cleaned uppercase string. |
| **`SUB CASTE`** | `caste_sub_category` | Cleaned uppercase string. |
| **`MOBILE NUMBER`** | `phone` | Sanitized 10-digit mobile string. |
| **`Aadhaar CARD NUMBER`** | `aadhaar_number` | Cleaned 12-digit numeric string (spaces removed). |
| **`FULL ADDRESS WITH PIN CODE`** | `cur_street1`, `per_street1`, `cur_zip`, `per_zip` | Full address stored in street; 6-digit PIN code extracted into `cur_zip` & `per_zip`. |
| **`DISTRICT`** | `cur_district`, `per_district` | Standardized district name. |
| **`TALUK`** | `cur_taluk`, `per_taluk` | Standardized taluk name. |
| **`NIGAMA`** | `nigama` | Cleaned uppercase string. |
| **`QUALIFICATION`** | `education` | Preserved qualification string (e.g. `BE ONGOING`, `PUC OR Diploma`). |
| **`BRANCH`** | `stream` | Preserved engineering branch (e.g. `Electronics and Communication Engineering`). |
| **`PREFERED COURSE NAME`** | `skill_sought` | Course name preserved (e.g. `CISCO IT ESSENTIAL`, `COMPUTER HARDWARE AND NETWORKING`). |
| **`COLLEGE NAME`** | `institution_name` | Standardized to `"MALNAD COLLEGE OF ENGINEERING HASSAN"`. |
| **`Aadhaar CARD` (URL)** | `age_proof` & `aadhaar_proof` | **Proof Of Age** mapped to the student's Aadhaar card URL as instructed. |
| **`PUC OR Diploma MARKSCARD` / `SSLC MARKSCARD`** | `education_proof` | **Proof Of Education** mapped to highest qualification: PUC / Diploma URL if present, otherwise SSLC URL. |
| **`CASTE CERTIFICATE` (URL)** | `caste_proof` | Google Drive URL stored. |
| **`PASSPORT SIZE PHOTO` (URL)** | `profile_image` | Google Drive URL stored. |
| *System Defaults* | `cur_state`, `per_state`, `same_address`, `declaration_accepted` | Set to `"Karnataka"`, `"Karnataka"`, `"Yes"`, `true`. |

---

## 3. Duplicate Audit Report

- **Pre-existing DB Duplicates**: `0`
- **Internal File Duplicates**: `0`
- **Total Valid New Insertions**: `26 / 26 (100%)`

---

## 4. Complete List of Inserted Records

| Ref ID | Student Name | Mobile Number | Aadhaar Number | Stream (Branch) | Preferred Course |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **KSAW 490** | Varshitha B N | 7204820566 | 460896719175 | Electronics and Communication Engineering | COMPUTER HARDWARE AND NETWORKING |
| **KSAW 491** | Nandan K N | 8073587428 | 954625298547 | Mechanical Engineering | COMPUTER HARDWARE AND NETWORKING |
| **KSAW 492** | Shashank B S | 6363297686 | 973273188981 | Mechanical Engineering | CISCO IT ESSENTIAL |
| **KSAW 493** | Goutham B R | 6362541818 | 496666578051 | Civil Engineering | CISCO IT ESSENTIAL |
| **KSAW 494** | Manoj K G | 9972750669 | 733560241088 | Automobile Engineering | CISCO IT ESSENTIAL |
| **KSAW 495** | Chandana G N | 9901416751 | 823438318357 | Information Science and Engineering | CISCO IT ESSENTIAL |
| **KSAW 496** | Rakshitha M S | 9113689408 | 704179373752 | Information Science and Engineering | CISCO IT ESSENTIAL |
| **KSAW 497** | Hemanth B R | 8088921820 | 832560505191 | Electronics and Communication Engineering | CISCO IT ESSENTIAL |
| **KSAW 498** | Sinchana B V | 8088194380 | 794966779461 | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 499** | Sinchana B R | 7899849206 | 321799279566 | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 500** | Sinchana M P | 8431806371 | 291127717466 | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 501** | Chandana B K | 7204981156 | 614050513813 | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 502** | Bindushree H S | 9353982857 | 647953253724 | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 503** | Likitha M C | 8088922475 | 572763266858 | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 504** | Sanjana K C | 9741517441 | 378857434526 | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 505** | Sanjana H S | 8088673751 | 382420800762 | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 506** | Bhoomika K S | 8088494921 | 823439062335 | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 507** | Sushma H B | 8867568581 | 913220087474 | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 508** | Yashaswini H T | 8971842036 | 609930773957 | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 509** | Harsha V | 9686411516 | 973273188981 | Mechanical Engineering | CISCO IT ESSENTIAL |
| **KSAW 510** | Sinchana N R | 9880193189 | 903175114757 | Computer Science and Business Systems | CISCO IT ESSENTIAL |
| **KSAW 511** | Nischitha M S | 6363539265 | 711424368940 | Computer Science and Business Systems | CISCO IT ESSENTIAL |
| **KSAW 512** | Dhanyashree S B | 9019626608 | 949050382484 | Computer Science and Engineering | CISCO IT ESSENTIAL |
| **KSAW 513** | Chaithanya . | 6362699194 | 368631788451 | Computer Science and Engineering | CISCO IT ESSENTIAL |
| **KSAW 514** | Darshini S | 8151041797 | 707350795750 | Computer Science and Engineering | CISCO IT ESSENTIAL |
| **KSAW 515** | Ruchitha HS | 9945656197 | 886433524775 | Computer Science and Engineering | CISCO IT ESSENTIAL |

---

## 5. Verification Sample

Database record check confirmed:

```json
{
  "reference_number": "KSAW 490",
  "first_name": "Varshitha",
  "last_name": "B N",
  "phone": "7204820566",
  "aadhaar_number": "460896719175",
  "institution_name": "MALNAD COLLEGE OF ENGINEERING HASSAN",
  "age_proof": "https://drive.google.com/u/2/open?usp=forms_web&id=1w-qtC4-gIV_IevmYpGTM5xzkaT9QxizU",
  "education_proof": "https://drive.google.com/u/2/open?usp=forms_web&id=1ppytYqOSlsz_GNAiJrLJBx9cVIOf2izg",
  "caste_proof": "https://drive.google.com/u/2/open?usp=forms_web&id=10fkjSqN8WB9eDFaZ3zFsGJbISKbWitKw",
  "status": "Pending"
}
```

All 26 records are active and visible in the Admin Dashboard.
