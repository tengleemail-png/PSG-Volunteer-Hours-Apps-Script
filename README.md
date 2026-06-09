# PSG Volunteer Hours

Google Apps Script that processes volunteer hours records from JPEG/Excel files uploaded to a shared Google Drive folder. Uses Gemini AI to parse the files and matches names against a lookup table.

## How It Works

1. EXCO members drop JPEG screenshots or Excel files into a shared Drive folder
2. Open the Google Sheet \u2192 **PSG Hours** \u2192 **Process Uploads**
3. Select files and click **Parse with Gemini** (1 API call per file)
4. Review extracted records in a full-screen dialog \u2014 edit cells, pick names from dropdowns
5. Click **Confirm & Save** \u2014 records written to `Records` tab, log to `_Log` tab
6. Processed files moved to `Processed/` subfolder automatically

## Setup

### Prerequisites

- Node.js
- Google account with access to the PSG Volunteers Hours Sheet
- Gemini API key ([get one free](https://aistudio.google.com/apikey))

### One-time deployment

```bash
# Install clasp (Google Apps Script CLI)
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

### In-Sheet setup (one-time)

1. Open **Extensions \u2192 Apps Script**
2. **Resources \u2192 Advanced Google Services**
   - Turn **Drive API v3** \u2192 **On**
3. **Project Settings \u2192 Script Properties**
   - Add key `GEMINI_API_KEY` with your Gemini API key
   - Add key `DRIVE_FOLDER_ID` with value `1Ha8_10y0Xy-hVTeKzKEIYZhHbokwcRRZ`
   - Add key `SHEET_ID` with value `1qlnnOa_Spw8mGoLCJeN9VtXz61_3vlWldKD1F7MMosc`
4. In the Apps Script editor, run the function `setupOnce`
5. Authorize the script when prompted
6. Refresh the Sheet \u2014 you'll see a **PSG Hours** menu

### Day-to-day usage

1. EXCO members drop JPEG or Excel files into the Drive folder
2. Open the Sheet \u2192 **PSG Hours** \u2192 **Process Uploads**
3. Select files and click **Parse with Gemini**
4. Review the extracted records, make edits, pick names from dropdowns
5. Click **Confirm & Save**
6. Processed files move to `Processed/` subfolder

## File Structure

```
psg-volunteers-appscript/
\u251c\u2500\u2500 .clasp.json              # clasp config (script ID)
\u251c\u2500\u2500 .gitignore
\u251c\u2500\u2500 appsscript.json          # OAuth scopes, advanced services
\u251c\u2500\u2500 README.md
\u2514\u2500\u2500 src/
    \u251c\u2500\u2500 Config.gs            # Script Properties accessors
    \u251c\u2500\u2500 Main.gs              # Menu, orchestrator, setupOnce()
    \u251c\u2500\u2500 Drive.gs             # List files, read blobs, move to Processed
    \u251c\u2500\u2500 Sheet.gs             # Read _Lookup, write Records + _Log
    \u251c\u2500\u2500 Gemini.gs            # Gemini API (1 call/file, model fallback)
    \u251c\u2500\u2500 NameMatch.gs         # Substring + word-level name matching
    \u2514\u2500\u2500 PreviewUI.html       # Full-screen preview/confirm dialog
```

## API Calls

| File type | Calls per file | Method |
|---|---|---|
| JPEG / PNG | 1 | inline_data (base64) |
| Excel (.xlsx/.xls/.csv) | 1 | Convert to PDF inline |

~4 API calls per month (2 JPEG + 2 Excel) \u2014 well within Gemini free tier.

## Maintenance

| Task | How |
|---|---|
| Add a volunteer | Add a row to the `_Lookup` tab (no code changes) |
| Change Gemini model | Edit `GEMINI_MODEL` in `src/Config.gs` |
| Update code | `git pull && clasp push` |
| Move to new Sheet | Update `SHEET_ID` in Script Properties |

## License

MIT
