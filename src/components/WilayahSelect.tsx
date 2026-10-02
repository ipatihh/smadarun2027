"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiSearch, FiX } from "react-icons/fi";
import {
  PROVINCES,
  getRegenciesByProvince,
  DEFAULT_PROVINCE_CODE,
  KOTA_MANUAL_MAX_LENGTH,
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

// Tinggi daftar pilihan: maksimum = max-h-60 lama; minimum = ±3 baris, supaya di HP kecil
// dengan keyboard terbuka daftar tidak menyusut sampai hilang.
const LIST_MAX_HEIGHT = 240;
const LIST_MIN_HEIGHT = 120;

function Combobox({
  id,
  options,
  value,
  placeholder,
  searchPlaceholder,
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
  searchPlaceholder: string;
  emptyLabel: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onSelect: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [listMaxHeight, setListMaxHeight] = useState(LIST_MAX_HEIGHT);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
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
    setListMaxHeight(LIST_MAX_HEIGHT);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    // Layar sentuh: keyboard akan menutup separuh bawah layar, jadi panel dibawa ke atas
    // (berhenti di scroll-padding-top html, tepat di bawah header). Tanpa ini daftar pilihan
    // muncul di bawah kolom pencarian dan tertutup keyboard. Sengaja instan:
    // scroll halus bisa berebut dengan scroll otomatis browser saat keyboard muncul.
    const touch = window.matchMedia("(pointer: coarse)").matches;
    panelRef.current?.scrollIntoView(
      touch ? { block: "start", behavior: "instant" } : { block: "nearest" }
    );

    // Daftar hanya setinggi sisa layar yang benar-benar terlihat (visualViewport menyusut
    // saat keyboard muncul), jadi ujung daftar tidak memanjang ke balik keyboard.
    const fit = () => {
      const list = listRef.current;
      if (!list) return;
      const viewportBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
      const room = viewportBottom - list.getBoundingClientRect().top - 12;
      setListMaxHeight(Math.min(LIST_MAX_HEIGHT, Math.max(LIST_MIN_HEIGHT, room)));
    };
    if (touch) fit();
    vv?.addEventListener("resize", fit);
    vv?.addEventListener("scroll", fit);

    // preventScroll: posisi sudah diatur di atas; fokus bawaan hanya menggulir kolom
    // pencariannya, sehingga daftar di bawahnya bisa tetap terpotong.
    const raf = requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
    return () => {
      cancelAnimationFrame(raf);
      vv?.removeEventListener("resize", fit);
      vv?.removeEventListener("scroll", fit);
    };
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
    const list = listRef.current;
    const item = list?.querySelector<HTMLLIElement>(`[data-index="${activeIndex}"]`);
    if (!list || !item) return;
    // Gulir di dalam daftar saja. scrollIntoView ikut menggulir halaman, dan saat dropdown
    // baru dibuka itu membatalkan penggeseran panel di atas (panel jadi tetap terpotong).
    const itemRect = item.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    if (itemRect.top < listRect.top) list.scrollTop -= listRect.top - itemRect.top;
    else if (itemRect.bottom > listRect.bottom) list.scrollTop += itemRect.bottom - listRect.bottom;
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
        <span
          className={selected ? "truncate text-left" : "truncate text-left text-muted-foreground"}
          title={selected?.label}
        >
          {selected ? selected.label : placeholder}
        </span>
        <FiChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-card border border-border bg-card shadow-hover"
        >
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
              placeholder={searchPlaceholder}
              // text-base (16px) wajib: Safari iOS otomatis zoom saat isian di bawah 16px difokus.
              className="w-full bg-transparent py-3 text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
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
            style={{ maxHeight: listMaxHeight }}
            className="overflow-y-auto overscroll-contain py-1"
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
                  <span className="min-w-0 break-words">{option.label}</span>
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
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          <Combobox
            id={`${id}-manual-prov`}
            options={provinceOptions}
            value={value.provCode}
            placeholder="Pilih provinsi"
            searchPlaceholder="Cari provinsi..."
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
            maxLength={KOTA_MANUAL_MAX_LENGTH}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            placeholder={value.provCode ? "Tulis kota / kabupaten domisili" : "Pilih provinsi terlebih dahulu"}
            className={inputClass(Boolean(invalid))}
          />
        </div>
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
      <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
        <Combobox
          id={`${id}-prov`}
          options={provinceOptions}
          value={value.provCode}
          placeholder="Pilih provinsi"
          searchPlaceholder="Cari provinsi..."
          emptyLabel="Provinsi tidak ditemukan"
          invalid={invalid && !value.provCode}
          onSelect={handleProvince}
        />
        <Combobox
          id={id}
          options={regencyOptions}
          value={value.kotaCode}
          placeholder={value.provCode ? "Pilih kota / kabupaten" : "Pilih provinsi terlebih dahulu"}
          searchPlaceholder="Cari kota / kabupaten..."
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
