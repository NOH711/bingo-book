#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env');

// Charge .env pour les builds locaux ; sur Netlify les vraies variables
// sont déjà présentes dans process.env, aucun fichier .env n'y est nécessaire.
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2] || '';
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

const REQUIRED = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'ADMIN_UID',
];

const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('Variables d\'environnement manquantes : ' + missing.join(', '));
  console.error('Définis-les dans Netlify (Site configuration -> Environment variables) ou dans un fichier .env local (voir .env.example).');
  process.exit(1);
}

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const key of REQUIRED) {
  html = html.split('__' + key + '__').join(process.env[key]);
}

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist', 'index.html'), html);
fs.copyFileSync(path.join(ROOT, 'cover.html'), path.join(ROOT, 'dist', 'cover.html'));

console.log('OK : index.html généré avec les variables d\'environnement -> dist/');
