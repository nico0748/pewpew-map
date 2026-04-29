import type { PictogramComponent, PictogramName } from '../types';

interface SvgProps {
  className?: string;
}

export const UserPict: PictogramComponent = ({ className = 'pict pict-user' }) => (
  <svg className={className} viewBox="0 0 64 64" aria-label="利用者">
    <circle cx="32" cy="20" r="9" fill="currentColor" />
    <path d="M14 54 C14 40, 50 40, 50 54 Z" fill="currentColor" />
  </svg>
);

export const AttackerPict: PictogramComponent = ({ className = 'pict pict-attacker' }) => (
  <svg className={className} viewBox="0 0 64 64" aria-label="攻撃者">
    <circle cx="32" cy="20" r="9" fill="currentColor" />
    <path d="M14 54 C14 40, 50 40, 50 54 Z" fill="currentColor" />
    <path d="M22 18 L30 22 M42 18 L34 22" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    <path d="M20 8 L26 14 M44 8 L38 14" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
  </svg>
);

export const ServerPict: PictogramComponent = ({ className = 'pict pict-server' }) => (
  <svg className={className} viewBox="0 0 64 64" aria-label="サーバ">
    <rect x="12" y="10" width="40" height="14" rx="2" fill="currentColor" />
    <rect x="12" y="28" width="40" height="14" rx="2" fill="currentColor" />
    <rect x="12" y="46" width="40" height="10" rx="2" fill="currentColor" />
    <circle cx="20" cy="17" r="2" fill="#fff" />
    <circle cx="20" cy="35" r="2" fill="#fff" />
    <circle cx="20" cy="51" r="1.5" fill="#fff" />
  </svg>
);

export const DatabasePict: PictogramComponent = ({ className = 'pict pict-db' }) => (
  <svg className={className} viewBox="0 0 64 64" aria-label="データベース">
    <ellipse cx="32" cy="14" rx="20" ry="6" fill="currentColor" />
    <path d="M12 14 V32 C12 36, 52 36, 52 32 V14" fill="currentColor" />
    <path d="M12 32 V50 C12 54, 52 54, 52 50 V32" fill="currentColor" opacity="0.85" />
    <ellipse cx="32" cy="32" rx="20" ry="6" fill="none" stroke="#fff" strokeWidth={1.5} />
  </svg>
);

export const BrowserPict: PictogramComponent = ({ className = 'pict pict-browser' }) => (
  <svg className={className} viewBox="0 0 64 64" aria-label="ブラウザ">
    <rect x="6" y="10" width="52" height="44" rx="3" fill="currentColor" />
    <rect x="6" y="10" width="52" height="10" rx="3" fill="#fff" opacity="0.4" />
    <circle cx="12" cy="15" r="1.8" fill="#fff" />
    <circle cx="18" cy="15" r="1.8" fill="#fff" />
    <circle cx="24" cy="15" r="1.8" fill="#fff" />
  </svg>
);

export const EmailPict: PictogramComponent = ({ className = 'pict pict-email' }) => (
  <svg className={className} viewBox="0 0 64 64" aria-label="メール">
    <rect x="6" y="14" width="52" height="36" rx="3" fill="currentColor" />
    <path d="M6 18 L32 38 L58 18" fill="none" stroke="#fff" strokeWidth={2.5} />
  </svg>
);

export const LockPict: PictogramComponent = ({ className = 'pict pict-lock' }) => (
  <svg className={className} viewBox="0 0 64 64" aria-label="ロック">
    <path d="M20 28 V20 C20 12, 44 12, 44 20 V28" fill="none" stroke="currentColor" strokeWidth={4} />
    <rect x="14" y="28" width="36" height="26" rx="3" fill="currentColor" />
    <circle cx="32" cy="40" r="3" fill="#fff" />
    <rect x="31" y="40" width="2" height="8" fill="#fff" />
  </svg>
);

export const UnlockPict: PictogramComponent = ({ className = 'pict pict-unlock' }) => (
  <svg className={className} viewBox="0 0 64 64" aria-label="解錠">
    <path d="M20 28 V20 C20 12, 44 12, 44 20" fill="none" stroke="currentColor" strokeWidth={4} />
    <rect x="14" y="28" width="36" height="26" rx="3" fill="currentColor" />
    <circle cx="32" cy="40" r="3" fill="#fff" />
  </svg>
);

export const DocumentPict: PictogramComponent = ({ className = 'pict pict-doc' }) => (
  <svg className={className} viewBox="0 0 64 64" aria-label="ドキュメント">
    <path d="M16 6 H42 L52 16 V58 H16 Z" fill="currentColor" />
    <path d="M42 6 V16 H52" fill="none" stroke="#fff" strokeWidth={1.5} />
    <line x1="22" y1="26" x2="46" y2="26" stroke="#fff" strokeWidth={2} />
    <line x1="22" y1="34" x2="46" y2="34" stroke="#fff" strokeWidth={2} />
    <line x1="22" y1="42" x2="38" y2="42" stroke="#fff" strokeWidth={2} />
  </svg>
);

export const WarningPict: PictogramComponent = ({ className = 'pict pict-warn' }) => (
  <svg className={className} viewBox="0 0 64 64" aria-label="警告">
    <path d="M32 6 L60 56 H4 Z" fill="currentColor" />
    <rect x="30" y="22" width="4" height="20" fill="#fff" />
    <circle cx="32" cy="48" r="2.5" fill="#fff" />
  </svg>
);

export const BotPict: PictogramComponent = ({ className = 'pict pict-bot' }) => (
  <svg className={className} viewBox="0 0 64 64" aria-label="ボット">
    <rect x="14" y="18" width="36" height="32" rx="6" fill="currentColor" />
    <circle cx="24" cy="32" r="3" fill="#fff" />
    <circle cx="40" cy="32" r="3" fill="#fff" />
    <rect x="22" y="42" width="20" height="3" rx="1.5" fill="#fff" />
    <rect x="30" y="8" width="4" height="10" fill="currentColor" />
    <circle cx="32" cy="8" r="3" fill="currentColor" />
  </svg>
);

export const ShieldPict: PictogramComponent = ({ className = 'pict pict-shield' }) => (
  <svg className={className} viewBox="0 0 64 64" aria-label="シールド">
    <path
      d="M32 6 L54 14 V32 C54 46, 32 58, 32 58 C32 58, 10 46, 10 32 V14 Z"
      fill="currentColor"
    />
    <path
      d="M22 32 L30 40 L44 24"
      fill="none"
      stroke="#fff"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const KeyPict: PictogramComponent = ({ className = 'pict pict-key' }) => (
  <svg className={className} viewBox="0 0 64 64" aria-label="鍵">
    <circle cx="20" cy="32" r="10" fill="none" stroke="currentColor" strokeWidth={4} />
    <rect x="28" y="30" width="28" height="4" fill="currentColor" />
    <rect x="46" y="30" width="4" height="10" fill="currentColor" />
    <rect x="52" y="30" width="4" height="8" fill="currentColor" />
  </svg>
);

export const Pictograms: Record<PictogramName, PictogramComponent> = {
  user: UserPict,
  attacker: AttackerPict,
  server: ServerPict,
  database: DatabasePict,
  browser: BrowserPict,
  email: EmailPict,
  lock: LockPict,
  unlock: UnlockPict,
  document: DocumentPict,
  warning: WarningPict,
  bot: BotPict,
  shield: ShieldPict,
  key: KeyPict
};

// Make TS happy when imported solely for types.
export type { SvgProps };
