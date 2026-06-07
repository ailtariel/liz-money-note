package com.ailtariel.lizmoneynote;

import android.webkit.WebView;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

@CapacitorPlugin(name = "SystemCache")
public class SystemCachePlugin extends Plugin {
    @PluginMethod
    public void clearCache(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.clearCache(true);
            }

            deleteRecursively(getContext().getCacheDir());
            call.resolve();
        });
    }

    private void deleteRecursively(File file) {
        if (file == null || !file.exists()) {
            return;
        }

        File[] children = file.listFiles();
        if (children != null) {
            for (File child : children) {
                deleteRecursively(child);
            }
        }

        file.delete();
    }
}
