# 📋 Department Status Update Report: Final Consolidated 09.10.2026.xlsx

**Execution Date:** 2026-10-28  
**Target Table:** `registrations` (Supabase DB)  
**File Processed:** [approved to dept/Final Consolidated 09.10.2026.xlsx](file:///Users/riteshn/Desktop/stalight%20project/ksaw/approved%20to%20dept/Final%20Consolidated%2009.10.2026.xlsx)  
**Total File Scope:** Serial Numbers 1 to 522 (All 522 Candidates)  
- **Approved / Sent Scope (SL 1 to 313):** `Sent to Department`  
- **Unapproved / Reverted Scope (SL 314 to 522):** `Rejected` (`Rejected by Department (16-10-2026)`)  

---

## 📊 Summary of Final State

| Scope | Candidate Count | Live Database Status | Admin Notes | Status |
|---|:---:|:---:|:---:|:---:|
| **SL 1 to 313** | **313** | `Sent to Department` | `Sent to Department` | ✅ 100% Verified |
| **SL 314 to 522** | **209** | `Rejected` | `Rejected by Department (16-10-2026)` | ✅ 100% Verified |
| **Total** | **522** | — | — | ✅ All Reconciled |

---

## 🔄 Breakdown of Actions Taken

1. **Initial Scope (SL 1 to 313):**
   - Corrected 91 records previously marked as Rejected → updated to **`Sent to Department`**.
   - Verified 222 records already marked as **`Sent to Department`**.
   - Final status: **313 / 313** are `Sent to Department`.

2. **Reverted Scope (SL 314 to 522):**
   - Reverted all 209 records back to **`Rejected`** with admin notes: `Rejected by Department (16-10-2026)`.
   - Final status: **209 / 209** are `Rejected`.

---

## 🛡️ Live Verification in Supabase

- **Rows 1 to 313 Verification:**
  - `status` = `"Sent to Department"`: **313 / 313 (100%)**
- **Rows 314 to 522 Verification:**
  - `status` = `"Rejected"`: **209 / 209 (100%)**
  - `admin_notes` = `"Rejected by Department (16-10-2026)"`: **209 / 209 (100%)**

### Sample Records in Scope 314 to 522 (Rejected):
| SL No | Reference | SAF Number | Aadhaar Number | Candidate Name | Status | Admin Notes |
|:---:|---|---|---|---|---|---|
| 314 | `KSAW 1008` | `SAF1479728` | `838220707020` | Aishwarya Teli | `Rejected` | `Rejected by Department (16-10-2026)` |
| 315 | `KSAW 926` | `SAF1479842` | `906968246598` | Akshatha Fakirappa Halakurki | `Rejected` | `Rejected by Department (16-10-2026)` |
| 316 | `KSAW 986` | `SAF1479108` | `411410382960` | Sanjana Alagundagi | `Rejected` | `Rejected by Department (16-10-2026)` |
| 317 | `KSAW 998` | `SAF1479738` | `231851660246` | Sanjana Budni | `Rejected` | `Rejected by Department (16-10-2026)` |
| 318 | `KSAW 906` | `SAF1479929` | `493421944928` | Prathiksha Devadiga | `Rejected` | `Rejected by Department (16-10-2026)` |
