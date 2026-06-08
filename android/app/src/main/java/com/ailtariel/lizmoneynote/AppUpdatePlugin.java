package com.ailtariel.lizmoneynote;

import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {
    @PluginMethod
    public void installApk(PluginCall call) {
        String downloadUrl = call.getString("downloadUrl");
        String version = call.getString("version");

        if (downloadUrl == null || downloadUrl.trim().isEmpty()) {
            call.reject("Missing APK download URL.");
            return;
        }

        if (version == null || version.trim().isEmpty()) {
            call.reject("Missing APK version.");
            return;
        }

        new Thread(() -> {
            try {
                File apkFile = getApkFile(version);

                if (!apkFile.exists()) {
                    downloadApk(downloadUrl, apkFile);
                }

                installApkFile(apkFile);
                call.resolve();
            } catch (Exception error) {
                call.reject(error.getMessage(), error);
            }
        }).start();
    }

    private File getApkFile(String version) {
        File updateDir = new File(getContext().getCacheDir(), "app-updates");
        if (!updateDir.exists()) {
            updateDir.mkdirs();
        }

        return new File(updateDir, "liz-money-note-" + version + ".apk");
    }

    private void downloadApk(String downloadUrl, File apkFile) throws Exception {
        URL url = new URL(downloadUrl);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setConnectTimeout(15000);
        connection.setReadTimeout(30000);
        connection.connect();

        int status = connection.getResponseCode();
        if (status < 200 || status >= 300) {
            throw new Exception("APK download failed with HTTP " + status + ".");
        }

        File tempFile = new File(apkFile.getParentFile(), apkFile.getName() + ".tmp");
        try (InputStream input = connection.getInputStream();
             FileOutputStream output = new FileOutputStream(tempFile)) {
            byte[] buffer = new byte[8192];
            int length;

            while ((length = input.read(buffer)) != -1) {
                output.write(buffer, 0, length);
            }
        } finally {
            connection.disconnect();
        }

        if (apkFile.exists() && !apkFile.delete()) {
            throw new Exception("Failed to replace cached APK.");
        }

        if (!tempFile.renameTo(apkFile)) {
            throw new Exception("Failed to save downloaded APK.");
        }
    }

    private void installApkFile(File apkFile) {
        Uri apkUri = FileProvider.getUriForFile(
            getContext(),
            getContext().getPackageName() + ".fileprovider",
            apkFile
        );
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        getContext().startActivity(intent);
    }
}

