import type { ReactElement } from "react";

export interface IMenuItem {
    text: string;
    url: string;
}

export interface IBenefit {
    title: string;
    description: string;
    icon: ReactElement;
}

export interface IGalleryPhoto {
    src: string;
    alt: string;
    /** Keterangan singkat yang tampil di bawah foto. */
    caption: string;
    width: number;
    height: number;
}

export interface ILogo {
    /** Deskripsi logo untuk pembaca layar (dipakai bila tidak ada teks di sebelahnya). */
    alt: string;
    /** Path di public/, mis. "/images/logo/smadarun.png". Kosong = logo tidak ditampilkan. */
    src?: string;
    /** Dimensi asli file (piksel). Wajib bila `src` diisi, supaya proporsi tidak berubah. */
    width?: number;
    height?: number;
}

export interface IFlyer {
    /** Nama flyer; tampil sebagai keterangan di bawah gambar. */
    title: string;
    /** Deskripsi gambar untuk pembaca layar. Bila kosong dipakai `title`. */
    alt?: string;
    /** Path di public/, mis. "/images/flyer/rute.jpg". Kosongkan = tampil kotak "segera hadir". */
    src?: string;
    /** Dimensi asli file (piksel). Wajib bila `src` diisi, supaya proporsi tidak berubah. */
    width?: number;
    height?: number;
}

export interface IPricing {
    name: string;
    price: number | string;
    features: string[];
}

export interface IFAQ {
    question: string;
    answer: string;
}

export interface ITestimonial {
    name: string;
    role: string;
    message: string;
    avatar: string;
}

export interface IStats {
    title: string;
    description: string;
}

export interface ISocials {
    facebook?: string;
    github?: string;
    instagram?: string;
    linkedin?: string;
    threads?: string;
    twitter?: string;
    youtube?: string;
    x?: string;
    [key: string]: string | undefined;
}
