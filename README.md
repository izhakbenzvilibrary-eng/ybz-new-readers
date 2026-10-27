# New Readers from Google Sheets – Alma Cloud App

Creates Alma patrons from the Yad Ben-Zvi Library's Google Form registration sheet.

## What it does
1. Reads readers that are waiting to be loaded from a Google Apps Script web app (the library's registration sheet, tab `ALMA_EXPORT`).
2. For each reader, checks Alma for an existing user with the same identifier and skips existing users.
3. Creates the missing users in Alma as the logged-in staff member.
4. Reports the results back to the sheet (an `ALMA_LOG` tab) so readers are not loaded twice.
5. Optionally moves sheet rows of readers who already exist in Alma to an `ARCHIVE` tab.

## Configuration (administrators)
Open the app menu → **Configuration** and enter:
- **Web app URL** – the deployed Google Apps Script URL (`https://script.google.com/macros/s/…/exec`)
- **Secret** – the shared key defined in the script

Nothing secret is stored in this repository.

## Required Alma roles
The staff user must be allowed to view and create users (for example **User Manager**). *Unverified – confirm in your institution.*

## Alma API operations
| Method | Path | Purpose | Data impact |
|---|---|---|---|
| GET | `/almaws/v1/users/{user_id}?user_id_type=all_unique&view=brief` | Check whether the reader already exists | Read |
| POST | `/almaws/v1/users` | Create the reader (internal account, active, group/language/email/phone from the sheet) | Create |

## Availability
Limited to institution `972ICC_YBZ` (`relevantForInst`).

## External connections
`https://script.google.com`, `https://script.googleusercontent.com` (Google Apps Script web app).

## Development
```
npm install -g @exlibris/exl-cloudapp-cli
npm install
eca start
```
Set your Alma URL in `config.json` (`env`) first.
