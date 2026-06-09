function listUnprocessedFiles() {
  var folderId = getDriveFolderId();
  var folder = DriveApp.getFolderById(folderId);
  var files = [];
  var iter = folder.getFiles();

  while (iter.hasNext()) {
    var file = iter.next();
    var name = file.getName().toLowerCase();
    if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') ||
        name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
      files.push({ id: file.getId(), name: file.getName(), size: file.getSize() });
    }
  }

  var processedIter = folder.getFoldersByName(PROCESSED_FOLDER_NAME);
  if (processedIter.hasNext()) {
    var processedFolder = processedIter.next();
    var processedIds = {};
    var pfIter = processedFolder.getFiles();
    while (pfIter.hasNext()) {
      processedIds[pfIter.next().getName()] = true;
    }
    files = files.filter(function (f) { return !processedIds[f.name]; });
  }

  files.sort(function (a, b) { return a.name.localeCompare(b.name); });
  return files;
}

function getFileBlob(fileId) {
  return DriveApp.getFileById(fileId).getBlob();
}

function convertExcelToPdfBlob(fileId) {
  var file = DriveApp.getFileById(fileId);
  return file.getAs('application/pdf');
}

function moveToProcessed(fileId) {
  var file = DriveApp.getFileById(fileId);
  var folderId = getDriveFolderId();
  var parent = DriveApp.getFolderById(folderId);
  var processedFolders = parent.getFoldersByName(PROCESSED_FOLDER_NAME);
  var processedFolder;
  if (processedFolders.hasNext()) {
    processedFolder = processedFolders.next();
  } else {
    processedFolder = parent.createFolder(PROCESSED_FOLDER_NAME);
  }
  file.moveTo(processedFolder);
}

function isImageFile(fileName) {
  var n = fileName.toLowerCase();
  return n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.png');
}

function isExcelFile(fileName) {
  var n = fileName.toLowerCase();
  return n.endsWith('.xlsx') || n.endsWith('.xls') || n.endsWith('.csv');
}
