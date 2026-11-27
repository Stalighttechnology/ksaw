# Deveraj Urs Final List & Nigama Reconciliation Report

**Execution Timestamp:** 2026-10-28 19:48:23 IST  
**Source Files:**

- [`approved to dept/Deveraj Urs Final List.xls`](file:///Users/riteshn/Desktop/stalight%20project/ksaw/approved%20to%20dept/Deveraj%20Urs%20Final%20List.xls)
- [`approved to dept/D-13.10.2026.xlsx`](file:///Users/riteshn/Desktop/stalight%20project/ksaw/approved%20to%20dept/D-13.10.2026.xlsx)  
  **Database Table:** Supabase `registrations` (`nigama = 'Devraj Urs'`)

---

## 1. Executive Summary

The database status reconciliation for **Devraj Urs Nigama** is completely finished and verified:

1. **`Rejected` Tab Sheet (209 candidates):**
   - **91 candidates** previously sitting in `Sent to Department` were transitioned to `Rejected` (`admin_notes: "Rejected by Department (16-10-2026)"`).
   - **118 candidates** already had `status = 'Rejected'` and were confirmed intact.
   - **Post-reconciliation verification:** **100% (209/209) confirmed as `Rejected`**.

2. **Official Devraj Urs `Sent to Department` Count:**
   - **Exact total in Supabase DB:** **526 candidates**.
   - Exactly matches the combined official approved lists from both workbooks.

---

## 2. Devraj Urs Nigama Sent to Department Composition (526 Total)

| Source File                                                                                                                                 | Sheet Name         | Candidate Count | Status in Supabase          | Admin Notes        |
| :------------------------------------------------------------------------------------------------------------------------------------------ | :----------------- | :-------------- | :-------------------------- | :----------------- |
| [`Deveraj Urs Final List.xls`](file:///Users/riteshn/Desktop/stalight%20project/ksaw/approved%20to%20dept/Deveraj%20Urs%20Final%20List.xls) | **`Approved` tab** | **313**         | **Sent to Department**      | Sent to Department |
| [`D-13.10.2026.xlsx`](file:///Users/riteshn/Desktop/stalight%20project/ksaw/approved%20to%20dept/D-13.10.2026.xlsx)                         | **`Master Sheet`** | **213**         | **Sent to Department**      | Sent to Department |
| **Total Devraj Urs `Sent to Department`**                                                                                                   |                    | **526**         | **Verified 100% (526/526)** |                    |

---

## 3. Rejected & Reverted Candidates Status Summary

| Source File                                                                                                                                 | Sheet Name         | Candidate Count | Final DB Status | Admin Notes                         |
| :------------------------------------------------------------------------------------------------------------------------------------------ | :----------------- | :-------------- | :-------------- | :---------------------------------- |
| [`Deveraj Urs Final List.xls`](file:///Users/riteshn/Desktop/stalight%20project/ksaw/approved%20to%20dept/Deveraj%20Urs%20Final%20List.xls) | **`Rejected` tab** | **209**         | **Rejected**    | Rejected by Department (16-10-2026) |
| [`D-13.10.2026.xlsx`](file:///Users/riteshn/Desktop/stalight%20project/ksaw/approved%20to%20dept/D-13.10.2026.xlsx)                         | **`Sheet2`**       | **18**          | **Approved**    | Approved by Verifier                |

---

## 4. Live Database Verification Audit

- **Total `Devraj Urs` records in `registrations` table:** 990
- **`Sent to Department`:** **526** (313 + 213)
- **`Rejected`:** **333** (209 from Final List + 124 other rejections)
- **`Approved`:** **84**
- **`Pending Document`:** **42**
- **`Pending`:** **3**
- **`Approved by Dept`:** **2**
