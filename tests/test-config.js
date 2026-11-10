// test-config.js — Central Configuration for GadgetStock E2E Test Suite
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Parse CLI flags
const args = process.argv.slice(2);
const getArgValue = (prefix) => {
  const match = args.find((a) => a.startsWith(prefix));
  return match ? match.split('=')[1] : null;
};

const tierFilter = getArgValue('--tier'); // e.g. '1', '2', '3', '4'
const featureFilter = getArgValue('--feature'); // e.g. 'F01', 'F14'
const isOffline = args.includes('--offline');
const isVerbose = args.includes('--verbose') || args.includes('-v');

export const config = {
  projectRoot,
  backendRoot: path.join(projectRoot, 'back'),
  frontendRoot: path.join(projectRoot, 'front'),
  backendUrl: process.env.BACKEND_URL || getArgValue('--backend-url') || 'http://localhost:8080',
  frontendUrl: process.env.FRONTEND_URL || getArgValue('--frontend-url') || 'http://localhost:5173',
  timeoutMs: 5000,
  tierFilter: tierFilter ? parseInt(tierFilter, 10) : null,
  featureFilter: featureFilter ? featureFilter.toUpperCase() : null,
  isOffline,
  isVerbose,
};

export default config;
