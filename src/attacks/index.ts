import type { AttackDefinition } from '../types';
import { sqlInjection } from './sql-injection';
import { xss } from './xss';
import { csrf } from './csrf';
import { osCommandInjection } from './os-command-injection';
import { directoryTraversal } from './directory-traversal';
import { sessionHijacking } from './session-hijacking';
import { ddos } from './ddos';
import { phishing } from './phishing';
import { clickjacking } from './clickjacking';
import { ransomware } from './ransomware';
import { driveByDownload } from './drive-by-download';
import { targetedAttack } from './targeted-attack';
import { wateringHole } from './watering-hole';
import { supplyChain } from './supply-chain';

const all: AttackDefinition[] = [
  sqlInjection,
  xss,
  csrf,
  osCommandInjection,
  directoryTraversal,
  sessionHijacking,
  ddos,
  phishing,
  clickjacking,
  ransomware,
  driveByDownload,
  targetedAttack,
  wateringHole,
  supplyChain
];

export const attackRegistry: Record<string, AttackDefinition> = Object.fromEntries(
  all.map((a) => [a.meta.slug, a])
);
