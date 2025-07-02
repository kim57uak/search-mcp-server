import os from 'os';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function getChromePathWindows() {
  const programFiles = process.env['ProgramFiles(x86)'] || process.env.ProgramFiles;
  if (programFiles) {
    const chromePaths = [
      path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFiles, 'Google', 'Chrome Beta', 'Application', 'chrome.exe'),
      path.join(programFiles, 'Google', 'Chrome Canary', 'Application', 'chrome.exe'),
    ];
    for (const chromePath of chromePaths) {
      if (fs.existsSync(chromePath)) {
        return chromePath;
      }
    }
  }
  return null;
}

function getChromePathMac() {
  const chromePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  ];
  for (const chromePath of chromePaths) {
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }
  return null;
}

function getChromePathLinux() {
  try {
    const chromePath = execSync('which google-chrome', { encoding: 'utf8' }).trim();
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  } catch (e) {
    // which command might fail if chrome is not in PATH
  }
  // Fallback paths if 'which' command fails or chrome is not in PATH
  const commonPaths = [
    '/usr/bin/google-chrome',
    '/opt/google/chrome/chrome',
    '/snap/bin/chromium', // Common path for Snap package
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

export function findChromePath() {
  const platform = os.platform();
  let chromePath = null;

  if (platform === 'win32') {
    chromePath = getChromePathWindows();
  } else if (platform === 'darwin') {
    chromePath = getChromePathMac();
  } else if (platform === 'linux') {
    chromePath = getChromePathLinux();
  }

  if (!chromePath) {
    console.warn('Google Chrome executable not found. Please ensure Chrome is installed and in your system PATH or provide the CHROME_PATH environment variable.');
  }
  return chromePath;
}

// Example usage:
// const chromeExecutablePath = findChromePath();
// if (chromeExecutablePath) {
//   console.log(`Found Chrome at: ${chromeExecutablePath}`);
// } else {
//   console.log('Chrome not found.');
// }
