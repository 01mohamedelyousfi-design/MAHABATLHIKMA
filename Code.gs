/**
 * محبة الحكمة — Community Feedback receiver
 *
 * SETUP:
 * 1. Open the Google Sheet:
 *    https://docs.google.com/spreadsheets/d/1Q-s9sixnH7j5G9bcakCBohEenE7li_bJwpWO73Ffwa0/edit
 * 2. Menu: Extensions → Apps Script
 * 3. Delete any placeholder code in Code.gs and paste this entire file instead.
 * 4. Save (Ctrl+S / Cmd+S). Name the project anything, e.g. "Feedback Receiver".
 * 5. Click "Deploy" (top right) → "New deployment".
 *    - Click the gear icon next to "Select type" → choose "Web app".
 *    - Description: anything, e.g. "feedback v1".
 *    - Execute as: Me (your account).
 *    - Who has access: Anyone.
 *    - Click "Deploy".
 * 6. The first time, Google will ask you to authorize the script — click
 *    "Authorize access", choose your account, click "Advanced" → "Go to
 *    (project name) (unsafe)" → "Allow". This warning is normal for your
 *    own scripts that haven't been reviewed by Google; it's safe here
 *    because you wrote/control the code yourself.
 * 7. Copy the "Web app URL" shown after deployment (it ends in /exec).
 * 8. Paste that URL into `FEEDBACK_ENDPOINT` at the top of the <script>
 *    section in feedback.html, AND into `NEWSLETTER_ENDPOINT` at the top
 *    of the <script> section in index.html — both use this same script.
 *
 * If you ever edit this script again, you must create a NEW deployment
 * (or "Manage deployments" → edit → New version) for changes to go live —
 * saving alone does not update the already-deployed /exec URL.
 */

const SHEET_NAME = 'Feedback'; // change this if your tab is named differently
const NEWSLETTER_SHEET_NAME = 'Newsletter';

function doPost(e) {
  try {
    const p = e.parameter;

    if (p.form_type === 'newsletter') {
      return handleNewsletter(p);
    }
    return handleFeedback(p);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleFeedback(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  // If the "Feedback" tab doesn't exist yet, create it with headers.
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['التاريخ', 'القسم', 'النوع', 'التقييم', 'الملاحظة', 'الاسم', 'البريد الإلكتروني', 'صفحة المصدر']);
  }

  sheet.appendRow([
    new Date(),
    p.page || '',
    p.type || '',
    p.rating || '',
    p.message || '',
    p.name || '',
    p.email || '',
    p.source_page || '',
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleNewsletter(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(NEWSLETTER_SHEET_NAME);

  // If the "Newsletter" tab doesn't exist yet, create it with headers.
  if (!sheet) {
    sheet = ss.insertSheet(NEWSLETTER_SHEET_NAME);
    sheet.appendRow(['التاريخ', 'البريد الإلكتروني']);
  }

  sheet.appendRow([new Date(), p.email || '']);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Optional: lets you sanity-check the deployment by opening the /exec URL
// directly in a browser — should show a small JSON message, not an error page.
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Feedback endpoint is live.' }))
    .setMimeType(ContentService.MimeType.JSON);
}
