import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BatchItem {
  id: string;
  name: string;
  sheetName?: string;
  totalCount?: number;
  applicantIds: string[];
  safNumbers: string[];
  referenceNumbers: string[];
  aadhaarNumbers: string[];
}

export interface BatchesManifest {
  version: number;
  lastUpdated: string;
  batches: BatchItem[];
  applicantBatchMap: Record<string, string>;
  safBatchMap: Record<string, string>;
  refBatchMap: Record<string, string>;
  aadhaarBatchMap: Record<string, string>;
}

const STORAGE_BUCKET = "registrations";
const MANIFEST_FILE_NAME = "batches_manifest.json";

export const BUILTIN_BATCH_1: BatchItem = {
  id: "KSAWU/HSN/CPG/0926-7",
  name: "KSAWU/HSN/CPG/0926-7",
  sheetName: "KSAWU HSN CPG 0926-7",
  totalCount: 30,
  applicantIds: [
      "8e396c39-bc2e-4027-9d4e-37298744530d",
      "67e5f41b-22ef-4ce3-96c8-a46cc6fd82d4",
      "d9cb8823-ed6e-424f-92e5-967e526226fe",
      "5b4aadf8-b0ef-4560-af56-8c223025f5c8",
      "ecd0b499-312e-427f-8265-6a71decf1588",
      "480ef1ed-5d09-4876-8af7-3f4ae61040cf",
      "6df3afe9-5d43-407f-b33a-11b865dc133e",
      "d5cc5ece-3657-496c-970c-28d84946356e",
      "6bd65a50-f4c2-4ef9-ae57-ef080af78c48",
      "c40b2019-ee80-49c7-b842-27f5e6afa035",
      "29c943da-606c-4703-9ef9-8edf24c56b3b",
      "9d0c1a73-0f29-44fb-810a-fac04905d0c5",
      "9c6b0cf3-ee6e-4412-8573-5039e3daec4b",
      "22545f40-82a0-4d37-a0c0-d8a23fef7583",
      "19b1d3db-2312-48ec-9feb-d11bd9b7226b",
      "5d953041-be18-4862-8408-665b11a50e40",
      "dfea70e2-ba5a-4bfe-bc37-ecc673d516a6",
      "b07d7dc0-ff66-4a7e-ba01-6a4578dc4473",
      "fc2f7ad7-e80e-49e6-93aa-95cae31ce16d",
      "8122750b-cd46-4d7b-9ae1-1ad3662535c2",
      "1ed90d7f-6ae8-47ff-a54d-84998507e9aa",
      "38dce317-a0ce-45ff-9c88-850b42ba3de5",
      "b9af91a9-2faa-48e5-8e6f-5d434258e588",
      "50f277c0-9888-4fe4-93e7-ba9b7a07e480",
      "bf2885cc-94fc-4695-a232-3e89feaf0a2d",
      "1fee63e0-bc7b-46b9-855e-99a14931011f",
      "c7b62b18-1cca-45a9-ad6a-0f278ed87e50",
      "80778879-23d5-4112-bd63-5a0c26282060",
      "766cef64-317c-4608-8f0c-e881df174f40",
      "c1a1e1d2-91c7-43bb-a4e1-6f9c9b309c7a"
  ],
  safNumbers: [
      "SAF1479164",
      "SAF1477474",
      "SAF1477483",
      "SAF1477486",
      "SAF1477491",
      "SAF1477503",
      "SAF1477666",
      "SAF1477671",
      "SAF1477693",
      "SAF1477694",
      "SAF1477704",
      "SAF1477705",
      "SAF1477706",
      "SAF1477696",
      "SAF1477708",
      "SAF1477709",
      "SAF1477710",
      "SAF1477701",
      "SAF1477711",
      "SAF1477712",
      "SAF1477713",
      "SAF1477715",
      "SAF1477716",
      "SAF1477717",
      "SAF1477718",
      "SAF1484701",
      "SAF1479745",
      "SAF1478840",
      "SAF1479275",
      "SAF1484698"
  ],
  referenceNumbers: [
      "KSAW 001",
      "KSAW 006",
      "KSAW 217",
      "KSAW 409",
      "KSAW 412",
      "KSAW 415",
      "KSAW 420",
      "KSAW 422",
      "KSAW 423",
      "KSAW 426",
      "KSAW 451",
      "KSAW 452",
      "KSAW 456",
      "KSAW 461",
      "KSAW 464",
      "KSAW 465",
      "KSAW 468",
      "KSAW 471",
      "KSAW 472",
      "KSAW 474",
      "KSAW 478",
      "KSAW 479",
      "KSAW 481",
      "KSAW 483",
      "KSAW 485",
      "KSAW 492",
      "KSAW 494",
      "KSAW 495",
      "KSAW 496",
      "KSAW 497"
  ],
  aadhaarNumbers: [
      "606730770498",
      "207842105721",
      "753691712351",
      "658899970189",
      "555491154150",
      "863192259739",
      "690241425023",
      "471232704298",
      "269043384886",
      "252283045708",
      "306985410963",
      "718833272812",
      "381822052935",
      "363736299132",
      "924554608900",
      "709664402077",
      "601168840527",
      "215519052958",
      "671275577445",
      "346959548852",
      "769267847456",
      "272767742882",
      "975681262188",
      "976870868064",
      "230567528709",
      "738510858867",
      "521407692788",
      "675107214658",
      "259506224292",
      "271994111721"
  ]
};

export const BUILTIN_BATCH_2: BatchItem = {
  id: "KSAWU/HSN/CPG/0926-8",
  name: "KSAWU/HSN/CPG/0926-8",
  sheetName: "KSAWU HSN CPG 0926-8",
  totalCount: 27,
  applicantIds: [
      "c5c1bdc3-c741-4c57-a10d-3b2efb830ea1",
      "6d374b60-1634-4e2f-9871-ae37a2d0e1c1",
      "052198ca-97d5-4996-9b55-fbf9fe303148",
      "c0d30631-13c3-4bf0-a2dd-15c8ca4f3366",
      "ab0be591-5d93-4b70-9b50-2a8efc8ed25d",
      "fcc4ae0b-d36a-4f29-85b7-1ddae8b7a5d8",
      "b6618199-6cce-4b8d-81c7-35afb075eae8",
      "09bf00a6-b61b-4142-ad1e-d05a77720599",
      "63bd0962-d0fd-4ed2-b0e5-f6558d5ae467",
      "1b39682a-64fd-4f1a-b5e5-515331629e78",
      "e88bdb0e-fd54-4785-b651-88851e7075c3",
      "61b4e6fc-8df1-4101-80fa-1d2b53b3411f",
      "063b959f-dfca-498d-813d-88fa6920994d",
      "1185a6cf-44bb-4109-a218-d408db98acc3",
      "8e7ddd1f-7ca4-4d0c-ba2f-938d771c61e1",
      "3e1f59af-fb37-4299-8dcf-79f200170cfe",
      "577fff71-0c8d-438f-91a0-86b02e020b3e",
      "d94b7283-dd3f-44be-863c-d345ccfb43fe",
      "7b8de2bf-6f0c-418b-afd6-89c77f51ef49",
      "75c167ea-946c-4b92-acf2-0971fa8e1072",
      "b94dff55-869e-4462-97ac-32c3629c4c6e",
      "05af22fc-e2ea-4a4a-9939-5c5ff3b853f8",
      "0fa1cac0-f724-4f75-a304-0518ad6c8fba",
      "fee44a23-16ef-4d49-8bc4-4903043e39ef",
      "06a32cc3-761b-476f-867f-a4c4ebf15ca1",
      "20c7d48d-156a-4afb-ace5-61a76116d33c",
      "41940cdc-140a-456a-b4d1-a16b06c45525"
  ],
  safNumbers: [
      "SAF1479733",
      "SAF1479654",
      "SAF1484700",
      "SAF1284282",
      "SAF1479709",
      "SAF1479232",
      "SAF1479269",
      "SAF1479209",
      "SAF1479142",
      "SAF1478708",
      "SAF1477477",
      "SAF1477478",
      "SAF1477498",
      "SAF1477697",
      "SAF1478834",
      "SAF1478964",
      "SAF1479308",
      "SAF1479312",
      "SAF1477484",
      "SAF1477519",
      "SAF1477520",
      "SAF1477522",
      "SAF1477719",
      "SAF1477720",
      "SAF1479656",
      "SAF1480191",
      "SAF1480183"
  ],
  referenceNumbers: [
      "KSAW 502",
      "KSAW 503",
      "KSAW 504",
      "KSAW 505",
      "KSAW 506",
      "KSAW 510",
      "KSAW 511",
      "KSAW 513",
      "KSAW 816",
      "KSAW 827",
      "KSAW 008",
      "KSAW 191",
      "KSAW 414",
      "KSAW 466",
      "KSAW 501",
      "KSAW 508",
      "KSAW 205",
      "KSAW 214",
      "KSAW 290",
      "KSAW 416",
      "KSAW 417",
      "KSAW 419",
      "KSAW 425",
      "KSAW 431",
      "KSAW 437",
      "KSAW 441",
      "KSAW 444"
  ],
  aadhaarNumbers: [
      "491558994800",
      "575487485467",
      "771630220313",
      "324559826972",
      "573541294966",
      "702482283481",
      "472497940591",
      "368631788451",
      "934756597213",
      "945895217016",
      "660616435737",
      "779658086664",
      "749845973623",
      "814371281997",
      "542870006956",
      "935876115048",
      "511971796366",
      "918655116065",
      "534013471267",
      "883972164051",
      "502713420325",
      "376503764979",
      "538329564145",
      "282585347004",
      "439388328587",
      "542271243615",
      "333145665929"
  ]
};

export const BUILTIN_BATCH_3: BatchItem = {
  id: "KSAWU/HSN/CPG/0926-37",
  name: "KSAWU/HSN/CPG/0926-37",
  sheetName: "KSAWU HSN CPG 0926-37",
  totalCount: 18,
  applicantIds: [
      "558190e3-2a08-425f-b4be-b071b69a9b95",
      "5fba71ac-7959-4ac5-afc0-f2ae1b5ef07a",
      "f384819e-d944-4181-99ac-0d5669ea026e",
      "1cd1eb2f-1293-4679-947a-b6a9c7864d88",
      "41dd8309-ca01-41a3-8bbb-d74755d53c6b",
      "766573c5-4209-45ec-99bd-083d786dde2b",
      "48972af0-2ff8-4749-a788-2bfc2bd06a69",
      "2dd0da9f-f5ac-4421-8da5-c1c643494a85",
      "0c98b690-39bd-4595-8aaa-db837475c135",
      "748cf0de-32f2-4267-b8a5-6dd24cb2aea4",
      "0a8406be-1e99-4e78-a81e-9897bd410d15",
      "b1bf7803-00f7-4c1e-ba57-c4cda921ba01",
      "88afefa9-cdab-4880-92fe-9ba73848817d",
      "8ff49d7b-2623-4d13-8c2a-90829089d732",
      "6a91ca92-e884-47c6-b0d6-c8f28b8f308e",
      "ae514481-1323-41ca-a624-32a03b078bd7",
      "d7524845-a8eb-4aee-a849-d9531d44f1f4",
      "3d4aecff-f77b-4991-8ed0-007867478cf9"
  ],
  safNumbers: [
      "SAF1479975",
      "SAF1479977",
      "SAF1480020",
      "SAF1480024",
      "SAF1469379.",
      "SAF1480177.",
      "SAF1366817",
      "SAF1478562",
      "SAF1480012",
      "SAF1480015",
      "SAF1478793.",
      "SAF1478602",
      "SAF1480173",
      "SAF1479195",
      "SAF1479270",
      "SAF1478771",
      "SAF1478693",
      "SAF1480146"
  ],
  referenceNumbers: [
      "KSAW 458",
      "KSAW 459",
      "KSAW 462",
      "KSAW 470",
      "KSAW 480",
      "KSAW 484",
      "KSAW 487",
      "KSAW 490",
      "KSAW 493",
      "KSAW 498",
      "KSAW 499",
      "KSAW 507",
      "KSAW 509",
      "KSAW 512",
      "KSAW 514",
      "KSAW 821",
      "KSAW 832",
      "KSAW 1525"
  ],
  aadhaarNumbers: [
      "255151683518",
      "708839618499",
      "435356053999",
      "552476690738",
      "487544488396",
      "972182501087",
      "539869027167",
      "460896719175",
      "477242110515",
      "947639824761",
      "785402841780",
      "783205971500",
      "804430543148",
      "949050382484",
      "707350795750",
      "886108855747",
      "601699784947",
      "387521881851"
  ]
};

export const BUILTIN_BATCH_4: BatchItem = {
  id: "KSAWU/HSN/CHN/0926-2",
  name: "KSAWU/HSN/CHN/0926-2",
  sheetName: "0926-2",
  totalCount: 27,
  applicantIds: [
      "f6fae7db-6bd2-4e8e-92c4-8ac0b87c4556",
      "efa518ad-3cd5-4de8-a74a-f499ce9c96cf",
      "4ebf390f-81e9-4fda-9264-f5b325f184ac",
      "932e56d3-26f8-4693-8894-3565328d3969",
      "fc48961f-0b55-4498-9359-632858bfdd9d",
      "7db74c9d-f9e6-4ee8-9472-60fa62e606c3",
      "402e3b61-fa4a-4843-9df2-4b3c14ee448a",
      "7c5a89b8-ba1a-49a9-9763-eeb45f325f85",
      "977bcbfe-610e-4ce9-a9df-1e362630a5de",
      "7ac5b4d0-3ece-40b3-9e27-bb0ae2773c7e",
      "3fbc50ea-4350-48bc-825e-c555ea4f0e1d",
      "ebcd2fd8-4225-4d6c-8040-3034f5eb669c",
      "901d85b9-7a94-4373-abae-05b2cd0341d0",
      "b1d56aad-e9a3-4aba-91eb-ba4ffb9366c8",
      "04bf87d1-b2cc-4ce3-a6f3-af8d7bc7d894",
      "079f3826-15f6-4805-b0f1-5a47f52d3523",
      "ff1f87ad-0ec0-49d7-b1e7-c2e419652d8e",
      "a71e5224-6c89-4bd3-a3b5-4fabdf70ce57",
      "59fc1e37-d1a5-40af-95ad-6c18c544837c",
      "483f4ce5-c211-47cd-84c7-95c1d2a3bd10",
      "9644a248-8b73-4757-a37d-e69f58461eac",
      "17aae8fc-f4db-4dac-a53a-c12ecb131fb8",
      "6a11a9f4-449f-43f6-8f3b-3e19ed1f262c",
      "ed961682-a4e8-451d-9853-1b9bb2494e11",
      "837c086c-4bab-4dc5-8599-bc6018fd4b57",
      "2078c6dd-1008-4ebe-9a99-784c192d4119",
      "8933b7fe-cba9-479a-abad-54181e4f6ce5"
  ],
  safNumbers: [
      "SAF1478283",
      "SAF1478281",
      "SAF1479027",
      "SAF1479026",
      "SAF1479025",
      "SAF1479024",
      "SAF1479022",
      "SAF1479021",
      "SAF1479020",
      "SAF1479019",
      "SAF1479018",
      "SAF1479015",
      "SAF1479014",
      "SAF1479013",
      "SAF1479012",
      "SAF1479011",
      "SAF1479005",
      "SAF1478996",
      "SAF1478991",
      "SAF1478994",
      "SAF1478988",
      "SAF1478985",
      "SAF1478983",
      "SAF1478844",
      "SAF1478831",
      "SAF1479451",
      "SAF1479449"
  ],
  referenceNumbers: [
      "KSAW 069",
      "KSAW 070",
      "KSAW 071",
      "KSAW 072",
      "KSAW 073",
      "KSAW 080",
      "KSAW 086",
      "KSAW 088",
      "KSAW 089",
      "KSAW 091",
      "KSAW 092",
      "KSAW 100",
      "KSAW 101",
      "KSAW 102",
      "KSAW 103",
      "KSAW 104",
      "KSAW 113",
      "KSAW 146",
      "KSAW 155",
      "KSAW 156",
      "KSAW 166",
      "KSAW 193",
      "KSAW 227",
      "KSAW 570",
      "KSAW 728",
      "KSAW 847",
      "KSAW 909"
  ],
  aadhaarNumbers: [
      "977405277058",
      "923710460013",
      "444291643786",
      "843121488516",
      "212747809791",
      "984236381548",
      "526795467643",
      "461334382453",
      "365176690769",
      "490882749689",
      "314477232820",
      "662029016278",
      "235711615036",
      "621348291843",
      "555215515642",
      "420695093930",
      "859864416421",
      "499777292772",
      "270318121530",
      "763132705297",
      "403300509533",
      "437031099214",
      "790083012974",
      "249730622614",
      "232333433702",
      "343774410348",
      "646659942437"
  ]
};

export const BUILTIN_BATCH_5: BatchItem = {
  id: "KSAWU/HSN/CHN/0926-3",
  name: "KSAWU/HSN/CHN/0926-3",
  sheetName: "0926-3",
  totalCount: 23,
  applicantIds: [
      "875d8ef0-7f86-41de-a6eb-c3bff5b5546d",
      "0756fce9-24e8-4e94-bc2c-26368236cef9",
      "8153ebd2-2e62-4a26-b0a9-439cbc760099",
      "63c71457-621d-4dcf-a1f3-868c92affd86",
      "a04aeeca-30b3-4924-a055-c5c77cfc19ad",
      "8ad189a3-499c-49f9-a241-b99f0d5c1a29",
      "9fdfb149-f1eb-44e9-95ec-1dcc5f14819e",
      "1e58b5fc-20fc-4a5e-a41f-ee13067998f6",
      "a945fb8c-3eca-470a-a03a-00551bc8c6fe",
      "152f9d32-0144-40ff-abc1-0890c3c5d8ed",
      "1de4683b-4aff-4e36-933b-a636fc1e85fa",
      "f1bdf575-d0e2-4c4f-97ef-76bbbfc9d59c",
      "6a1236ac-d6e1-453f-8c98-e6298ff761e8",
      "05caccf6-1f12-4ba2-a986-6533dde19a73",
      "bace8d10-f573-431d-aee5-90550dd8a988",
      "77cd296f-e834-4be3-b80f-827cb72f1788",
      "c3d34015-4f74-4efa-b4af-b27f12655db1",
      "96d94c94-cbd6-44ca-96a3-e5896defbc7d",
      "b120eac1-0bda-4a11-8a0b-10465b7a9296",
      "d9d405e2-9484-4a0f-b54d-dc4d15a01275",
      "a01686c1-5504-4568-ab88-cd62ac78313c",
      "87d43961-cbfe-4e1f-8302-3fe85164f4ad",
      "6e719f48-9d55-40ce-817d-f9f8b70987db"
  ],
  safNumbers: [
      "SAF1478980",
      "SAF1478978",
      "SAF1478976",
      "SAF1478973",
      "SAF1478968",
      "SAF1478966",
      "SAF1478963",
      "SAF1478961",
      "SAF1478958",
      "SAF1478954",
      "SAF1478951",
      "SAF1478948",
      "SAF1478944",
      "SAF1478940",
      "SAF1478935",
      "SAF1478927",
      "SAF1478937",
      "SAF1478925",
      "SAF1478916",
      "SAF1478931",
      "SAF1478924",
      "SAF1478921"
  ],
  referenceNumbers: [
      "KSAW 230",
      "KSAW 231",
      "KSAW 235",
      "KSAW 241",
      "KSAW 250",
      "KSAW 256",
      "KSAW 258",
      "KSAW 263",
      "KSAW 266",
      "KSAW 269",
      "KSAW 272",
      "KSAW 273",
      "KSAW 276",
      "KSAW 279",
      "KSAW 283",
      "KSAW 284",
      "KSAW 286",
      "KSAW 291",
      "KSAW 293",
      "KSAW 638",
      "KSAW 846",
      "KSAW 850",
      "KSAW 852"
  ],
  aadhaarNumbers: [
      "319994090079",
      "660238079817",
      "225080415561",
      "750717764245",
      "799036472879",
      "587070528646",
      "503341564227",
      "909230373902",
      "939359876472",
      "392634690917",
      "917043425846",
      "844847446565",
      "319357992804",
      "676446657231",
      "649605281203",
      "581660690322",
      "420783916113",
      "923073728327",
      "775818491173",
      "411798110590",
      "578397363118",
      "257528166268",
      "314156043938"
  ]
};

export const BUILTIN_BATCH_6: BatchItem = {
  id: "KSAWU/HSN/CPG/0926-4",
  name: "KSAWU/HSN/CPG/0926-4",
  sheetName: "CPG 0926-4",
  totalCount: 28,
  applicantIds: [
      "0c64fa1b-3d76-416a-96df-5ccd65bb564a",
      "3e6f94fa-961d-400f-ba67-94dfa56edc6b",
      "fa84613e-eeb8-482c-96c8-d5a9309ef06d",
      "deee35f8-5008-4652-9344-7b91d8609060",
      "994f7ff8-be79-4a00-8098-49138df745b4",
      "b14edb50-52a4-46f4-b1d4-5bdb17c01f53",
      "d10be45b-bfe2-44df-a84a-3ce2dbd8a732",
      "269bc73d-827a-4020-b920-ba9cb9fba41f",
      "dbd96be8-78ad-4b19-8061-889fbcb11b1c",
      "5497d570-ea1e-417c-bfda-a6d1b252160c",
      "3722aed5-5615-41fd-81cf-40a122a62d72",
      "e8f9b949-e591-4d3d-9a67-79fdca8e41da",
      "f7816dbf-dfec-4158-b71d-ea69cbc5b218",
      "3a047cb5-ce0d-4999-8701-b4e602f04649",
      "3e2cefe3-26d3-46c6-9694-9d259b1000fe",
      "d168c15c-3966-4c53-a2ff-a7469fef030f",
      "1661dab6-aa72-45fa-9540-fbfb731caf58",
      "8b95dd47-9fc4-4820-849f-323b12a9fbd2",
      "210604be-fbf0-474a-a3ab-7092be37c590",
      "6fb09749-913d-4b80-82f4-3df1032cdf1b",
      "dcd0fc5d-b99a-4a03-944c-596a508472ca",
      "f93261f6-da93-4e02-accd-c04350e77818",
      "246d2513-e296-46dc-8157-d6b9de3520de",
      "365d7981-c437-4554-8653-546af5d28d30",
      "434b2b3a-431b-4e51-82c4-6268b74b4b93",
      "3b371098-5855-4ad1-987e-1255f786e997",
      "171cbeb2-5dc3-4497-a321-f148e682775e",
      "fc054a29-4161-4008-8f01-40aacd7303cb"
  ],
  safNumbers: [
      "SAF1479093",
      "SAF1479090",
      "SAF1479087",
      "SAF1479040",
      "SAF1479039",
      "SAF1479038",
      "SAF1479037",
      "SAF1479036",
      "SAF1479035",
      "SAF1479034",
      "SAF1479033",
      "SAF1479032",
      "SAF1479031",
      "SAF1479030",
      "SAF1479029",
      "SAF1479028",
      "SAF1476435",
      "SAF1479023",
      "SAF1479017",
      "SAF1479016",
      "SAF1479008",
      "SAF1479006",
      "SAF1479001",
      "SAF1478998",
      "SAF1478970",
      "SAF1478920",
      "SAF1478733",
      "SAF1479419"
  ],
  referenceNumbers: [
      "KSAW 032",
      "KSAW 037",
      "KSAW 038",
      "KSAW 043",
      "KSAW 044",
      "KSAW 045",
      "KSAW 046",
      "KSAW 048",
      "KSAW 049",
      "KSAW 054",
      "KSAW 055",
      "KSAW 056",
      "KSAW 057",
      "KSAW 058",
      "KSAW 062",
      "KSAW 065",
      "KSAW 066",
      "KSAW 084",
      "KSAW 094",
      "KSAW 099",
      "KSAW 106",
      "KSAW 109",
      "KSAW 114",
      "KSAW 126",
      "KSAW 249",
      "KSAW 292",
      "KSAW 818",
      "KSAW 927"
  ],
  aadhaarNumbers: [
      "534627603814",
      "657299982130",
      "611298225655",
      "575970296921",
      "556970042196",
      "615134681120",
      "669217746372",
      "288675458805",
      "751255668242",
      "713493290855",
      "520759167684",
      "617515424010",
      "926177572251",
      "879592383862",
      "587394847812",
      "261310955153",
      "797251221456",
      "518798936935",
      "772524514474",
      "718584554352",
      "793829058496",
      "867661500105",
      "432907134899",
      "835168316236",
      "442042230772",
      "845336717020",
      "304668785765",
      "395339213668"
  ]
};

export const BUILTIN_BATCH_7: BatchItem = {
  id: "KSAWU/HSN/CHN/0926-18",
  name: "KSAWU/HSN/CHN/0926-18",
  sheetName: "0926-18",
  totalCount: 30,
  applicantIds: [
      "21de3e94-de66-459a-aca4-5442e3816dbf",
      "60c1d9ce-b1d4-41fd-a0b8-06bfb59d7c12",
      "53011228-4ab3-4f4c-8538-c95d1e1d5c43",
      "37098367-1698-404a-ac5a-19d951d58ba3",
      "b7da123d-5dd0-4316-92ea-29721c15d4bd",
      "be5b6cc3-20b6-413e-a09d-3dc2d7eefa45",
      "f7504f88-c963-4118-ab44-caac9647793a",
      "e13cf0bd-5396-498f-99ab-f53b4ed32daf",
      "7b932834-3e66-4c9d-bfda-a0bad555ad6d",
      "107790e5-62af-492e-a1a5-ad3c8b204253",
      "542997a2-496b-469a-98c3-d76ea2360a61",
      "59267ab8-1c80-4fbc-95be-2c41bc8be849",
      "445a6c1f-89cb-4bac-b652-5acfcaeb46a8",
      "bf771896-e06b-498b-b027-2a64f00e3b4a",
      "f3a7f1e2-b812-4b11-8b5d-43728871bb5b",
      "f8eb8624-e031-47db-9e92-ca0f155916e3",
      "31079457-3706-446f-b80f-1806c2037fce",
      "e3c2d812-776b-4847-88ad-4ee99c20b0cb",
      "76aa47c8-e372-453a-9fae-eeda05b493ee",
      "a81e23c1-6400-4583-87de-bb10b81efd32",
      "85a06389-c05b-4c11-b170-4e1b5638aef8",
      "b5f1d964-8ce3-46ed-b2cc-5bf66e7bae7a",
      "a6cf8aaa-63e1-4fb9-a383-94bb9ee28865",
      "942e36e2-317a-4e4d-bd5c-28dfda654a54",
      "cf79f7ec-5c43-4c4f-9fc5-fda1acac35f9",
      "1d2f5ac8-967e-46ac-bc36-026b7cef9f37",
      "731c9b55-8f6a-44a0-8fc3-09a5790e7dac",
      "8567002d-ae67-46f2-938c-9907f7499e68",
      "c0a37407-bfe5-4d7a-9ec2-040574c365cd",
      "7d31cba6-c85d-40c8-a9d5-5305812aa839"
  ],
  safNumbers: [
      "SAF1479494",
      "SAF1479493",
      "SAF1479491",
      "SAF1479489",
      "SAF1478282",
      "SAF1478723",
      "SAF1479485",
      "SAF1479484",
      "SAF1479482",
      "SAF1479480",
      "SAF1479478",
      "SAF1479476",
      "SAF1479475",
      "SAF1479474",
      "SAF1479473",
      "SAF1479471",
      "SAF1479468",
      "SAF1479467",
      "SAF1479463",
      "SAF1476449",
      "SAF1479462",
      "SAF1479460",
      "SAF1479458",
      "SAF1479457",
      "SAF1479456",
      "SAF1479454",
      "SAF1478979",
      "SAF1478974",
      "SAF1478862",
      "SAF1478857"
  ],
  referenceNumbers: [
      "KSAW 039",
      "KSAW 040",
      "KSAW 042",
      "KSAW 051",
      "KSAW 063",
      "KSAW 064",
      "KSAW 079",
      "KSAW 085",
      "KSAW 087",
      "KSAW 096",
      "KSAW 098",
      "KSAW 105",
      "KSAW 107",
      "KSAW 111",
      "KSAW 125",
      "KSAW 138",
      "KSAW 142",
      "KSAW 181",
      "KSAW 182",
      "KSAW 184",
      "KSAW 188",
      "KSAW 194",
      "KSAW 197",
      "KSAW 201",
      "KSAW 203",
      "KSAW 228",
      "KSAW 268",
      "KSAW 270",
      "KSAW 563",
      "KSAW 565"
  ],
  aadhaarNumbers: [
      "915754534697",
      "925814121315",
      "931414688078",
      "726750678015",
      "576191190094",
      "585104620877",
      "455628634221",
      "742748007590",
      "606894319010",
      "718399382588",
      "370108226727",
      "962562771566",
      "361016062086",
      "784411471331",
      "442971769464",
      "561055880465",
      "442496171607",
      "208042702051",
      "364329294327",
      "752287858530",
      "226632828520",
      "731232236709",
      "723983270025",
      "947517650450",
      "712429795439",
      "374924910990",
      "907722501796",
      "809149920311",
      "602299363848",
      "657518091043"
  ]
};

export const BUILTIN_BATCH_8: BatchItem = {
  id: "KSAWU/HSN/CHN/0926-22",
  name: "KSAWU/HSN/CHN/0926-22",
  sheetName: "0926-22",
  totalCount: 21,
  applicantIds: [
      "15010087-9c02-436e-9180-58a14c0244ed",
      "e7920703-ca3b-4863-ab56-e0be6386cd10",
      "8b64c915-0cfb-47bd-b58f-9505dd2e8aae",
      "60b1b2c1-f3cc-43ec-bd96-9c2901fec879",
      "8247d81c-1de1-4b35-80e3-870682bee501",
      "c7d51b6d-4380-45aa-85b4-267af3dbeb16",
      "cb0cf33a-d4b2-43cc-857d-97cce8ca71cb",
      "1db5e73e-f3c3-46d1-ab20-2abce71d9136",
      "ebfeee23-94d6-4d6c-a8d5-22246a63a533",
      "49815538-598c-4d7e-b866-19588fe429af",
      "44926735-59fe-4b65-bdf2-f3c3f6c5e050",
      "f4865cc7-1692-432f-a8ef-2bb5c8505fd0",
      "2fecfa57-2ef6-42d5-b241-1b69b414d4d1",
      "75035858-851f-4ba0-a1e5-4a52eceef64b",
      "361c63b9-7d9c-4a02-9015-c931bf007782",
      "713332f8-ac7e-44a8-a129-7d086040e821",
      "f50c1628-c113-425f-90eb-673798b1d175",
      "11dc1049-29b5-4760-8178-34207ee730f6",
      "3ab15a47-7550-4400-a430-2e3349226862",
      "96feab9e-1302-499f-82a4-9065c9fe1862",
      "61d5dd38-3bc1-4cca-ab1b-a224b8dd7817"
  ],
  safNumbers: [
      "SAF1478981",
      "SAF1478984",
      "SAF1478989",
      "SAF1478990",
      "SAF1479487",
      "SAF1478280",
      "SAF1478993",
      "SAF1478995",
      "SAF1478999",
      "SAF1479196",
      "SAF1479469",
      "SAF1479081",
      "SAF1479054",
      "SAF1479010",
      "SAF1478986",
      "SAF1478965",
      "SAF1478956",
      "SAF1478939",
      "SAF1478906",
      "SAF1478843",
      "SAF1478753"
  ],
  referenceNumbers: [
      "KSAW 034",
      "KSAW 041",
      "KSAW 052",
      "KSAW 053",
      "KSAW 061",
      "KSAW 076",
      "KSAW 090",
      "KSAW 093",
      "KSAW 095",
      "KSAW 131",
      "KSAW 141",
      "KSAW 220",
      "KSAW 242",
      "KSAW 246",
      "KSAW 251",
      "KSAW 271",
      "KSAW 274",
      "KSAW 281",
      "KSAW 549",
      "KSAW 584",
      "KSAW 794"
  ],
  aadhaarNumbers: [
      "464402290486",
      "639882064939",
      "511800122713",
      "898505971924",
      "973129392047",
      "991699522754",
      "637888052495",
      "490165419742",
      "971330958923",
      "914788699616",
      "971136856666",
      "707521586316",
      "312408017492",
      "306040577611",
      "871968865349",
      "319444579190",
      "849038229352",
      "308414626540",
      "874309353838",
      "796950358191",
      "638692177582"
  ]
};

export const BUILTIN_BATCH_9: BatchItem = {
  id: "KSAWU/HSN/CPG/0926-6",
  name: "KSAWU/HSN/CPG/0926-6",
  sheetName: "KSAWU HSN CPG 0926-6",
  totalCount: 29,
  applicantIds: [
      "a78af091-7780-496e-bf26-2011bf2665b9",
      "608ef12a-d8da-4139-a6e1-d7c7480ffdf7",
      "ff54b97d-fafb-4571-891c-29b4fb93a904",
      "5da98659-2eff-42f9-90a2-16f5e5dc01aa",
      "198099ae-be8e-4d46-b08d-c5f8d50de154",
      "453d6915-534c-4ec8-b7f5-5519a36bfe7d",
      "7cc94bf3-1c88-401e-b14e-a231a9f2b38c",
      "522dd40c-1cec-41c8-a43d-40a5572a9a3e",
      "f2f33176-fd88-46b0-935e-84b418b618e8",
      "a0ac4e54-294b-44cb-ba8e-1ec24f6b3fdb",
      "6c13dd43-a5db-4310-910b-dc6118e7685f",
      "0ec24d51-b4d9-49e7-8a11-3b63bb2c9e8f",
      "8434f590-1054-46bf-968b-afd474759a1b",
      "d8e9c758-65f4-4c44-9e36-5c78f2420107",
      "aaadf5d4-e638-4bd6-b8e6-341e4dcd75fb",
      "7d06af4a-15ed-4212-931b-1d983b16a533",
      "3571fd47-5b7f-49fd-9c1c-efedcb83b46f",
      "2a710958-bfb6-403a-b5e9-e167b046d912",
      "726051d4-40f2-470d-b960-2a6b62837cc9",
      "46ef0431-ce04-40f7-85bf-158095d64559",
      "1fe4cc9e-f6c2-47b5-8422-f6972f0ef848",
      "fad3a014-85ac-405b-a5ff-21262b44c951",
      "6fe43fbd-b009-433a-afa7-095b984e1cdd",
      "be5e4ce5-9798-45b0-b6ab-99dd9461685c",
      "1ed87a45-0974-4a78-bb06-6f0d293bbe81",
      "2ac0fedf-2a56-4290-9eec-05ffb00baf79",
      "f8d85a61-3e6f-4870-bddc-a8e883d1691f",
      "e3589009-fbcc-43e1-b3ce-c2564c883c6e",
      "5b3d211c-68e4-4198-97d0-2303d5e1a33e"
  ],
  safNumbers: [
      "SAF1479329",
      "SAF1479331",
      "SAF1479333",
      "SAF1479337",
      "SAF1479340",
      "SAF1479342",
      "SAF1479344",
      "SAF1479348",
      "SAF1479378",
      "SAF1479380",
      "SAF1479382",
      "SAF1479385",
      "SAF1479396",
      "SAF1479398",
      "SAF1478805",
      "SAF1478799",
      "SAF1478794",
      "SAF1478744",
      "SAF1478737",
      "SAF1478721",
      "SAF1478714",
      "SAF1479400",
      "SAF1478702",
      "SAF1479402",
      "SAF1479000",
      "SAF1479139",
      "SAF1479175",
      "SAF1479437",
      "SAF1479435"
  ],
  referenceNumbers: [
      "KSAW 013",
      "KSAW 014",
      "KSAW 027",
      "KSAW 097",
      "KSAW 115",
      "KSAW 116",
      "KSAW 118",
      "KSAW 119",
      "KSAW 121",
      "KSAW 122",
      "KSAW 123",
      "KSAW 124",
      "KSAW 520",
      "KSAW 526",
      "KSAW 528",
      "KSAW 529",
      "KSAW 533",
      "KSAW 534",
      "KSAW 536",
      "KSAW 537",
      "KSAW 539",
      "KSAW 548",
      "KSAW 550",
      "KSAW 553",
      "KSAW 110",
      "KSAW 112",
      "KSAW 117",
      "KSAW 120",
      "KSAW 157"
  ],
  aadhaarNumbers: [
      "277382645857",
      "897507682851",
      "682721415239",
      "537643766744",
      "246761488528",
      "427451715270",
      "674885518439",
      "501146925627",
      "505912193644",
      "949319633890",
      "808273041059",
      "562435205616",
      "787726614442",
      "441936290731",
      "911932640071",
      "750034626143",
      "826188395258",
      "702414494395",
      "967643675930",
      "989053003299",
      "741743781737",
      "322329686477",
      "582589635476",
      "377841096938",
      "774754383391",
      "648759874419",
      "451566120146",
      "918762702324",
      "558441584183"
  ]
};

export const BUILTIN_BATCH_10: BatchItem = {
  id: "KSAWU/HSN/CPG/0926-33",
  name: "KSAWU/HSN/CPG/0926-33",
  sheetName: "KSAWU HSN CPG 0926-33",
  totalCount: 10,
  applicantIds: [
      "f12b96a8-fe11-4aaf-b291-70371a485ac3",
      "a1ca6812-abdf-4683-9415-5e867d733b76",
      "cafa0993-6eb8-4ee3-a80f-c852dbb8e420",
      "0ab21609-7572-4f47-bd31-43ad6e1b120c",
      "362321a8-7bcd-4aa1-8828-e5065a03691b",
      "b289d28c-6272-46b6-b40c-dad621ff9e6f",
      "acd6abd5-3cf4-4411-a297-16d9a37caaa0",
      "debae87a-b16d-4a20-b47a-0b70b9ac0e8b",
      "003b9b45-18f0-41fe-8c25-6a4da8686db4",
      "fdf493cd-59f6-4415-bcc4-5ceb4fe6b336"
  ],
  safNumbers: [
      "SAF1479940",
      "SAF1479934",
      "SAF1479928",
      "SAF1479923",
      "SAF1479912",
      "SAF1480010",
      "SAF1480031",
      "SAF1480154",
      "SAF1479439",
      "SAF1478707"
  ],
  referenceNumbers: [
      "KSAW 1453",
      "KSAW 1454",
      "KSAW 1458",
      "KSAW 1459",
      "KSAW 1462",
      "KSAW 523",
      "KSAW 1456",
      "KSAW 1777",
      "KSAW 108",
      "KSAW 542"
  ],
  aadhaarNumbers: [
      "973356794828",
      "613338440603",
      "756626810442",
      "834095876837",
      "369785111000",
      "430694345069",
      "892827358399",
      "564287907719",
      "366438794575",
      "231038346930"
  ]
};

export const BUILTIN_BATCHES: BatchItem[] = [
  BUILTIN_BATCH_1,
  BUILTIN_BATCH_2,
  BUILTIN_BATCH_3,
  BUILTIN_BATCH_4,
  BUILTIN_BATCH_5,
  BUILTIN_BATCH_6,
  BUILTIN_BATCH_7,
  BUILTIN_BATCH_8,
  BUILTIN_BATCH_9,
  BUILTIN_BATCH_10
];

function buildStaticMaps(batches: BatchItem[]) {
  const applicantBatchMap: Record<string, string> = {};
  const safBatchMap: Record<string, string> = {};
  const refBatchMap: Record<string, string> = {};
  const aadhaarBatchMap: Record<string, string> = {};

  for (const b of batches) {
    b.applicantIds.forEach((id) => { applicantBatchMap[id] = b.name; });
    b.safNumbers.forEach((saf) => {
      const clean = saf.trim().toUpperCase();
      safBatchMap[clean] = b.name;
      safBatchMap[clean.replace(/\.+$/, "")] = b.name;
    });
    b.referenceNumbers.forEach((ref) => {
      const clean = ref.trim().toUpperCase();
      refBatchMap[clean] = b.name;
      refBatchMap[clean.replace(/\s+/g, "")] = b.name;
    });
    b.aadhaarNumbers.forEach((aadh) => {
      aadhaarBatchMap[aadh.replace(/\D/g, "")] = b.name;
    });
  }

  return { applicantBatchMap, safBatchMap, refBatchMap, aadhaarBatchMap };
}

const STATIC_MAPS = buildStaticMaps(BUILTIN_BATCHES);

export const DEFAULT_BATCHES: readonly string[] = [
  "KSAWU/HSN/CPG/0926-7",
  "KSAWU/HSN/CPG/0926-8",
  "KSAWU/HSN/CPG/0926-37",
  "KSAWU/HSN/CHN/0926-2",
  "KSAWU/HSN/CHN/0926-3",
  "KSAWU/HSN/CPG/0926-4",
  "KSAWU/HSN/CHN/0926-18",
  "KSAWU/HSN/CHN/0926-22",
  "KSAWU/HSN/CPG/0926-6",
  "KSAWU/HSN/CPG/0926-33"
];

const INITIAL_MANIFEST: BatchesManifest = {
  version: 3,
  lastUpdated: new Date().toISOString(),
  batches: BUILTIN_BATCHES,
  applicantBatchMap: STATIC_MAPS.applicantBatchMap,
  safBatchMap: STATIC_MAPS.safBatchMap,
  refBatchMap: STATIC_MAPS.refBatchMap,
  aadhaarBatchMap: STATIC_MAPS.aadhaarBatchMap,
};

async function fetchBatchesManifest(): Promise<BatchesManifest> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(MANIFEST_FILE_NAME);

    if (error || !data) {
      return INITIAL_MANIFEST;
    }

    const text = await data.text();
    const parsed = JSON.parse(text) as BatchesManifest;
    if (parsed && parsed.batches && parsed.batches.length >= BUILTIN_BATCHES.length && parsed.version >= 3) {
      return parsed;
    }
    return INITIAL_MANIFEST;
  } catch {
    return INITIAL_MANIFEST;
  }
}

export function useBatches() {
  const queryClient = useQueryClient();

  const { data: manifest } = useQuery<BatchesManifest>({
    queryKey: ["ksaw-batches-manifest-v3"],
    queryFn: fetchBatchesManifest,
    staleTime: 1000 * 60 * 10,
    initialData: INITIAL_MANIFEST,
  });

  const activeManifest = manifest || INITIAL_MANIFEST;

  const batchesList = useMemo(() => {
    const set = new Set<string>(DEFAULT_BATCHES);
    if (activeManifest?.batches) {
      activeManifest.batches.forEach((b) => {
        if (b.name) set.add(b.name);
        else if (b.id) set.add(b.id);
      });
    }
    return Array.from(set).sort();
  }, [activeManifest]);

  const getApplicantBatch = useMemo(() => {
    return (applicant: {
      id?: string;
      saf_number?: string | null;
      reference_number?: string | null;
      aadhaar_number?: string | null;
    }): string | null => {
      if (!applicant) return null;

      if (applicant.id && activeManifest.applicantBatchMap?.[applicant.id]) {
        return activeManifest.applicantBatchMap[applicant.id];
      }

      if (applicant.saf_number) {
        const cleanSaf = applicant.saf_number.trim().toUpperCase();
        if (activeManifest.safBatchMap?.[cleanSaf]) {
          return activeManifest.safBatchMap[cleanSaf];
        }
        const noDot = cleanSaf.replace(/\.+$/, "");
        if (activeManifest.safBatchMap?.[noDot]) {
          return activeManifest.safBatchMap[noDot];
        }
      }

      if (applicant.reference_number) {
        const cleanRef = applicant.reference_number.trim().toUpperCase();
        if (activeManifest.refBatchMap?.[cleanRef]) {
          return activeManifest.refBatchMap[cleanRef];
        }
        const noSpace = cleanRef.replace(/\s+/g, "");
        if (activeManifest.refBatchMap?.[noSpace]) {
          return activeManifest.refBatchMap[noSpace];
        }
      }

      if (applicant.aadhaar_number) {
        const cleanAadh = applicant.aadhaar_number.replace(/\D/g, "");
        if (activeManifest.aadhaarBatchMap?.[cleanAadh]) {
          return activeManifest.aadhaarBatchMap[cleanAadh];
        }
      }

      return null;
    };
  }, [activeManifest]);

  const getBatchApplicantIds = useMemo(() => {
    return (batchName: string): string[] => {
      if (!batchName) return [];
      const found = activeManifest.batches?.find(
        (b) => b.name === batchName || b.id === batchName
      );
      return found ? found.applicantIds : [];
    };
  }, [activeManifest]);

  const allBatchApplicantIds = useMemo(() => {
    const set = new Set<string>();
    if (activeManifest?.batches) {
      activeManifest.batches.forEach((b) => {
        b.applicantIds.forEach((id) => set.add(id));
      });
    }
    return Array.from(set);
  }, [activeManifest]);

  return {
    manifest: activeManifest,
    batches: batchesList,
    getApplicantBatch,
    getBatchApplicantIds,
    allBatchApplicantIds,
    refreshBatches: () => queryClient.invalidateQueries({ queryKey: ["ksaw-batches-manifest-v3"] }),
  };
}
