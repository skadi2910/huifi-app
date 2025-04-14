import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 👇 Add this block for ignore patterns
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/target/**',
      '**/test-ledger/**',
      '**/*.d.ts',
      '**/*.json',
      '**/*.log',
    ],
  },

  // 👇 Existing compat config for Next.js/TS
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default eslintConfig;
