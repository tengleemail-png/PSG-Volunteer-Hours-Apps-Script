var PROPERTIES = PropertiesService.getScriptProperties();

function getGeminiApiKey() {
  return PROPERTIES.getProperty('GEMINI_API_KEY');
}

function getDriveFolderId() {
  return PROPERTIES.getProperty('DRIVE_FOLDER_ID');
}

function getSheetId() {
  return PROPERTIES.getProperty('SHEET_ID');
}

var GEMINI_MODEL = 'gemini-2.5-flash';
var GEMINI_MODEL_FALLBACK = 'gemini-2.0-flash';
var RECORDS_TAB = 'Records';
var LOOKUP_TAB = '_Lookup';
var LOG_TAB = '_Log';
var PROCESSED_FOLDER_NAME = 'Processed';
