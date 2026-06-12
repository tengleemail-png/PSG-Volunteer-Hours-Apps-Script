# PSG Volunteer Hours

> Automated volunteer hours processing pipeline — Gemini AI parses JPEG/Excel uploads from Google Drive, fuzzy-matches names against a lookup table, and logs records to Google Sheets.

## Features

- **1-Click Processing** — Open the Sheet, select files, run parsing from the custom menu
- **AI-Powered Extraction** — Gemini AI extracts date, event, volunteer name, and hours from images and Excel files (1 API call per file)
- **Fuzzy Name Matching** — Automatically matches extracted names against a lookup table with substring and word-level matching
- **Full-Screen Preview** — Review and edit extracted records before confirming
- **Audit Logging** — All operations are traced to a `_Log` tab with timestamps
- **File Archiving** — Processed files are automatically moved to a `Processed/` subfolder

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Google Apps Script (JavaScript ES5) |
| AI | Google Gemini API (flash/pro models) |
| Storage | Google Sheets, Google Drive API |
| CLI | @google/clasp (deployment) |

## How It Works

1. EXCO members drop JPEG screenshots or Excel files into a shared Drive folder
2. Open the Google Sheet -> **PSG Hours** -> **Process Uploads**
3. Select files and click **Parse with Gemini**
4. Review extracted records in a dialog — edit cells, pick names from dropdowns
5. Click **Confirm & Save** — records are written to `Records` tab, logged to `_Log` tab
6. Processed files are moved to `Processed/` subfolder automatically

## Project Structure

```
psg-volunteers-appscript/
|-- .clasp.json              clasp config (script ID)
|-- .gitignore
|-- appsscript.json          OAuth scopes, advanced services
|-- README.md
+-- src/
    |-- Config.gs            Script Properties accessors
    |-- Main.gs              Menu, orchestrator, setupOnce()
    |-- Drive.gs             List files, read blobs, move to Processed
    |-- Sheet.gs             Read _Lookup, write Records + _Log
    |-- Gemini.gs            Gemini API (1 call/file, model fallback)
    |-- NameMatch.gs         Substring + word-level name matching
    |-- Trace.gs             Structured audit logging
    |-- PreviewUI.html       Full-screen preview/confirm dialog
    +-- appsscript.json      Apps Script manifest
```

## Setup

### Prerequisites

- Node.js
- Google account
- Gemini API key ([get one free](https://aistudio.google.com/apikey))

### One-time deployment

```bash
# Install clasp
npm install -g @google/clasp

# Login to Google
clasp login

# Clone and deploy
git clone <your-repo-url>
cd psg-volunteers-appscript

# Create Apps Script project linked to your Sheet
clasp create --title "PSG Volunteer Hours" \
  --type sheets \
  --parentId "1qlnnOa_Spw8mGoLCJeN9VtXz61_3vlWldKD1F7MMosc"

# Push code to Google
clasp push
```

### In-Sheet setup

1. Open **Extensions -> Apps Script**
2. **Resources -> Advanced Google Services**
   - Turn **Drive API v3** -> **On**
3. **Project Settings -> Script Properties**
   - Add key `GEMINI_API_KEY` with your Gemini API key
   - Add key `DRIVE_FOLDER_ID` with value `1Ha8_10y0Xy-hVTeKzKEIYZhHbokwcRRZ`
   - Add key `SHEET_ID` with value `1qlnnOa_Spw8mGoLCJeN9VtXz61_3vlWldKD1F7MMosc`
4. Run the function `setupOnce` in the Apps Script editor
5. Authorize the script when prompted
6. Refresh the Sheet — you'll see a **PSG Hours** menu

### Day-to-day usage

1. EXCO members drop JPEG or Excel files into the Drive folder
2. Open the Sheet -> **PSG Hours** -> **Process Uploads**
3. Select files and click **Parse with Gemini**
4. Review the extracted records, make edits, pick names from dropdowns
5. Click **Confirm & Save**
6. Processed files move to `Processed/` subfolder

## API Usage

| File type | Calls per file | Method |
|-----------|---------------|--------|
| JPEG / PNG | 1 | inline_data (base64) |
| Excel (.xlsx/.xls/.csv) | 1 | Convert to PDF inline |

~4 API calls per month (2 JPEG + 2 Excel) — well within Gemini free tier.

## Maintenance

| Task | How |
|------|-----|
| Add a volunteer | Add a row to the `_Lookup` tab (no code changes) |
| Change Gemini model | Edit `GEMINI_MODEL` in `src/Config.gs` |
| Update code | `git pull && clasp push` |
| Move to new Sheet | Update `SHEET_ID` in Script Properties |

## Why This Project

This capstone demonstrates integrating large language models with Google Workspace to solve a real organizational workflow. EXCO members previously transcribed volunteer hours by hand from group chat screenshots — a tedious, error-prone process. This system cuts that to a few clicks, using Gemini AI to extract structured data from unstructured uploads, with fuzzy name matching to ensure accuracy and a full-screen review step to maintain human oversight.

## License

MIT
