// helpers/repo-inspector.js — Repository and File Contract Inspector
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../test-config.js';

export const repoInspector = {
  fileExists(relPath) {
    const fullPath = path.resolve(config.projectRoot, relPath);
    return fs.existsSync(fullPath);
  },

  readFile(relPath) {
    const fullPath = path.resolve(config.projectRoot, relPath);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    return fs.readFileSync(fullPath, 'utf8');
  },

  getProperties(relPath) {
    const content = this.readFile(relPath);
    if (!content) return {};
    const lines = content.split('\n');
    const props = {};
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line.startsWith('!')) continue;
      const idx = line.indexOf('=');
      if (idx !== -1) {
        const key = line.substring(0, idx).trim();
        const value = line.substring(idx + 1).trim();
        props[key] = value;
      }
    }
    return props;
  },

  isGitInitialized() {
    const gitDir = path.join(config.projectRoot, '.git');
    return fs.existsSync(gitDir);
  },

  getResidualClutterFiles() {
    const candidates = [
      'DIARIO.md.save',
      'DIARIO.md.save.1',
      'DIARIO.md.save.2',
      'prueba.md',
      'back/hola.gitignore',
      'back/DIARIO.md.save',
      'back/DIARIO.md.save.1',
      'back/DIARIO.md.save.2',
      'front/.gitignore copy',
    ];
    return candidates.filter((f) => fs.existsSync(path.join(config.projectRoot, f)));
  },

  getBackendSourceFiles() {
    const basePath = path.join(config.backendRoot, 'src/main/java/com/perdomazo/firstproject');
    const walk = (dir) => {
      let results = [];
      if (!fs.existsSync(dir)) return results;
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results = results.concat(walk(full));
        } else if (file.endsWith('.java')) {
          results.push(full);
        }
      }
      return results;
    };
    return walk(basePath);
  },

  getFrontendSourceFiles() {
    const basePath = path.join(config.frontendRoot, 'src');
    const walk = (dir) => {
      let results = [];
      if (!fs.existsSync(dir)) return results;
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results = results.concat(walk(full));
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css')) {
          results.push(full);
        }
      }
      return results;
    };
    return walk(basePath);
  },
};

export default repoInspector;
