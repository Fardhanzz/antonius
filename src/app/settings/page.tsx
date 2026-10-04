'use client';

import React from 'react';
import { Settings, Smartphone, ShieldCheck, Palette, Info, Database, Layers } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Pengaturan"
        subtitle="Preferensi aplikasi & status sistem"
        backHref="/"
        rightAction={
          <Badge variant="default" icon={<Settings className="w-3 h-3 stroke-[2.5]" />}>
            MVP v1.0
          </Badge>
        }
      />

      <div className="px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* About App Card */}
        <Card variant="white" shadow="md">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-white border-2 border-[#111111] shadow-[2px_2px_0_#111111] overflow-hidden flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/antonius-favicon.png" alt="Antonius Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#111111] uppercase tracking-tight">
                ANTONIUS
              </h2>
              <span className="text-xs text-[#6F6A67] font-semibold">
                MVP v1.0 — Asisten PR & Belajar Pribadi
              </span>
            </div>
          </div>
          <p className="text-xs text-[#6F6A67] font-medium leading-relaxed">
            Asisten belajar dan pemecah soal cerdas dengan antarmuka neo-brutalist yang dioptimalkan untuk perangkat seluler.
          </p>
        </Card>

        {/* Visual System Card */}
        <Card variant="yellow" shadow="sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 stroke-[2.5] text-[#111111]" />
              <h3 className="text-xs font-black text-[#111111] uppercase tracking-wider">
                Desain Visual
              </h3>
            </div>
            <Badge variant="dark">NEO-BRUTALIST</Badge>
          </div>
          <p className="text-xs text-[#111111] font-bold leading-normal">
            Batas hitam tebal, bayangan fisik keras, sudut tumpul, dan palet warna kontras tinggi untuk keterbacaan optimal.
          </p>
        </Card>

        {/* System Status List */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-black text-[#111111] uppercase tracking-wider px-1">
            Status Layanan & Komponen
          </h3>

          <Card variant="white" shadow="sm" className="p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 stroke-[2.5] text-[#111111]" />
                <div>
                  <span className="text-xs font-black uppercase text-[#111111] block">
                    Mode Tampilan
                  </span>
                  <span className="text-[11px] text-[#6F6A67] font-medium block">
                    Mobile-First PWA Standalone
                  </span>
                </div>
              </div>
              <Badge variant="green">AKTIF</Badge>
            </div>
          </Card>

          <Card variant="white" shadow="sm" className="p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 stroke-[2.5] text-[#111111]" />
                <div>
                  <span className="text-xs font-black uppercase text-[#111111] block">
                    AI Vision & Solver (M3–M5)
                  </span>
                  <span className="text-[11px] text-[#6F6A67] font-medium block">
                    Ekstraksi Soal & Penalaran Tutor
                  </span>
                </div>
              </div>
              <Badge variant="green">AKTIF</Badge>
            </div>
          </Card>

          <Card variant="white" shadow="sm" className="p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 stroke-[2.5] text-[#111111]" />
                <div>
                  <span className="text-xs font-black uppercase text-[#111111] block">
                    Penyimpanan Riwayat (M7)
                  </span>
                  <span className="text-[11px] text-[#6F6A67] font-medium block">
                    IndexedDB Lokal Perangkat (antonius_db)
                  </span>
                </div>
              </div>
              <Badge variant="green">LOKAL</Badge>
            </div>
          </Card>

          <Card variant="white" shadow="sm" className="p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 stroke-[2.5] text-[#111111]" />
                <div>
                  <span className="text-xs font-black uppercase text-[#111111] block">
                    Sesi Tugas PR (M8)
                  </span>
                  <span className="text-[11px] text-[#6F6A67] font-medium block">
                    Manajemen Rangkaian Soal Multi-Item
                  </span>
                </div>
              </div>
              <Badge variant="green">LOKAL</Badge>
            </div>
          </Card>

          <Card variant="white" shadow="sm" className="p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 stroke-[2.5] text-[#111111]" />
                <div>
                  <span className="text-xs font-black uppercase text-[#111111] block">
                    Web Grounding (M6)
                  </span>
                  <span className="text-[11px] text-[#6F6A67] font-medium block">
                    Pencarian Google Search Grounding
                  </span>
                </div>
              </div>
              <Badge variant="yellow">TERBATAS KUOTA</Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
