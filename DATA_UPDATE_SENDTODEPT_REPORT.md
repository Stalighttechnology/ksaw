# 📋 Department Status Update Report: sendtodept.xlsx

**Execution Date:** 2026-10-28  
**Target Table:** `registrations` (Supabase DB)  
**File Processed:** [approved to dept/sendtodept.xlsx](file:///Users/riteshn/Desktop/stalight%20project/ksaw/approved%20to%20dept/sendtodept.xlsx)  
**Sheet Tab:** `Approved List V-28.10.2026`  
**New Status Applied:** `Sent to Department`  
**Admin Notes Updated:** `Sent to Department`  
**Excel File Updated:** Yes (`Status` and `Admin Notes` columns updated to `Sent to Department`)  

---

## 📊 Summary of Execution

| Metric | Count | Status |
|---|:---:|---|
| **Total Rows in Approved Tab** | **184 records** | ✅ Processed |
| **Unique Aadhaar Numbers** | **184** | ✅ 0 Duplicates in Sheet |
| **Matching Records Found in DB** | **184** | ✅ 100% Matched (0 Missing) |
| **Successfully Updated to 'Sent to Department'** | **184** | ✅ 100% Success |
| **Live Database Verification by Aadhaar** | **184 / 184** | ✅ 100% Verified (`Sent to Department`: 184) |
| **Excel Sheet Columns Updated** | **184 rows** | ✅ `Status` & `Admin Notes` updated |

---

## 🔄 Status Transition in DB

| Status Before Update | Count | Status After Update | Count |
|---|:---:|---|:---:|
| `Approved` | 184 | `Sent to Department` | 184 |
| **Total** | **184** | **Total** | **184** |

---

## 🛡️ Live Verification in Supabase
A post-update verification query was executed on the live database across all 184 candidate records:
- **`status` = `"Sent to Department"`**: **184 (100%)**
- **`admin_notes` = `"Sent to Department"`**: **184 (100%)**
- **Unupdated / Incomplete**: **0**

### Sample Verified Records:
| Reference ID | Aadhaar Number | Candidate Name | Status | Admin Notes |
|---|---|---|---|---|
| `KSAW 6488` | `387646371417` | Chaithra * | `Sent to Department` | `Sent to Department` |
| `KSAW 6487` | `753177659551` | Mounashree N | `Sent to Department` | `Sent to Department` |
| `KSAW 6486` | `435985854823` | Keerthana S | `Sent to Department` | `Sent to Department` |
| `KSAW 6485` | `369062337775` | Megha M | `Sent to Department` | `Sent to Department` |
| `KSAW 4398` | `254774177437` | SINCHANA K | `Sent to Department` | `Sent to Department` |

