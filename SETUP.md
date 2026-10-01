# Setup & Developer Guide — Cinder Bound

## Prerequisites

- **Node.js**: version `18.17.0` or higher (tested on Node v20 & v24)
- **npm**: version `9.0.0` or higher
- Modern web browser (Chrome, Edge, Firefox, Brave)

---

## Installation & Running

### Step 1: Clone and Navigate
```bash
cd d:\SIH-Project
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Run the Development Server
```bash
npm run dev
```

### Step 4: Open the Application
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## Configuration (Optional)

### Live Gemma / Gemini AI Key
By default, Cinder Bound includes a high-accuracy built-in heuristic extraction engine that extracts suspects, phones, bank accounts, and vehicles with exact provenance without needing any API keys.

To use live Google cloud models (Gemini 1.5 Flash / Gemma 2):
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2. You can either:
   - Click the **Settings** icon (gear) in the top-right of the Workspace UI and paste your key. It is saved securely in your browser's local storage and never sent to any third-party server.
   - OR create a `.env.local` file in the project root:
     ```env
     NEXT_PUBLIC_GEMINI_API_KEY=your_google_ai_studio_key_here
     ```

---

## Verifying the Vertical Slice

1. Go to `http://localhost:3000/workspace`.
2. Notice the demonstration documents automatically load:
   - `FIR_001_Noida_Sec18_Robbery.pdf`
   - `CDR_Dump_Target_9876543210.csv`
   - `Bank_Statement_Axis_Hawala.csv`
   - `Police_Special_Cell_Dossier.txt`
3. The graph canvas renders connected nodes:
   - **Ravi Kumar** connected to Phone `+91 9876543210`, Car `UP 16 AB 9081`, and Axis Bank `A/C 918020019283741`.
   - **Amit Sharma** connected to Phone `+91 9955881122`, Bank `A/C 30948291039`, and Organization `Apex Logistics`.
   - Financial transfer edge: ₹5,00,000 from Ravi's account to Amit's account.
   - Multiple phone calls with durations between Ravi, Vikram, and Amit.
4. **Test Provenance**:
   - Click on node **`Ravi Kumar`**. The side panel reveals his role, attributes, and exact source text.
   - Click **"Inspect in Original Evidence"**. The document drawer opens, jumping to `FIR_001` with the exact sentence highlighted in amber!
5. **Test Custom Evidence**:
   - Drag and drop your own PDF, CSV, or TXT file into the upload zone on the sidebar.
   - Watch the AI status change to **"AI Extracting..."**, parse the contents, and link newly discovered entities to the graph in real time!
