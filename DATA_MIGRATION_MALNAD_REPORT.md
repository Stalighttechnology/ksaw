# Malnad College of Engineering (MCE Hassan) - Excel Data Migration Report

This document records the complete execution details, schema mappings, duplicate audits, and insertion results for importing the student records from `NEW XL. MALNAD.xlsx` into the Supabase `registrations` database.

---

## 1. Executive Summary

| Metric | Count | Details |
| :--- | :--- | :--- |
| **Total Rows in Excel** | 102 | Rows 2 through 103 |
| **Successfully Inserted Records** | **87** | New unique student registrations |
| **Reference ID Range** | **`KSAW 401` – `KSAW 487`** | Sequentially generated |
| **Skipped (Already in DB)** | **7** | Existing registrations found by Aadhaar |
| **Skipped (Repeated in Excel)** | **8** | Intra-file duplicates (multiple form submissions) |
| **Destination College Name** | `MALNAD COLLEGE OF ENGINEERING HASSAN` | Standardized |
| **Default Initial Status** | `Pending` | Set across all new imports |

---

## 2. Field Mapping & Transformation Rules

Unwanted / unneeded fields (`sl.no`, `USN NUMBER`, `SEMESTER`, and `MOTHER NAME`) were completely ignored. The remaining valid fields were transformed and mapped as follows:

| Excel Column Header | Target DB Column | Logic / Transformation |
| :--- | :--- | :--- |
| **`SAF ID`** | `saf_number` | Preserved as-is (e.g. `SAF1477115`). |
| **`STUDENT FULL NAME`** | `first_name`, `last_name` | First word mapped to `first_name`; subsequent tokens mapped to `last_name` (or `.` if single name). |
| **`FATHER NAME`** | `guardian_first_name`, `guardian_last_name` | Split into guardian name parts; `guardianship` set to `"Father"`, `guardian_salutation` to `"Mr"`. |
| **`DATE OF BIRTH`** | `dob` | Standardized to ISO `YYYY-MM-DD`. |
| **`GENDER`** | `gender` | Capitalized (`Male` / `Female`). |
| **`RD NUMBER OF CASTE CERTIFICATE`** | `rd_number` | Stripped and sanitized. |
| **`CASTE`** | `caste` | Uppercase trimmed string. |
| **`SUB CASTE`** | `caste_sub_category` | Cleaned and preserved. |
| **`MOBILE NUMBER`** | `phone` | Sanitized 10-digit mobile string. |
| **`Aadhaar CARD NUMBER`** | `aadhaar_number` | Sanitized 12-digit numeric string (spaces removed). |
| **`FULL ADDRESS WITH PIN CODE`** | `cur_street1`, `per_street1`, `cur_zip`, `per_zip` | Full address stored in street; 6-digit PIN code extracted and placed into `cur_zip` & `per_zip`. |
| **`DISTRICT`** | `cur_district`, `per_district` | Standardized district name. |
| **`TALUK`** | `cur_taluk`, `per_taluk` | Standardized taluk name. |
| **`NIGAMA`** | `nigama` | Uppercase trimmed string. |
| **`QUALIFICATION`** | `education` | Preserved qualification string (e.g. `BE ONGOING`, `PUC OR Diploma`). |
| **`BRANCH`** | `stream` | Preserved engineering branch (e.g. `Computer Science and Business Systems`). |
| **`PREFERED COURSE NAME`** | `skill_sought` | Preserved course name (e.g. `CISCO IT ESSENTIAL`). |
| **`COLLEGE NAME`** | `institution_name` | Standardized to `"MALNAD COLLEGE OF ENGINEERING HASSAN"`. |
| **`Aadhaar CARD` (URL)** | `age_proof` & `aadhaar_proof` | **Proof Of Age** mapped to the Aadhaar card link as instructed. |
| **`PUC OR Diploma MARKSCARD` / `SSLC MARKSCARD`** | `education_proof` | **Proof Of Education** mapped to highest qualification: PUC / Diploma URL if available, else SSLC URL. |
| **`CASTE CERTIFICATE` (URL)** | `caste_proof` | Google Drive URL stored. |
| **`PASSPORT SIZE PHOTO` (URL)** | `profile_image` | Google Drive URL stored. |
| *System Defaults* | `cur_state`, `per_state`, `same_address`, `declaration_accepted` | Set to `"Karnataka"`, `"Karnataka"`, `"Yes"`, `true`. |

---

## 3. Audit of Skipped Duplicates (15 Total)

### 3.1. Category 1: Already Registered in Database (7 Students)
These candidates had already submitted applications prior to this batch and possessed active Reference IDs in Supabase. They were skipped to prevent overwriting or creating duplicate candidate IDs.

| Excel Row | Student Name | Mobile Number | Aadhaar Number | Existing Reference ID | Existing DB Candidate Name |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **Row 6** | Shreya R | `7022841357` | `207842105721` | **`KSAW 006`** | Shreya R |
| **Row 7** | Ragini Y H | `9972108331` | `660616435737` | **`KSAW 008`** | Ragini Y H |
| **Row 8** | Sneha AN | `9482229947` | `779658086664` | **`KSAW 191`** | Sneha AN |
| **Row 13** | Shravya R | `9901095781` | `753691712351` | **`KSAW 217`** | Shravya R |
| **Row 14** | Dimple G G | `9591236941` | `534013471267` | **`KSAW 290`** | Dimple G G |
| **Row 55** | Yuktha N P | `6364015192` | `511971796366` | **`KSAW 205`** | Yuktha N P |
| **Row 58** | Chinmayi V | `6363191168` | `918655116065` | **`KSAW 214`** | Chinmayi V |

---

### 3.2. Category 2: Repeated Submissions Within the Excel File (8 Rows)
These candidates submitted the Google Form more than once. Their **initial row** was imported and assigned a Reference ID, while their redundant subsequent rows were safely discarded:

| Excel Row (Duplicate) | Student Name | Mobile Number | Aadhaar Number | Redundant Of | Status |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **Row 25** | Sanjana h v | `8073727883` | `502713420325` | **Row 23** | Initial entry inserted (`KSAW 418`) |
| **Row 61** | Dhruva Kumar D.Y | `7204575563` | `829622114300` | **Row 46** | Initial entry inserted (`KSAW 438`) |
| **Row 77** | C Basavaraj | `8660835799` | `418806493249` | **Row 64** | Initial entry inserted (`KSAW 453`) |
| **Row 81** | Raghunandan AM | `9113669027` | `903202353460` | **Row 59** | Initial entry inserted (`KSAW 449`) |
| **Row 83** | Deeksha R A | `6363459042` | `708839618499` | **Row 69** | Initial entry inserted (`KSAW 457`) |
| **Row 91** | C Karthik | `8904168447` | `367724259069` | **Row 89** | Initial entry inserted (`KSAW 475`) |
| **Row 92** | C Karthik | `8904168447` | `367724259069` | **Row 89** | Third repeated attempt discarded |
| **Row 103** | Sanjana K S | `8431041646` | `976870868064` | **Row 98** | Initial entry inserted (`KSAW 483`) |

---

## 4. Verification Check

A sample check of the inserted records in the database confirms proper assignment of `reference_number` and proof links:

```json
{
  "reference_number": "KSAW 401",
  "first_name": "Suhas",
  "last_name": "U M",
  "institution_name": "MALNAD COLLEGE OF ENGINEERING HASSAN",
  "age_proof": "https://drive.google.com/u/1/open?usp=forms_web&id=1E8otu7edcCbZlBsJMlGGxqlnI65db0O0",
  "education_proof": "https://drive.google.com/u/1/open?usp=forms_web&id=13NweekI-8Il4MzGA2lHcIrruJZUwaRw0",
  "status": "Pending"
}
```

All 87 new records are live and accessible via the Admin Dashboard.

---

## 5. Addendum: MCE NEW DATA.xlsx Import

A subsequent file, `MCE NEW DATA.xlsx`, was imported on the same day.

### 5.1 Overview
| Metric | Count | Details |
| :--- | :--- | :--- |
| **Total Rows in Excel** | 26 | Rows 2 through 27 |
| **Successfully Inserted Records** | **26** | 100% clean, new records |
| **Reference ID Range** | **`KSAW 490` – `KSAW 515`** | Sequentially continued from current DB maximum |
| **Skipped (Already in DB)** | **0** | No pre-existing Aadhaar duplicates found |
| **Skipped (Repeated in Excel)** | **0** | No intra-sheet duplicates |
| **Destination College Name** | `MALNAD COLLEGE OF ENGINEERING HASSAN` | Standardized |
| **Status** | `Pending` | Set across all rows |

### 5.2 Field Rules Applied
- `age_proof`: Set to student's Aadhaar Card Google Drive URL.
- `education_proof`: Set to highest qualification (PUC / Diploma URL if available, else SSLC URL).
- `aadhaar_proof`, `caste_proof`, `profile_image`: Preserved with Google Drive URLs.
- Unwanted fields (`SL NO`, `USN NUMBER`, `SEMESTER`, `MOTHER NAME`) excluded.

### 5.3 Batch Summary Table
| Ref ID | Student Name | Mobile Number | Aadhaar Number | Qualification | Stream | Preferred Course |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- |
| **KSAW 490** | Varshitha B N | 7204820566 | 460896719175 | BE ONGOING | Electronics and Communication Engineering | COMPUTER HARDWARE AND NETWORKING |
| **KSAW 491** | Nandan K N | 8073587428 | 954625298547 | BE ONGOING | Mechanical Engineering | COMPUTER HARDWARE AND NETWORKING |
| **KSAW 492** | Shashank B S | 6363297686 | 973273188981 | BE ONGOING | Mechanical Engineering | CISCO IT ESSENTIAL |
| **KSAW 493** | Goutham B R | 6362541818 | 496666578051 | BE ONGOING | Civil Engineering | CISCO IT ESSENTIAL |
| **KSAW 494** | Manoj K G | 9972750669 | 733560241088 | BE ONGOING | Automobile Engineering | CISCO IT ESSENTIAL |
| **KSAW 495** | Chandana G N | 9901416751 | 823438318357 | BE ONGOING | Information Science and Engineering | CISCO IT ESSENTIAL |
| **KSAW 496** | Rakshitha M S | 9113689408 | 704179373752 | BE ONGOING | Information Science and Engineering | CISCO IT ESSENTIAL |
| **KSAW 497** | Hemanth B R | 8088921820 | 832560505191 | BE ONGOING | Electronics and Communication Engineering | CISCO IT ESSENTIAL |
| **KSAW 498** | Sinchana B V | 8088194380 | 794966779461 | BE ONGOING | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 499** | Sinchana B R | 7899849206 | 321799279566 | BE ONGOING | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 500** | Sinchana M P | 8431806371 | 291127717466 | BE ONGOING | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 501** | Chandana B K | 7204981156 | 614050513813 | BE ONGOING | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 502** | Bindushree H S | 9353982857 | 647953253724 | BE ONGOING | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 503** | Likitha M C | 8088922475 | 572763266858 | BE ONGOING | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 504** | Sanjana K C | 9741517441 | 378857434526 | BE ONGOING | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 505** | Sanjana H S | 8088673751 | 382420800762 | BE ONGOING | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 506** | Bhoomika K S | 8088494921 | 823439062335 | BE ONGOING | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 507** | Sushma H B | 8867568581 | 913220087474 | BE ONGOING | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 508** | Yashaswini H T | 8971842036 | 609930773957 | BE ONGOING | Electronics and Instrumentation Engineering | CISCO IT ESSENTIAL |
| **KSAW 509** | Harsha V | 9686411516 | 973273188981 | BE ONGOING | Mechanical Engineering | CISCO IT ESSENTIAL |
| **KSAW 510** | Sinchana N R | 9880193189 | 903175114757 | BE ONGOING | Computer Science and Business Systems | CISCO IT ESSENTIAL |
| **KSAW 511** | Nischitha M S | 6363539265 | 711424368940 | BE ONGOING | Computer Science and Business Systems | CISCO IT ESSENTIAL |
| **KSAW 512** | Dhanyashree S B | 9019626608 | 949050382484 | BE ONGOING | Computer Science and Engineering | CISCO IT ESSENTIAL |
| **KSAW 513** | Chaithanya . | 6362699194 | 368631788451 | BE ONGOING | Computer Science and Engineering | CISCO IT ESSENTIAL |
| **KSAW 514** | Darshini S | 8151041797 | 707350795750 | BE ONGOING | Computer Science and Engineering | CISCO IT ESSENTIAL |
| **KSAW 515** | Ruchitha HS | 9945656197 | 886433524775 | BE ONGOING | Computer Science and Engineering | CISCO IT ESSENTIAL |

