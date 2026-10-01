import { z } from "zod";
import { DocumentType } from "@/types";

export const FIRSchema = z.object({
  firNumber: z.string().optional(),
  policeStation: z.string().optional(),
  dateOfIncident: z.string().optional(),
  complainant: z.string().optional(),
  accusedPersons: z.array(
    z.object({
      name: z.string(),
      alias: z.string().optional(),
      role: z.string().optional(), // "Accused", "Suspect", "Accomplice"
      phone: z.string().optional(),
      address: z.string().optional(),
    })
  ).default([]),
  vehicles: z.array(
    z.object({
      registrationNumber: z.string(),
      model: z.string().optional(),
      owner: z.string().optional(),
    })
  ).default([]),
  locations: z.array(z.string()).default([]),
  incidentSummary: z.string().optional(),
  ipcSections: z.array(z.string()).default([]),
});

export type FIRData = z.infer<typeof FIRSchema>;

export const firDocumentConfig = {
  type: "FIR" as DocumentType,
  name: "First Information Report (FIR)",
  description: "Police registered FIR document detailing criminal offenses, accused persons, seized assets, and crime scene locations.",
  promptInstructions: `
Extract the following for FIR documents:
1. Accused, Complainant, and Suspects as PERSON entities.
2. Any mentioned mobile numbers as PHONE entities (link PERSON -USES-> PHONE).
3. Any vehicles involved as VEHICLE entities (link PERSON -OWNS-> VEHICLE or VEHICLE -LOCATED_AT-> LOCATION).
4. Crime scenes or addresses as LOCATION entities.
5. Crime events (e.g., Robbery, Extortion, Assault) as EVENT entities.
6. Connect accused persons to the event, locations, and other accomplices with ASSOCIATED_WITH.
`,
};
