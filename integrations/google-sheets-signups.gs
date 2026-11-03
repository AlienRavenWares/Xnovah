/**
 * Xnovah email signup collector for Google Sheets.
 * Paste into Extensions > Apps Script in the spreadsheet you own.
 * Set Script Properties: XNOVAH_SIGNUP_SECRET = a long random secret.
 * Deploy as Web app: Execute as Me; Who has access: Anyone.
 * The public web app accepts writes only with the matching secret.
 */
function doPost(e) {
  const reply = function (value) {
    return ContentService.createTextOutput(JSON.stringify(value))
      .setMimeType(ContentService.MimeType.JSON);
  };
  try {
    const expected = PropertiesService.getScriptProperties().getProperty('XNOVAH_SIGNUP_SECRET');
    if (!expected || expected.length < 24) return reply({success:false,error:'not_configured'});
    const raw = (e && e.postData && e.postData.contents) || '';
    if (raw.length > 4096) return reply({success:false,error:'too_large'});
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || data.secret !== expected) return reply({success:false,error:'unauthorized'});
    const email = String(data.email || '').trim().toLowerCase();
    if (email.length > 254 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return reply({success:false,error:'invalid_email'});
    const source = data.source === 'Newsletter' ? 'Newsletter' : 'Early-access waitlist';
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return reply({success:false,error:'busy'});
    try {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (!spreadsheet) return reply({success:false,error:'spreadsheet_not_found'});
      let sheet = spreadsheet.getSheetByName('Subscribers');
      if (!sheet) sheet = spreadsheet.insertSheet('Subscribers');
      if (sheet.getLastRow() === 0) sheet.appendRow(['Email', 'Source', 'Signed up at (UTC)']);
      const last = sheet.getLastRow();
      if (last > 1) {
        const emails = sheet.getRange(2, 1, last - 1, 1).getValues();
        if (emails.some(function (row) { return String(row[0]).trim().toLowerCase() === email; })) {
          return reply({success:true,alreadySubscribed:true});
        }
      }
      // Email addresses are validated and prefixed to avoid spreadsheet formula injection.
      sheet.appendRow([email,source,new Date().toISOString()]);
      return reply({success:true});
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    console.error(err);
    return reply({success:false,error:'storage_error'});
  }
}
