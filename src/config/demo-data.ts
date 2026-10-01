import { EvidenceDocument } from "@/types";

export const DEMO_EVIDENCE_DOCUMENTS: Omit<EvidenceDocument, "status">[] = [
  {
    id: "doc_fir_001",
    name: "FIR_001_Noida_Sec18_Robbery.pdf",
    type: "FIR",
    fileFormat: "pdf",
    fileSize: 42300,
    pageCount: 2,
    uploadedAt: new Date(Date.now() - 3600000).toISOString(),
    rawContent: `FIRST INFORMATION REPORT (Under Section 154 Cr.P.C.)
POLICE STATION: Sector 20, Noida, District Gautam Buddha Nagar
FIR No: 0042/2024 | Date of Incident: 14-03-2024 14:15 hrs
IPC Sections: 392 (Robbery), 397 (Robbery with attempt to cause death), 120-B (Criminal Conspiracy)

COMPLAINANT:
Shri Suresh Verma, Proprietor of Verma Jewellers, Sector 18 Market, Noida.

ACCUSED PERSONS NAMED:
1. Ravi Kumar @ Ravi Shooter, s/o Ramesh Chand, r/o Village Chhajarsi, Sector 63 Noida.
   Mobile: +91 9876543210 (Identified via CCTV recovery and confession).
2. Vikram Singh @ Vicky Pehalwan, s/o Mahipal Singh, r/o Greater Noida West.
   Mobile: +91 9811223344.

DETAILS OF INCIDENT:
On 14-03-2024 at approximately 14:15 hrs, two armed assailants entered Verma Jewellers in Sector 18 Noida.
Accused Ravi Kumar brandished an illegal countrymade firearm and coerced the staff. Accused Vikram Singh looted gold ornaments valued at ₹42,00,000 and ₹5,00,000 liquid cash.
The assailants fled the crime scene in a white Hyundai Creta bearing registration number UP 16 AB 9081 registered to suspect Vikram Singh.

SEIZURE / RECOVERY:
Airtel SIM card and mobile handset recovered from possession of accused Ravi Kumar bearing MSISDN 9876543210.
Vehicle UP 16 AB 9081 seized near Hindon river bank hideout.`,
  },
  {
    id: "doc_cdr_002",
    name: "CDR_Dump_Target_9876543210.csv",
    type: "CDR",
    fileFormat: "csv",
    fileSize: 18400,
    pageCount: 1,
    uploadedAt: new Date(Date.now() - 3000000).toISOString(),
    rawContent: `Date,Time,Caller_MSISDN,Receiver_MSISDN,Call_Type,Duration_Sec,First_Cell_ID,BTS_Location
2024-03-14,13:42:10,9876543210,9811223344,OUTGOING,184,NOIDA-SEC18-BTS-01,Sector 18 Noida Market
2024-03-14,14:28:45,9876543210,9811223344,OUTGOING,95,NOIDA-SEC62-BTS-04,Sector 62 Noida
2024-03-14,15:10:02,9876543210,9955881122,OUTGOING,340,OKHLA-PH3-BTS-09,Okhla Phase 3 Delhi
2024-03-14,15:45:18,9955881122,9876543210,INCOMING,210,CONN-CIR-BTS-02,Connaught Circle New Delhi
2024-03-14,16:30:00,9876543210,9811223344,OUTGOING,45,LAJPAT-METRO-03,Lajpat Nagar Safehouse`,
  },
  {
    id: "doc_bank_003",
    name: "Bank_Statement_Axis_Hawala.csv",
    type: "BANK_STATEMENT",
    fileFormat: "csv",
    fileSize: 24500,
    pageCount: 1,
    uploadedAt: new Date(Date.now() - 2000000).toISOString(),
    rawContent: `Txn_Date,Account_Number,Account_Holder,Transaction_Type,Amount_INR,Beneficiary_Account,Beneficiary_Name,Narration
2024-03-15,918020019283741,Ravi Kumar,DEBIT,500000,30948291039,Amit Sharma,IMPS Hawala settlement tranche 1
2024-03-15,30948291039,Amit Sharma,CREDIT,500000,918020019283741,Ravi Kumar,Received from Sector 18 proceeds
2024-03-16,30948291039,Amit Sharma,DEBIT,450000,883920194857201,Apex Logistics,Transfer to shell logistics entity`,
  },
  {
    id: "doc_intel_004",
    name: "Police_Special_Cell_Dossier.txt",
    type: "POLICE_REPORT",
    fileFormat: "txt",
    fileSize: 15200,
    pageCount: 1,
    uploadedAt: new Date(Date.now() - 1000000).toISOString(),
    rawContent: `CONFIDENTIAL INTELLIGENCE DOSSIER
ISSUING AGENCY: Special Cell, Crime Branch
OPERATION CODE: CINDER STRIKE
SUBJECT: Syndicate Operations of Ravi Kumar & Hawala Fronts

KEY FINDINGS:
1. Accused Ravi Kumar is operating in tandem with financial conduit Amit Sharma @ Amit Hawala.
2. Amit Sharma runs front company "Apex Logistics" registered in Lajpat Nagar to launder robbery proceeds into legitimate transport operations.
3. Surveillance confirms Vikram Singh serves as muscle and logistics coordinator, using vehicle UP 16 AB 9081 to transport cash to safehouse at Lajpat Nagar.
4. Target MSISDN 9955881122 is registered under a fictitious identity and maintained by Amit Sharma for coordinating hawala dispatches.`,
  },
];
