import { z } from "zod";
import { DocumentType } from "@/types";

export const BankTransactionSchema = z.object({
  date: z.string().optional(),
  description: z.string(),
  referenceNumber: z.string().optional(),
  type: z.enum(["DEBIT", "CREDIT"]),
  amount: z.number(),
  sourceAccount: z.string().optional(),
  targetAccount: z.string().optional(),
  targetEntityName: z.string().optional(),
});

export const BankStatementSchema = z.object({
  bankName: z.string().optional(),
  accountHolder: z.string().optional(),
  accountNumber: z.string(),
  ifscCode: z.string().optional(),
  transactions: z.array(BankTransactionSchema).default([]),
});

export type BankStatementData = z.infer<typeof BankStatementSchema>;

export const bankDocumentConfig = {
  type: "BANK_STATEMENT" as DocumentType,
  name: "Bank Account Statement",
  description: "Financial institution account statement showing account ownership, fund inflows, outflows, and counterparty entities.",
  promptInstructions: `
Extract the following for Bank Statement documents:
1. Account holder as PERSON or ORGANIZATION.
2. Account numbers as BANK_ACCOUNT entities (link PERSON/ORG -OWNS-> BANK_ACCOUNT).
3. Beneficiary/counterparty accounts as BANK_ACCOUNT entities.
4. Financial transfers as TRANSFERRED_TO relationships between BANK_ACCOUNT entities, with amount, date, and reference.
5. High-value or suspicious transactions as TRANSACTION or EVENT entities.
`,
};
