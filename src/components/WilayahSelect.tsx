"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiSearch, FiX } from "react-icons/fi";
import {
  PROVINCES,
  getRegenciesByProvince,
  DEFAULT_PROVINCE_CODE,
  WilayahProvince,
  WilayahRegency,
} from "@/lib/wilayah";

export interface WilayahValue {
  provCode: string;
  kotaCode: string;
  display: string;
  manual: boolean;
}

interface WilayahSelectProps {
  id: string;
  value: WilayahValue;
  onChange: (next: WilayahValue) => void;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

interface Option {
  code: string;
  label: string;
}

export const createEmptyWilayah = (): WilayahValue => ({
  provCode: DEFAULT_PROVINCE_CODE,
  kotaCode: "",
  display: "",
  manual: false,
});

function inputClass(hasError: boolean): string {
  return `w-full p-3.5 bg-surface-sunken border rounded-field text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-4 ${
    hasError
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-border focus:border-foreground focus:ring-primary/40"
  }`;
}

function fieldClass(invalid?: boolean) {
  return [
    "flex w-full items-center justify-between gap-2 p-3.5 bg-surface-sunken border rounded-field text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-4",
    invalid
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-border focus:border-foreground focus:ring-primary/40",
    "disabled:cursor-not-allowed disabled:bg-surface-sunken/50 disabled:text-muted-foreground",
  ].join(" ");
}

function Combobox({
  id,
  options,
  value,
  placeholder,
  emptyLabel,
  disabled,
  invalid,
  describedBy,
  onSelect,
}: {
  id: string;
  options: Option[];
  value: string;
  placeholder: string;
  emptyLabel: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onSelect: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.code === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    const starts: Option[] = [];
    const contains: Option[] = [];
    for (const o of options) {
      const label = o.label.toLowerCase();
      if (label.startsWith(q)) starts.push(o);
      else if (label.includes(q)) contains.push(o);
    }
    return [...starts, ...contains];
  }, [options, query]);

  const openPanel = () => {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLLIElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const commit = (code: string) => {
    onSelect(code);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option) commit(option.code);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={fieldClass(invalid)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={describedBy}
      >
        <span className={selected ? "truncate text-left" : "truncate text-left text-muted-foreground"}>
          {selected ? selected.label : placeholder}
        </span>
        <FiChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-card border border-border bg-card shadow-hover">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <FiSearch className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Ketik untuk mencari..."
              className="w-full bg-transparent py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
              aria-controls={`${id}-listbox`}
              aria-autocomplete="list"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground"
                aria-label="Bersihkan pencarian"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <ul
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            className="max-h-60 overflow-y-auto overscroll-contain py-1"
          >
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-center text-sm font-medium text-muted-foreground">
                {emptyLabel}
              </li>
            )}
            {filtered.map((option, index) => {
              const isSelected = option.code === value;
              const isActive = index === activeIndex;
              return (
                <li
                  key={option.code}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commit(option.code)}
                  className={`flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold ${
                    isActive ? "bg-surface-sunken text-foreground" : "text-foreground-accent"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <FiCheck className="h-4 w-4 shrink-0 text-primary" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function WilayahSelect({
  id,
  value,
  onChange,
  required,
  invalid,
  describedBy,
}: WilayahSelectProps) {
  const provinceOptions = useMemo<Option[]>(() => {
    return PROVINCES.map((p) => ({ code: p.c, label: p.n })).sort((a, b) => a.label.localeCompare(b.label, "id"));
  }, []);

  const regencyOptions = useMemo<Option[]>(() => {
    if (!value.provCode) return [];
    return getRegenciesByProvince(value.provCode).map((r) => ({
      code: r.c,
      label: r.n,
    }));
  }, [value.provCode]);

  const handleProvince = (provCode: string) => {
    onChange({ provCode, kotaCode: "", display: "", manual: false });
  };

  const handleRegency = (kotaCode: string) => {
    const match = regencyOptions.find((o) => o.code === kotaCode);
    onChange({
      provCode: value.provCode,
      kotaCode,
      display: (match?.label ?? "").toUpperCase(),
      manual: false,
    });
  };

  const toggleManual = (manual: boolean) => {
    onChange(
      manual
        ? { provCode: "", kotaCode: "", display: "", manual: true }
        : { ...createEmptyWilayah(), manual: false }
    );
  };

  if (value.manual) {
    return (
      <div className="space-y-2">
        <Combobox
          id={`${id}-manual-prov`}
          options={provinceOptions}
          value={value.provCode}
          placeholder="Pilih provinsi"
          emptyLabel="Provinsi tidak ditemukan"
          invalid={invalid && !value.provCode}
          describedBy={describedBy}
          onSelect={(provCode) =>
            onChange({ ...value, provCode, kotaCode: "", manual: true })
          }
        />
        <input
          id={id}
          type="text"
          value={value.display}
          onChange={(e) =>
            onChange({
              provCode: value.provCode, // Keep province selection
              kotaCode: "",
              display: e.target.value.toUpperCase(),
              manual: true,
            })
          }
          required={required}
          disabled={!value.provCode}
          maxLength={50}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          placeholder={value.provCode ? "Tulis kota / kabupaten domisili" : "Pilih provinsi terlebih dahulu"}
          className={inputClass(Boolean(invalid))}
        />
        <button
          type="button"
          onClick={() => toggleManual(false)}
          className="text-xs font-bold text-foreground underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          Kembali pilih dari daftar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
        <Combobox
          id={`${id}-prov`}
          options={provinceOptions}
          value={value.provCode}
          placeholder="Pilih provinsi"
          emptyLabel="Provinsi tidak ditemukan"
          invalid={invalid && !value.provCode}
          onSelect={handleProvince}
        />
        <Combobox
          id={id}
          options={regencyOptions}
          value={value.kotaCode}
          placeholder={value.provCode ? "Pilih kota / kabupaten" : "Pilih provinsi terlebih dahulu"}
          emptyLabel="Kota / kabupaten tidak ditemukan"
          disabled={!value.provCode}
          invalid={invalid && Boolean(value.provCode)}
          describedBy={describedBy}
          onSelect={handleRegency}
        />
      </div>
      <button
        type="button"
        onClick={() => toggleManual(true)}
        className="text-xs font-bold text-foreground underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
      >
        Wilayah saya tidak ada di daftar
      </button>
    </div>
  );
}
