import { z } from "zod";
import { DocumentType } from "@/types";

export const CDRRecordSchema = z.object({
  callDate: z.string().optional(),
  callTime: z.string().optional(),
  callerNumber: z.string(),
  receiverNumber: z.string(),
  callType: z.string().optional(), // Inbound, Outbound, SMS
  durationSeconds: z.number().optional(),
  firstCellId: z.string().optional(),
  cellLocation: z.string().optional(),
  callerImei: z.string().optional(),
});

export const CDRSchema = z.object({
  targetNumber: z.string().optional(),
  subscriberName: z.string().optional(),
  records: z.array(CDRRecordSchema).default([]),
});

export type CDRData = z.infer<typeof CDRSchema>;

export const cdrDocumentConfig = {
  type: "CDR" as DocumentType,
  name: "Call Detail Record (CDR)",
  description: "Telecommunication operator CDR dump containing call logs, IMEI identifiers, durations, and cell tower coordinates.",
  promptInstructions: `
Extract the following for Call Detail Record (CDR) documents:
1. Every unique phone number as a PHONE entity.
2. If subscriber identity/owner is known, extract as PERSON and link PERSON -USES-> PHONE.
3. Every high-frequency or significant call connection as a CALLED relationship between caller PHONE and receiver PHONE.
4. Cell tower locations as LOCATION entities (link PHONE -LOCATED_AT-> LOCATION during call timestamp).
5. Add call frequency and duration summary to relationship properties.
`,
};
