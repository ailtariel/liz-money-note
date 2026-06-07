package com.ailtariel.lizmoneynote;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SystemCachePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
