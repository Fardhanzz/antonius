'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Image as ImageIcon, Sparkles, BookOpen, Clock, Layers, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { historyService } from '@/lib/history/history-service';
import { HistoryItem } from '@/lib/validation/history-schema';

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recentItems, setRecentItems] = useState<HistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    historyService
      .getAll()
      .then((items) => {
        setTotalCount(items.length);
        setRecentItems(items.slice(0, 3));
      })
      .catch((err) => {
        console.warn('Failed to load recent questions from IndexedDB:', err);
      });
  }, []);

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        try {
          sessionStorage.setItem('antonius_selected_image', dataUrl);
          sessionStorage.setItem('antonius_image_source', 'gallery');
          sessionStorage.setItem('antonius_image_name', file.name);
        } catch (err) {
          console.warn('Session storage quota exceeded:', err);
        }
        router.push('/scan?source=gallery');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="px-4 sm:px-6 pt-5 pb-6 flex flex-col gap-6">
      {/* Top Editorial Header */}
      <header className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-white border-[3px] border-[#111111] shadow-[3px_3px_0_#111111] overflow-hidden flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/antonius-favicon.png" alt="Antonius Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-[#111111] uppercase block leading-none">
              ANTONIUS
            </span>
            <span className="text-[10px] font-bold text-[#6F6A67] uppercase tracking-wider block mt-0.5">
              Tutor AI Saku
            </span>
          </div>
        </div>

        <Badge variant="yellow" icon={<Sparkles className="w-3 h-3 stroke-[2.5]" />}>
          MVP v1.0
        </Badge>
      </header>

      {/* Main Hero Card */}
      <section
        aria-labelledby="hero-heading"
        className="w-full rounded-2xl bg-white border-[3px] border-[#111111] shadow-[7px_7px_0_#111111] p-5 sm:p-6 relative overflow-hidden"
      >
        {/* Subtle decorative sticker in top right */}
        <div className="absolute -top-3 -right-3 w-16 h-16 bg-[#FFD447] border-[3px] border-[#111111] rounded-full flex items-center justify-center rotate-12 shadow-[2px_2px_0_#111111] select-none pointer-events-none">
          <span className="text-[10px] font-black uppercase tracking-tighter text-[#111111]">
            INSTAN
          </span>
        </div>

        <div className="max-w-xs">
          <div className="inline-block mb-2">
            <span className="bg-[#70C5E8] text-[#111111] border-[2px] border-[#111111] shadow-[2px_2px_0_#111111] text-[11px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
              Solusi PR Cepat
            </span>
          </div>

          <h1 id="hero-heading" className="text-3xl sm:text-4xl font-black text-[#111111] tracking-tight leading-tight">
            Ada soal?
            <br />
            <span className="bg-[#FFD447] px-2 py-0.5 border-[2px] border-[#111111] shadow-[3px_3px_0_#111111] inline-block mt-1 transform -rotate-1">
              Foto aja.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-[#6F6A67] font-medium mt-3 leading-relaxed">
            Foto soal dari buku atau layar, dan Antonius akan memandu langkah pengerjaannya sampai tuntas.
          </p>
        </div>

        {/* Primary & Secondary Call To Actions */}
        <div className="mt-6 flex flex-col gap-3">
          {/* Primary CTA - Visually Dominant Scan Button */}
          <Link href="/scan" className="w-full block">
            <Button
              variant="primary"
              size="hero"
              fullWidth
              icon={<Camera className="w-7 h-7 stroke-[2.5]" />}
              className="text-base sm:text-lg"
              aria-label="Scan Soal Sekarang"
            >
              SCAN SOAL
            </Button>
          </Link>

          {/* Hidden File Input for Gallery */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            aria-label="Pilih foto soal dari galeri"
          />

          {/* Secondary CTA - Upload from Gallery */}
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={handleGalleryClick}
            icon={<ImageIcon className="w-5 h-5 text-[#111111] stroke-[2.5]" />}
            aria-label="Upload Soal dari Galeri"
          >
            Upload dari Galeri
          </Button>
        </div>
      </section>

      {/* M8: Homework Session Entry Point */}
      <section aria-label="Sesi Tugas">
        <Link href="/sessions" className="block group">
          <div className="w-full rounded-2xl bg-[#FFF7F2] border-[3px] border-[#111111] shadow-[5px_5px_0_#111111] p-4 sm:p-5 flex items-center justify-between gap-3 group-hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#A98BE8] border-[2px] border-[#111111] shadow-[2px_2px_0_#111111] flex items-center justify-center text-[#111111] shrink-0">
                <Layers className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#111111]">
                    Sesi Tugas PR
                  </span>
                  <Badge variant="purple" className="text-[9px]">SESI</Badge>
                </div>
                <p className="text-xs text-[#6F6A67] font-bold mt-0.5">
                  Kumpulkan dan kerjakan rangkaian soal dalam satu PR
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white border-[2px] border-[#111111] flex items-center justify-center shrink-0">
              <ChevronRight className="w-5 h-5 text-[#111111]" />
            </div>
          </div>
        </Link>
      </section>

      {/* Subject Tags Strip */}
      <section aria-label="Mata Pelajaran">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          <Badge variant="blue" icon={<BookOpen className="w-3 h-3" />}>
            MATEMATIKA
          </Badge>
          <Badge variant="yellow">
            FISIKA
          </Badge>
          <Badge variant="green">
            KIMIA
          </Badge>
          <Badge variant="purple">
            BIOLOGI
          </Badge>
          <Badge variant="default">
            UMUM
          </Badge>
        </div>
      </section>

      {/* Recent Questions Section */}
      <section aria-labelledby="recent-questions-heading" className="flex flex-col gap-3">
        <SectionHeader
          title="Soal Terakhir"
          badge={
            <span className="text-[10px] font-black bg-[#111111] text-white px-2 py-0.5 rounded border border-[#111111]">
              {totalCount}
            </span>
          }
        />

        {recentItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            {recentItems.map((item) => (
              <Link
                key={item.id}
                href="/history"
                className="p-3.5 rounded-xl bg-white border-[3px] border-[#111111] shadow-[3px_3px_0_#111111] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-transform flex flex-col gap-2 group block"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.subject && (
                      <Badge variant="blue" className="text-[9px]">
                        {item.subject}
                      </Badge>
                    )}
                    <Badge variant="green" icon={<CheckCircle2 className="w-3 h-3" />} className="text-[9px]">
                      SELESAI
                    </Badge>
                  </div>
                  <span className="text-[10px] font-bold text-[#6F6A67]">
                    {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#111111] line-clamp-2 leading-snug">
                  {item.questionText}
                </p>
                <div className="text-[11px] font-extrabold text-[#D94336] bg-[#FFF7F2] px-2 py-1 rounded-md border border-[#111111] truncate">
                  Jawaban: {item.finalAnswer}
                </div>
              </Link>
            ))}

            <Link href="/history" className="w-full block pt-1">
              <Button variant="secondary" size="sm" fullWidth>
                LIHAT SEMUA RIWAYAT ({totalCount})
              </Button>
            </Link>
          </div>
        ) : (
          <EmptyState
            title="Belum ada soal."
            description="Foto soal pertamamu dan biarkan Antonius bekerja."
            icon={<Clock className="w-8 h-8 stroke-[2.5]" />}
            action={
              <Link href="/scan" className="w-full sm:w-auto inline-block">
                <Button
                  variant="primary"
                  size="md"
                  icon={<Camera className="w-5 h-5 stroke-[2.5]" />}
                >
                  Pindai Soal Pertama
                </Button>
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
