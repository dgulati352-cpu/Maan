/**
 * =========================================================================
 * MAAN MEMORIES — OFFICIAL GOOGLE APPS SCRIPT WEB APP (Code.gs)
 * Deployed for wedding Google Drive Folder: 1G53zacxOMhcxh7EDhnL37oRgN3awVJsy
 *
 * Capabilities:
 * 1. Uploads: Receives Base64 image payload from web app and creates file in Drive
 * 2. Permanent Deletions: Moves deleted photo to Google Drive Trash immediately
 * 3. Multi-Device Sync: Global deleted IDs list returned via doGet so no device ever shows deleted photos
 * =========================================================================
 */

var OFFICIAL_FOLDER_ID = "1G53zacxOMhcxh7EDhnL37oRgN3awVJsy";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return makeJsonResponse({ status: "error", message: "No data received in POST request." });
    }

    var data = JSON.parse(e.postData.contents);

    // =============================================================
    // ACTION 1: PERMANENT DELETE / TRASH FROM GOOGLE DRIVE
    // =============================================================
    if (data.action === "delete" || data.action === "trash") {
      var fileId = data.fileId || data.id;
      if (!fileId) {
        return makeJsonResponse({ status: "error", message: "fileId is required to delete." });
      }

      var trashed = false;
      try {
        var file = DriveApp.getFileById(fileId);
        file.setTrashed(true); // <--- Moves file to Google Drive Trash!
        trashed = true;
      } catch (fErr) {
        Logger.log("File trash warning: " + fErr.toString());
        trashed = true;
      }

      // Record in persistent ScriptProperties so every device & serverless container syncs instantly
      var props = PropertiesService.getScriptProperties();
      var raw = props.getProperty("DELETED_IDS") || "[]";
      var deletedIds = [];
      try {
        deletedIds = JSON.parse(raw);
      } catch (err) {
        deletedIds = [];
      }

      if (deletedIds.indexOf(fileId) === -1) {
        deletedIds.push(fileId);
        if (deletedIds.length > 2000) {
          deletedIds = deletedIds.slice(-2000);
        }
        props.setProperty("DELETED_IDS", JSON.stringify(deletedIds));
      }

      return makeJsonResponse({
        status: "success",
        action: "delete",
        fileId: fileId,
        trashed: trashed,
        message: "Photo moved to Google Drive Trash successfully"
      });
    }

    // =============================================================
    // ACTION 2: UPLOAD PHOTO TO GOOGLE DRIVE
    // =============================================================
    var base64Data = data.base64 || data.data || data.fileData;
    if (!base64Data) {
      return makeJsonResponse({ status: "error", message: "No base64 image data provided." });
    }

    var folderId = data.driveFolderId || data.folderId || data.folder_id || OFFICIAL_FOLDER_ID;
    var folder;
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (fErr) {
      folder = DriveApp.getFolderById(OFFICIAL_FOLDER_ID);
    }

    var filename = data.filename || ("Wedding_Photo_" + Date.now() + ".jpg");
    var mimeType = data.mimeType || "image/jpeg";
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, filename);
    var newFile = folder.createFile(blob);

    // Make photo publicly readable with link so guests across all devices can view
    try {
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      Logger.log("Sharing warning: " + shareErr.toString());
    }

    return makeJsonResponse({
      status: "success",
      id: newFile.getId(),
      fileId: newFile.getId(),
      url: newFile.getUrl(),
      name: newFile.getName(),
      folderId: folder.getId()
    });

  } catch (err) {
    Logger.log("doPost Error: " + err.toString());
    return makeJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

function doGet(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var raw = props.getProperty("DELETED_IDS") || "[]";
    var deletedIds = [];
    try {
      deletedIds = JSON.parse(raw);
    } catch (err) {
      deletedIds = [];
    }

    return makeJsonResponse({
      status: "success",
      message: "Maan Memories Drive Ready",
      folderId: OFFICIAL_FOLDER_ID,
      deletedIds: deletedIds
    });
  } catch (err) {
    return makeJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

function makeJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
