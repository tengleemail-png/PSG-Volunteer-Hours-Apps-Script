function normalize(text) {
  return text.toString().toLowerCase().trim().replace(/\s+/g, ' ');
}

function entryFieldText(entry) {
  var parts = [
    entry.preferred_name || '',
    entry.combined_name || '',
    entry.given_name || '',
    entry.surname || '',
  ];
  return normalize(parts.join(' '));
}

function matchName(name, entries) {
  name = name.toString().trim();
  if (!name || !entries || !entries.length) {
    return { matchedName: name, confidence: 0, status: 'not_found', candidates: [] };
  }

  var norm = normalize(name);
  var words = norm.split(/\s+/).filter(function (w) { return w.length > 0; });
  if (!words.length) {
    return { matchedName: name, confidence: 0, status: 'not_found', candidates: [] };
  }

  var candidates = [];

  for (var i = 0; i < entries.length; i++) {
    var combined = normalize(entries[i].combined_name);
    if (combined.indexOf(norm) !== -1) {
      candidates.push(entries[i]);
    }
  }

  if (candidates.length === 0) {
    for (var j = 0; j < entries.length; j++) {
      var text = entryFieldText(entries[j]);
      var allFound = true;
      for (var k = 0; k < words.length; k++) {
        if (text.indexOf(words[k]) === -1) {
          allFound = false;
          break;
        }
      }
      if (allFound) {
        candidates.push(entries[j]);
      }
    }
  }

  if (candidates.length === 0) {
    return { matchedName: name, confidence: 0, status: 'not_found', candidates: [] };
  }

  var seen = {};
  var unique = [];
  for (var m = 0; m < candidates.length; m++) {
    if (!seen[candidates[m].combined_name]) {
      seen[candidates[m].combined_name] = true;
      unique.push(candidates[m]);
    }
  }
  candidates = unique;

  if (candidates.length === 1) {
    return {
      matchedName: candidates[0].combined_name,
      confidence: 100,
      status: 'auto',
      candidates: [candidates[0].combined_name],
    };
  }

  return {
    matchedName: name,
    confidence: 50,
    status: 'review',
    candidates: candidates.map(function (e) { return e.combined_name; }),
  };
}
