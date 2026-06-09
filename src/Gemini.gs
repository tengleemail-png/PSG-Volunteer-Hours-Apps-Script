var SYSTEM_PROMPT = [
  'You are a data extraction assistant for PSG volunteer hours records.',
  '',
  'Extract only VOLUNTEER names \u2014 IGNORE any of the following:',
  '- Child name / student name / pupil name columns',
  '- Class / grade / form columns',
  '- Teacher or staff names',
  '- Parent contact information',
  '',
  'Extract these fields for each volunteer entry:',
  '',
  '- date: The date of the volunteering event (output as YYYY-MM-DD)',
  '- event_name: The name of the event',
  '- volunteer_name: The volunteer\'s name exactly as written (NOT child/student name)',
  '- hours: The volunteering duration in decimal hours (e.g., 09:00-11:30 \u2192 2.5, 2h \u2192 2.0, 7.30am-12pm \u2192 4.5)',
  '',
  'The file may be an Excel spreadsheet or an image (JPEG screenshot).',
  'Excel formats vary \u2014 columns may be in different orders or have different headers.',
  'Images may be screenshots of Excel sheets.',
  '',
  'Output ONLY a JSON array of objects with keys: date, event_name, volunteer_name, hours',
  'If no records are found, output an empty array [].',
  '',
  'Always include ALL volunteer entries found in the file.',
  'Do not skip any rows. Do not make up data \u2014 only extract what is present.',
].join('\n');

var MAX_RETRIES = 3;
var RETRY_DELAY_MS = 5000;

function parseFile(fileId, fileName) {
  var apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in Script Properties');

  var parts;

  if (isImageFile(fileName)) {
    var blob = getFileBlob(fileId);
    var base64 = Utilities.base64Encode(blob.getBytes());
    var mime = blob.getContentType();
    parts = [
      { inline_data: { mime_type: mime, data: base64 } },
      { text: 'Extract all volunteer records from this file as a JSON array.' },
    ];
  } else {
    var pdfBlob = convertExcelToPdfBlob(fileId);
    var base64 = Utilities.base64Encode(pdfBlob.getBytes());
    parts = [
      { inline_data: { mime_type: 'application/pdf', data: base64 } },
      { text: 'Extract all volunteer records from this file as a JSON array.' },
    ];
  }

  var body = {
    contents: [{ parts: parts }],
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
  };

  var model = GEMINI_MODEL;
  var lastError;

  for (var attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      var url = 'https://generativelanguage.googleapis.com/v1beta/models/'
        + model + ':generateContent?key=' + encodeURIComponent(apiKey);

      var options = {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify(body),
        muteHttpExceptions: true,
        timeout: 120000,
      };

      var response = UrlFetchApp.fetch(url, options);
      var code = response.getResponseCode();

      if (code === 200) {
        return parseGeminiResponse(response.getContentText());
      }

      if (code === 429 || code === 503) {
        lastError = 'HTTP ' + code;
        if (attempt < MAX_RETRIES) {
          Utilities.sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
      }

      if (code === 404 && model !== GEMINI_MODEL_FALLBACK) {
        model = GEMINI_MODEL_FALLBACK;
        attempt--;
        continue;
      }

      var bodyText = response.getContentText();
      throw new Error('Gemini API error (HTTP ' + code + '): ' + bodyText.slice(0, 500));
    } catch (e) {
      if (e.toString().indexOf('Timeout') !== -1 && attempt < MAX_RETRIES) {
        lastError = 'timeout';
        Utilities.sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw e;
    }
  }

  throw new Error('Gemini API failed after ' + MAX_RETRIES + ' attempts: ' + lastError);
}

function parseGeminiResponse(responseText) {
  var data = JSON.parse(responseText);
  var text;

  try {
    text = data.candidates[0].content.parts[0].text;
  } catch (e) {
    throw new Error('Unexpected Gemini response structure: ' + JSON.stringify(data).slice(0, 500));
  }

  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  var items = JSON.parse(text);
  if (!Array.isArray(items)) {
    throw new Error('Gemini did not return an array: ' + text.slice(0, 200));
  }

  var records = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var dt = item.date || '';
    if (typeof dt !== 'string') continue;

    var parsed = new Date(dt);
    if (isNaN(parsed.getTime())) continue;

    records.push({
      date: Utilities.formatDate(parsed, 'Asia/Singapore', 'yyyy-MM-dd'),
      event_name: (item.event_name || '').toString(),
      volunteer_name: (item.volunteer_name || '').toString(),
      hours: parseFloat(item.hours) || 0,
    });
  }

  return records;
}
