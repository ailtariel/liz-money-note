package com.ailtariel.lizmoneynote;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "DataImport")
public class DataImportPlugin extends Plugin {
    @PluginMethod
    public void pickTextFiles(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        startActivityForResult(call, intent, "pickTextFilesResult");
    }

    @ActivityCallback
    private void pickTextFilesResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        JSObject response = new JSObject();
        JSArray files = new JSArray();
        response.put("files", files);

        if (result.getResultCode() != Activity.RESULT_OK) {
            call.resolve(response);
            return;
        }

        Intent data = result.getData();
        if (data == null) {
            call.resolve(response);
            return;
        }

        try {
            ClipData clipData = data.getClipData();
            if (clipData != null) {
                for (int index = 0; index < clipData.getItemCount(); index += 1) {
                    files.put(readTextFile(clipData.getItemAt(index).getUri()));
                }
            } else if (data.getData() != null) {
                files.put(readTextFile(data.getData()));
            }

            call.resolve(response);
        } catch (Exception error) {
            call.reject(error.getMessage(), error);
        }
    }

    private JSObject readTextFile(Uri uri) throws Exception {
        JSObject file = new JSObject();
        file.put("fileName", getFileName(uri));
        file.put("content", readTextContent(uri));
        return file;
    }

    private String getFileName(Uri uri) {
        try (Cursor cursor = getContext().getContentResolver().query(
            uri,
            new String[] { OpenableColumns.DISPLAY_NAME },
            null,
            null,
            null
        )) {
            if (cursor != null && cursor.moveToFirst()) {
                int columnIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (columnIndex >= 0) {
                    String displayName = cursor.getString(columnIndex);
                    if (displayName != null && !displayName.trim().isEmpty()) {
                        return displayName;
                    }
                }
            }
        }

        String lastPathSegment = uri.getLastPathSegment();
        return lastPathSegment == null || lastPathSegment.trim().isEmpty()
            ? "import.txt"
            : lastPathSegment;
    }

    private String readTextContent(Uri uri) throws Exception {
        try (InputStream input = getContext().getContentResolver().openInputStream(uri);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (input == null) {
                throw new Exception("Failed to open import file.");
            }

            byte[] buffer = new byte[8192];
            int length;
            while ((length = input.read(buffer)) != -1) {
                output.write(buffer, 0, length);
            }

            return output.toString(StandardCharsets.UTF_8.name());
        }
    }
}
