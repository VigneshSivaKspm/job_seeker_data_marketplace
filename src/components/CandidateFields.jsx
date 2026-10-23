import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { CTC_UNITS, EDUCATION_LEVELS, EXP_LEVELS, GENERIC_SKILLS, NOTICE_PERIODS, SKILL_SUGGESTIONS } from '../lib/data.js';
import { cx } from '../lib/utils.js';
import { Field, PillGroup, SelectInput, TextInput } from './ui.jsx';

export function SkillsInput({ value, onChange, suggestions, error }) {
  const [text, setText] = useState('');
  const add = (raw) => {
    const s = raw.trim();
    if (!s || value.length >= 15 || value.some((v) => v.toLowerCase() === s.toLowerCase())) return setText('');
    onChange([...value, s.slice(0, 30)]);
    setText('');
  };
  return (
    <div>
      <div className={cx('flex flex-wrap items-center gap-1.5 rounded-xl border bg-white p-2 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15', error ? 'border-rose-400' : 'border-slate-200')}>
        {value.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 rounded-full bg-brand py-1.5 pl-3.5 pr-2 text-xs font-bold text-white shadow-sm">
            {s}<button type="button" aria-label={`Remove ${s}`} onClick={() => onChange(value.filter((v) => v !== s))} className="rounded-full p-0.5 hover:bg-white/20"><X size={12} /></button>
          </span>
        ))}
        <input
          value={text} onChange={(e) => setText(e.target.value.replace(',', ''))} onBlur={() => add(text)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text); } else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1)); }}
          placeholder={value.length ? 'Add another…' : 'Type a skill and press Enter'}
          className="min-w-[8rem] flex-1 bg-transparent px-2 py-2 text-base font-medium outline-none placeholder:font-normal placeholder:text-slate-400 md:text-[15px]"
        />
      </div>
      {error && <span className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-600"><AlertCircle size={13} />{error}</span>}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {suggestions.filter((s) => !value.includes(s)).slice(0, 8).map((s) => (
          <button key={s} type="button" onClick={() => add(s)} className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600">+ {s}</button>
        ))}
      </div>
    </div>
  );
}

export const suggestionsFor = (categories, industry) => {
  const cat = categories.find((c) => c.name === industry);
  return (cat && SKILL_SUGGESTIONS[cat.id]) || GENERIC_SKILLS;
};

/* Flat field groups (used by the admin edit dialog) */

export function PersonalFields({ f, set, errors }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" required error={errors.name}><TextInput value={f.name} onChange={(e) => set('name', e.target.value)} error={errors.name} autoComplete="name" /></Field>
      <Field label="Email" required error={errors.email}><TextInput type="email" value={f.email} onChange={(e) => set('email', e.target.value)} error={errors.email} autoComplete="email" /></Field>
      <Field label="Phone number" required error={errors.phone} hint="Include country code, e.g. +91 98765 43210"><TextInput type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} autoComplete="tel" /></Field>
      <div className="hidden sm:block" />
      <Field label="Current location" required error={errors.currentLocation}><TextInput placeholder="City, State / Country" value={f.currentLocation} onChange={(e) => set('currentLocation', e.target.value)} error={errors.currentLocation} /></Field>
      <Field label="Preferred work location" required error={errors.preferredLocation}><TextInput placeholder="e.g. Bengaluru / Remote" value={f.preferredLocation} onChange={(e) => set('preferredLocation', e.target.value)} error={errors.preferredLocation} /></Field>
    </div>
  );
}

export function ProfessionalFields({ f, set, errors }) {
  const { categories, rolesFor } = useApp();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Business industry" required error={errors.industry}>
        <SelectInput value={f.industry} error={errors.industry} onChange={(e) => { set('industry', e.target.value); set('role', ''); }}>
          <option value="">Select industry</option>
          {categories.map((c) => <option key={c.id}>{c.name}</option>)}
        </SelectInput>
      </Field>
      <Field label="Primary job role" required error={errors.role} hint={f.industry ? undefined : 'Pick an industry first'}>
        <SelectInput value={f.role} error={errors.role} disabled={!f.industry} onChange={(e) => set('role', e.target.value)}>
          <option value="">Select role</option>
          {rolesFor(f.industry).map((r) => <option key={r}>{r}</option>)}
        </SelectInput>
      </Field>
      <Field label="Experience level" required error={errors.experience} as="div" className="sm:col-span-2"><PillGroup options={EXP_LEVELS} value={f.experience} onChange={(v) => set('experience', v)} /></Field>
      <Field label="Total years of experience" required error={errors.years}><TextInput type="number" inputMode="numeric" min="0" max="50" value={f.years} onChange={(e) => set('years', e.target.value)} error={errors.years} /></Field>
      <Field label="Highest education" required error={errors.education}>
        <SelectInput value={f.education} error={errors.education} onChange={(e) => set('education', e.target.value)}>
          <option value="">Select education</option>
          {EDUCATION_LEVELS.map((x) => <option key={x}>{x}</option>)}
        </SelectInput>
      </Field>
      <Field label="Key skills" required as="div" className="sm:col-span-2" hint="Up to 15 skills">
        <SkillsInput value={f.skills} onChange={(v) => set('skills', v)} error={errors.skills} suggestions={suggestionsFor(categories, f.industry)} />
      </Field>
    </div>
  );
}

export function SearchStatusFields({ f, set, errors }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Notice period" required error={errors.noticePeriod} as="div" className="sm:col-span-2"><PillGroup options={NOTICE_PERIODS} value={f.noticePeriod} onChange={(v) => set('noticePeriod', v)} /></Field>
      <Field label="Pay basis" required>
        <SelectInput value={f.ctcUnit} onChange={(e) => set('ctcUnit', e.target.value)}>
          {Object.entries(CTC_UNITS).map(([k, u]) => <option key={k} value={k}>{u.label}</option>)}
        </SelectInput>
      </Field>
      <Field label="Expected CTC / hourly rate" required error={errors.ctcAmount} hint={CTC_UNITS[f.ctcUnit].hint}><TextInput type="number" inputMode="decimal" min="0" value={f.ctcAmount} onChange={(e) => set('ctcAmount', e.target.value)} error={errors.ctcAmount} /></Field>
      <Field label="Resume link / portfolio URL" required error={errors.resume} className="sm:col-span-2" hint="Google Drive, LinkedIn, GitHub or personal site"><TextInput type="url" placeholder="https://" value={f.resume} onChange={(e) => set('resume', e.target.value)} error={errors.resume} /></Field>
    </div>
  );
}
