package com.ailtariel.lizmoneynote;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "DataExport")
public class DataExportPlugin extends Plugin {
    @PluginMethod
    public void saveJson(PluginCall call) {
        String fileName = call.getString("fileName");
        String content = call.getString("content");

        if (fileName == null || fileName.trim().isEmpty()) {
            call.reject("Missing export file name.");
            return;
        }

        if (content == null) {
            call.reject("Missing export content.");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, fileName);
        startActivityForResult(call, intent, "saveJsonResult");
    }

    @ActivityCallback
    private void saveJsonResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        Intent data = result.getData();
        Uri uri = data != null ? data.getData() : null;

        if (result.getResultCode() != Activity.RESULT_OK || uri == null) {
            call.reject("Export canceled.");
            return;
        }

        String content = call.getString("content", "");

        try (OutputStream output = getContext().getContentResolver().openOutputStream(uri)) {
            if (output == null) {
                call.reject("Failed to open export file.");
                return;
            }

            output.write(content.getBytes(StandardCharsets.UTF_8));
            output.flush();
            call.resolve();
        } catch (Exception error) {
            call.reject(error.getMessage(), error);
        }
    }
}

