import { Capacitor, registerPlugin } from '@capacitor/core';
import type { AppUpdateManifest, AppUpdateResult } from './types';

type AppUpdatePlugin = {
  installApk: (params: {
    downloadUrl: string;
    version: string;
  }) => Promise<void>;
};

const NativeAppUpdate = registerPlugin<AppUpdatePlugin>('AppUpdate');

interface GitHubReleaseAsset {
  name?: unknown;
  browser_download_url?: unknown;
}

interface GitHubReleaseResponse {
  tag_name?: unknown;
  html_url?: unknown;
  body?: unknown;
  assets?: unknown;
  prerelease?: unknown;
  draft?: unknown;
}

function normalizeVersion(version: string) {
  return version.trim().replace(/^v/i, '');
}

function parseVersionSegments(version: string) {
  return normalizeVersion(version)
    .split(/[.-]/)
    .map((segment) => Number.parseInt(segment, 10))
    .map((segment) => (Number.isFinite(segment) ? segment : 0));
}

export function compareVersions(left: string, right: string) {
  const leftSegments = parseVersionSegments(left);
  const rightSegments = parseVersionSegments(right);
  const length = Math.max(leftSegments.length, rightSegments.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = leftSegments[index] ?? 0;
    const rightValue = rightSegments[index] ?? 0;

    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }

  return 0;
}

function pickApkDownloadUrl(assets: unknown) {
  if (!Array.isArray(assets)) {
    return null;
  }

  const apkAsset = (assets as GitHubReleaseAsset[]).find((asset) => {
    const name = typeof asset.name === 'string' ? asset.name : '';
    return name.toLowerCase().endsWith('.apk');
  });

  return typeof apkAsset?.browser_download_url === 'string'
    ? apkAsset.browser_download_url
    : null;
}

function toManifest(response: GitHubReleaseResponse): AppUpdateManifest {
  const tagName = typeof response.tag_name === 'string' ? response.tag_name : '';
  const version = normalizeVersion(tagName);

  if (!version) {
    throw new Error('GitHub release response does not include tag_name.');
  }

  return {
    version,
    releaseUrl:
      typeof response.html_url === 'string' ? response.html_url : '',
    releaseNotes: typeof response.body === 'string' ? response.body : '',
    downloadUrl: pickApkDownloadUrl(response.assets),
    forceUpdate: false
  };
}

export async function checkAppUpdate(
  manifestUrl: string,
  currentVersion: string
): Promise<AppUpdateResult> {
  const response = await fetch(manifestUrl, {
    headers: {
      Accept: 'application/vnd.github+json'
    }
  });

  if (!response.ok) {
    throw new Error(`App update check failed with HTTP ${response.status}.`);
  }

  const release = (await response.json()) as GitHubReleaseResponse;

  if (release.draft === true || release.prerelease === true) {
    return {
      currentVersion,
      latestVersion: currentVersion,
      hasUpdate: false,
      manifest: null
    };
  }

  const manifest = toManifest(release);
  const hasUpdate = compareVersions(currentVersion, manifest.version) < 0;

  return {
    currentVersion,
    latestVersion: manifest.version,
    hasUpdate,
    manifest
  };
}

export async function installAppUpdate(manifest: AppUpdateManifest) {
  const targetUrl = manifest.downloadUrl ?? manifest.releaseUrl;

  if (!targetUrl) {
    throw new Error('No update download URL is available.');
  }

  if (Capacitor.getPlatform() === 'android' && manifest.downloadUrl) {
    await NativeAppUpdate.installApk({
      downloadUrl: manifest.downloadUrl,
      version: manifest.version
    });
    return;
  }

  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}
