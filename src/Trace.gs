function trace(filename, step, status, message, details) {
  ensureLogTab();
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(LOG_TAB);
  var now = Utilities.formatDate(new Date(), 'Asia/Singapore', 'yyyy-MM-dd HH:mm:ss');
  sheet.appendRow([
    now,
    filename || '',
    step || '',
    status || '',
    message || '',
    details ? JSON.stringify(details) : ''
  ]);
}
