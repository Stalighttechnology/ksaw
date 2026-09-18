import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function runSafeResequence() {
  console.log("=== STARTING SAFE REFERENCE ID RESEQUENCING ===");

  // 1. Authenticate with admin session
  const authEmail = `resequencer_${Date.now()}@gleamator.com`;
  const authPass = "AdminReseq@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData.session) {
    console.error("Authentication failed:", authErr);
    process.exit(1);
  }
  console.log("Supabase authentication session established.");

  // Exact map of target records to update
  // Format: [id, oldRef, newRef, applicantName]
  const targetUpdates = [
    {
      id: "bc39ff76-b547-470b-acb7-a4aeed15b2f5",
      name: "Nandini N",
      oldRef: "KSAW 1064",
      newRef: "KSAW 2689",
    },
    {
      id: "03aaaa6b-06cc-4409-991c-99c34519cc6d",
      name: "Niharika MO",
      oldRef: "KSAW 1094",
      newRef: "KSAW 2690",
    },
    {
      id: "9c606136-9131-45d9-86f2-2ef21a38970a",
      name: "Ashwini Saganna",
      oldRef: "KSAW 1128",
      newRef: "KSAW 2691",
    },
    {
      id: "f15893f3-bf5f-4320-b4db-2a34fcd2ee50",
      name: "MEGHANAGOWDA M C",
      oldRef: "KSAW 1433",
      newRef: "KSAW 2692",
    },
    {
      id: "db59c522-acac-438d-87f4-3703f69c26ef",
      name: "SINDHU M R",
      oldRef: "KSAW 1433",
      newRef: "KSAW 2693",
    },
    {
      id: "5809f4db-1efc-4c67-83b4-68650d893d35",
      name: "priya Darshini A S",
      oldRef: "KSAW 1433",
      newRef: "KSAW 2694",
    },
    {
      id: "6ae81614-8abe-433e-a238-739457340d19",
      name: "PUNYA S",
      oldRef: "KSAW 1433",
      newRef: "KSAW 2695",
    },
    {
      id: "e930a348-88f1-465f-ac89-acb9601a46c6",
      name: "NANDITHA G",
      oldRef: "KSAW 1433",
      newRef: "KSAW 2696",
    },
    {
      id: "9f57e3c1-3de4-4b40-9554-2f162e520954",
      name: "Madhushree.M",
      oldRef: "KSAW 1584",
      newRef: "KSAW 2697",
    },
    {
      id: "2a741622-84bd-48e9-a99a-9923ea44f2be",
      name: "Bhanupriya VS",
      oldRef: "KSAW 1593",
      newRef: "KSAW 2698",
    },
  ];

  console.log(`Applying updates to ${targetUpdates.length} duplicate records...`);

  let successCount = 0;
  for (const item of targetUpdates) {
    // Verify before update
    const { data: beforeRow, error: beforeErr } = await supabase
      .from("registrations")
      .select("id, reference_number, aadhaar_number, saf_number, first_name, last_name, status, admin_notes")
      .eq("id", item.id)
      .single();

    if (beforeErr || !beforeRow) {
      console.error(`Could not fetch record ${item.id} (${item.name}):`, beforeErr);
      continue;
    }

    console.log(`\n[UPDATING] ${item.name} (${item.id}):`);
    console.log(`  Current Ref: "${beforeRow.reference_number}" -> Target: "${item.newRef}"`);
    console.log(`  SAF: ${beforeRow.saf_number || 'N/A'} | Aadhaar: ${beforeRow.aadhaar_number} | Status: ${beforeRow.status}`);

    // Update ONLY reference_number
    const { data: updated, error: updateErr } = await supabase
      .from("registrations")
      .update({
        reference_number: item.newRef,
      })
      .eq("id", item.id)
      .select("id, reference_number, aadhaar_number, saf_number, first_name, last_name, status, admin_notes");

    if (updateErr) {
      console.error(`FAILED to update ${item.id}:`, updateErr.message);
    } else if (updated && updated.length > 0) {
      console.log(`  SUCCESS: Updated reference_number to "${updated[0].reference_number}"`);
      // Verify no other field changed
      if (
        updated[0].aadhaar_number === beforeRow.aadhaar_number &&
        updated[0].saf_number === beforeRow.saf_number &&
        updated[0].first_name === beforeRow.first_name &&
        updated[0].status === beforeRow.status
      ) {
        console.log(`  DATA INTEGRITY VERIFIED: All other fields remain identical.`);
        successCount++;
      } else {
        console.warn(`  WARNING: Field mismatch detected!`);
      }
    }
  }

  console.log(`\n=== COMPLETED ${successCount} / ${targetUpdates.length} UPDATES ===\n`);
}

runSafeResequence().catch(console.error);
