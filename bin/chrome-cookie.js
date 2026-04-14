#!/usr/bin/env node

/**
 * Auto-read Chrome cookies for a given domain (macOS only)
 * Chrome 80+ encrypts cookies via Keychain — this handles decryption.
 *
 * Dependencies: macOS built-in sqlite3 CLI + security command + Node.js crypto
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Chrome Cookies DB paths (macOS)
const CHROME_PROFILES = [
  path.join(os.homedir(), 'Library/Application Support/Google/Chrome/Default/Cookies'),
  path.join(os.homedir(), 'Library/Application Support/Google/Chrome/Profile 1/Cookies'),
  path.join(os.homedir(), 'Library/Application Support/Google/Chrome/Profile 2/Cookies'),
];

function findCookieDb() {
  for (const p of CHROME_PROFILES) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getChromeDecryptionKey() {
  // Get Chrome Safe Storage password from macOS Keychain
  try {
    const password = execSync(
      'security find-generic-password -w -s "Chrome Safe Storage" -a "Chrome"',
      { encoding: 'utf8' },
    ).trim();

    // PBKDF2 key derivation
    // Chromium source: salt = "saltysalt", iterations = 1003, key_length = 16
    const key = crypto.pbkdf2Sync(password, 'saltysalt', 1003, 16, 'sha1');
    return key;
  } catch (err) {
    throw new Error(
      'Cannot get Chrome key from Keychain.\n' +
        'Make sure: 1) Chrome is installed  2) Allow Keychain access when prompted\n' +
        'Error: ' + err.message,
    );
  }
}

function decryptCookieValue(encryptedValue, key) {
  if (!encryptedValue || encryptedValue.length === 0) return '';

  const prefix = encryptedValue.slice(0, 3).toString('ascii');

  if (prefix === 'v10' || prefix === 'v11') {
    const afterPrefix = encryptedValue.slice(3);

    // Chrome encryption: "v10" (3 bytes) + nonce (16 bytes) + IV (16 bytes) + AES-128-CBC ciphertext
    if (afterPrefix.length > 32) {
      try {
        const iv = afterPrefix.slice(16, 32);
        const ciphertext = afterPrefix.slice(32);
        const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        decipher.setAutoPadding(true);
        let decrypted = decipher.update(ciphertext);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        const result = decrypted.toString('utf8');
        if (!/[\x00-\x08\x0e-\x1f]/.test(result)) return result;
      } catch {}
    }

    // Fallback: standard Chromium format (IV = 16 spaces)
    try {
      const iv = Buffer.alloc(16, 0x20);
      const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
      decipher.setAutoPadding(true);
      let decrypted = decipher.update(afterPrefix);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      const result = decrypted.toString('utf8');
      const clean = result.match(/[\x20-\x7e]{8,}$/);
      if (clean) return clean[0];
      if (!/[\x00-\x08\x0e-\x1f]/.test(result)) return result;
    } catch {}

    return '';
  }

  // Unencrypted cookie (older Chrome)
  return encryptedValue.toString('utf8');
}

function getCookiesForDomain(domain) {
  const cookieDb = findCookieDb();
  if (!cookieDb) {
    throw new Error(
      'Chrome Cookies database not found.\n' +
        'Expected at: ' + CHROME_PROFILES[0],
    );
  }

  // Copy DB to temp dir (Chrome locks the original while running)
  const tmpDb = path.join(os.tmpdir(), `chrome_cookies_${Date.now()}.db`);
  fs.copyFileSync(cookieDb, tmpDb);

  // Copy WAL and SHM files if present
  for (const ext of ['-wal', '-shm']) {
    const src = cookieDb + ext;
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, tmpDb + ext);
    }
  }

  try {
    const key = getChromeDecryptionKey();

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const sql = `SELECT name, value, hex(encrypted_value), host_key, path, is_secure FROM cookies WHERE host_key LIKE '%${cleanDomain}' ORDER BY name;`;

    const output = execSync(`sqlite3 -separator '|||' "${tmpDb}" "${sql}"`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    }).trim();

    if (!output) {
      return { cookies: [], cookieString: '' };
    }

    const cookies = [];
    const seen = new Map(); // name -> { value, domain }
    const lines = output.split('\n');

    for (const line of lines) {
      const parts = line.split('|||');
      if (parts.length < 4) continue;

      const [name, plainValue, hexValue, hostKey, cookiePath, isSecure] = parts;

      let value = plainValue || '';
      if (!value && hexValue && hexValue.length > 0) {
        const encBuf = Buffer.from(hexValue, 'hex');
        value = decryptCookieValue(encBuf, key);
      }

      if (!value || /[\x00-\x08\x0e-\x1f\x80-\xff]/.test(value)) continue;

      // Prefer exact domain match over wildcard (e.g. "jira.co" > ".jira.co")
      if (seen.has(name)) {
        const prev = seen.get(name);
        const prevIsWild = prev.domain.startsWith('.');
        const curIsWild = hostKey.startsWith('.');
        if (prevIsWild === curIsWild) {
          // Same specificity — keep longer value
          if (prev.value.length >= value.length) continue;
        } else if (!prevIsWild) {
          // Previous is exact match, skip wildcard
          continue;
        }
        // else: previous is wildcard, current is exact — replace
      }
      seen.set(name, { value, domain: hostKey });

      const existIdx = cookies.findIndex((c) => c.name === name);
      if (existIdx >= 0) cookies.splice(existIdx, 1);

      cookies.push({
        name,
        value,
        domain: hostKey,
        path: cookiePath,
        secure: isSecure === '1',
      });
    }

    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    return { cookies, cookieString };
  } finally {
    try {
      fs.unlinkSync(tmpDb);
      for (const ext of ['-wal', '-shm']) {
        if (fs.existsSync(tmpDb + ext)) fs.unlinkSync(tmpDb + ext);
      }
    } catch {}
  }
}

// CLI mode
if (require.main === module) {
  const domain = process.argv[2];
  if (!domain) {
    console.error('Usage: node chrome-cookie.js <domain>');
    console.error('Example: node chrome-cookie.js jira.yourcompany.com');
    process.exit(1);
  }

  try {
    const { cookies, cookieString } = getCookiesForDomain(domain);
    if (cookies.length === 0) {
      console.error(`No cookies found for ${domain}. Make sure you are logged in via Chrome.`);
      process.exit(1);
    }
    console.error(`Found ${cookies.length} cookies (domain: ${domain})`);
    console.log(cookieString);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

module.exports = { getCookiesForDomain };
