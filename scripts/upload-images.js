#!/usr/bin/env node
// Upload local images referenced in Markdown posts to the backend upload API
// Usage: set UPLOAD_API_URL and optional UPLOAD_TOKEN, then run this script before hexo generate/deploy

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const axios = require('axios');
const FormData = require('form-data');

const BLOG_DIR = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(BLOG_DIR, 'source', '_posts');
const MAP_FILE = path.join(BLOG_DIR, '.image_map.json');

const API_URL = process.env.UPLOAD_API_URL || 'http://127.0.0.1:8000/api/upload';
const API_TOKEN = process.env.UPLOAD_TOKEN || '';
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

async function uploadFile(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  const headers = Object.assign(form.getHeaders(), {});
  if (API_TOKEN) headers['Authorization'] = `Bearer ${API_TOKEN}`;
  const res = await axios.post(API_URL, form, { headers });
  return res.data; // expect JSON with { url: 'https://...' }
}

(async () => {
  const map = fs.pathExistsSync(MAP_FILE) ? fs.readJSONSync(MAP_FILE) : {};
  const mdFiles = glob.sync('**/*.md', { cwd: POSTS_DIR, absolute: true });

  for (const md of mdFiles) {
    let content = fs.readFileSync(md, 'utf8');
    const regex = /!\[[^\]]*\]\((?!https?:)([^)]+)\)/g;
    let matches = [];
    let m;
    while ((m = regex.exec(content)) !== null) {
      matches.push(m[1]);
    }

    if (matches.length === 0) continue;

    let changed = false;
    for (const relPath of matches) {
      const imgPath = path.resolve(path.dirname(md), relPath);
      if (!fs.existsSync(imgPath)) continue;
      // skip if already uploaded
      if (map[imgPath]) {
        content = content.split(relPath).join(map[imgPath]);
        changed = true;
        continue;
      }

      try {
        console.log('Uploading', imgPath);
        const data = await uploadFile(imgPath);
        if (data && data.url) {
          map[imgPath] = data.url;
          content = content.split(relPath).join(data.url);
          changed = true;
          console.log('Uploaded ->', data.url);
        } else {
          console.warn('Upload returned no url for', imgPath);
        }
      } catch (err) {
        console.error('Failed to upload', imgPath, err.message || err.toString());
      }
    }

    if (changed) {
      if (DRY_RUN) {
        console.log('[DRY RUN] Would patch', md);
      } else {
        fs.writeFileSync(md, content, 'utf8');
        console.log('Patched', md);
      }
    }
    if (DRY_RUN) {
      console.log('[DRY RUN] Would write map to', MAP_FILE);
    } else {
      fs.writeJSONSync(MAP_FILE, map, { spaces: 2 });
    }
  }

  console.log('All done.');
})();
