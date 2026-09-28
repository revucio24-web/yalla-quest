import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { playArabic } from '../lib/audio';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost'; children: ReactNode };

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return <button className={`button button--${variant} ${className}`} {...props}>{children}</button>;
}

export function ArabicWord({ arabic, german, reading, size = 'normal' }: { arabic: string; german?: string; reading?: string; size?: 'normal' | 'large' }) {
  return <span className={`arabic-word arabic-word--${size}`}>
    <span lang="ar" dir="rtl" className="arabic-script">{arabic}</span>
    {german && <span className="arabic-translation">{german}</span>}
    {reading && <span className="arabic-reading">{reading}</span>}
  </span>;
}

export function AudioButton({ arabic, enabled, audio, label = 'Arabisch anhören', slow = false }: { arabic: string; enabled: boolean; audio?: string; label?: string; slow?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <span className="audio-control"><button className="audio-button" type="button" aria-label={label} title={enabled ? label : 'Ton ist ausgeschaltet'} onClick={async () => setFailed(!await playArabic(arabic, enabled, audio, slow))} disabled={!enabled}>{slow ? '½' : '♪'}</button>{failed && <small role="status">Ton gerade nicht verfügbar. Du kannst das Wort lesen.</small>}</span>;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return <div className="progress-track" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
    <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>;
}
