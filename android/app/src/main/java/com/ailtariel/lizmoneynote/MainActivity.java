package com.ailtariel.lizmoneynote;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SystemCachePlugin.class);
        registerPlugin(AppUpdatePlugin.class);
        registerPlugin(DataExportPlugin.class);
        registerPlugin(DataImportPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
