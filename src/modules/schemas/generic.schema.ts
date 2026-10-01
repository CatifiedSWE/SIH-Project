import { z } from "zod";
import { DocumentType } from "@/types";

export const GenericIntelligenceSchema = z.object({
  title: z.string().optional(),
  date: z.string().optional(),
  sourceAgency: z.string().optional(),
  classification: z.string().optional(),
  keyFindings: z.array(z.string()).default([]),
  suspects: z.array(z.string()).default([]),
  organizations: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  summary: z.string().optional(),
});

export type GenericIntelligenceData = z.infer<typeof GenericIntelligenceSchema>;

export const genericDocumentConfig = {
  type: "POLICE_REPORT" as DocumentType,
  name: "Police / Intelligence Report",
  description: "Investigative dossier, field surveillance log, intelligence memo, or general case document.",
  promptInstructions: `
Extract the following for Intelligence & Police Reports:
1. All individuals mentioned as PERSON entities.
2. Gangs, front businesses, shell corporations as ORGANIZATION entities.
3. Safe houses, hideouts, drop points as LOCATION entities.
4. Surveillance events, raids, meetings as EVENT entities.
5. All interpersonal, command-hierarchy, or operational linkages as ASSOCIATED_WITH, USES, OWNS, or LOCATED_AT relationships.
`,
};
