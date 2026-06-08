export interface AppUpdateManifest {
  version: string;
  releaseUrl: string;
  releaseNotes: string;
  downloadUrl: string | null;
  forceUpdate: boolean;
}

export interface AppUpdateResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  manifest: AppUpdateManifest | null;
}

