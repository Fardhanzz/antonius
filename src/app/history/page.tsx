'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Clock,
  Camera,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Globe,
  Loader2,
  X,
  FileQuestion,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { HistoryItem } from '@/lib/validation/history-schema';
import { historyService } from '@/lib/history/history-service';

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Selected item for full detail view
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  // Confirmation dialog states
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load history on mount
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setStorageError(null);
    try {
      const records = await historyService.getAll();
      setItems(records);
    } catch (err) {
      console.error('Failed to load history items:', err);
      setStorageError('Gagal memuat riwayat dari penyimpanan lokal perangkat.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Handle single item deletion
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const success = await historyService.delete(itemToDelete.id);
      if (success) {
        setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
        if (selectedItem?.id === itemToDelete.id) {
          setSelectedItem(null);
        }
        setItemToDelete(null);
      } else {
        setStorageError('Gagal menghapus riwayat soal.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setStorageError('Terjadi kendala saat menghapus item riwayat.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle clear all history
  const handleClearAll = async () => {
    setIsDeleting(true);
    try {
      const success = await historyService.clear();
      if (success) {
        setItems([]);
        setSelectedItem(null);
        setShowClearAllDialog(false);
      } else {
        setStorageError('Gagal membersihkan seluruh riwayat soal.');
      }
    } catch (err) {
      console.error('Clear all error:', err);
      setStorageError('Terjadi kendala saat membersihkan seluruh riwayat.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Safe date formatter for Indonesian locale
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Safe external URL validator for M6 citations
  const isSafeUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="RIWAYAT SOAL"
        subtitle="Semua soal yang pernah Antonius bantu."
        backHref="/"
        rightAction={
          <Badge variant="yellow">
            {items.length} SOAL
          </Badge>
        }
      />

      <div className="px-4 sm:px-6 py-6 flex flex-col gap-6 max-w-3xl mx-auto w-full">
        {/* Storage Error Alert */}
        {storageError && (
          <div className="p-4 rounded-xl bg-[#FFF0EF] border-[3px] border-[#D94336] shadow-[3px_3px_0_#111111] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#D94336] shrink-0" />
              <p className="text-xs sm:text-sm font-bold text-[#D94336]">{storageError}</p>
            </div>
            <button
              type="button"
              onClick={loadHistory}
              className="text-xs font-black underline uppercase text-[#111111] hover:text-[#D94336] shrink-0 min-h-[44px] px-2 flex items-center"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-8 rounded-2xl bg-white border-[3px] border-[#111111] shadow-[5px_5px_0_#111111] flex flex-col items-center justify-center text-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#D94336]" />
            <p className="text-sm font-black text-[#111111] uppercase tracking-wide">
              Memuat riwayat soal kamu...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && !storageError && (
          <EmptyState
            title="Belum ada riwayat."
            description="Foto soal pertama kamu, lalu jawabannya bakal nongol di sini."
            icon={<Clock className="w-8 h-8 stroke-[2.5]" />}
            action={
              <Link href="/scan" className="w-full sm:w-auto inline-block">
                <Button
                  variant="primary"
                  size="md"
                  icon={<Camera className="w-5 h-5 stroke-[2.5]" />}
                >
                  SCAN SOAL
                </Button>
              </Link>
            }
          />
        )}

        {/* History List View */}
        {!isLoading && items.length > 0 && !selectedItem && (
          <div className="flex flex-col gap-4">
            {/* Top Action Bar (Clear All trigger) */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase text-[#6F6A67] tracking-wider">
                Total Tersimpan: {items.length} Soal
              </span>
              <button
                type="button"
                onClick={() => setShowClearAllDialog(true)}
                className="text-xs font-black uppercase tracking-wider text-[#6F6A67] hover:text-[#D94336] transition-colors flex items-center gap-1.5 py-2 px-2.5 rounded-lg border-2 border-transparent hover:border-[#111111] hover:bg-white min-h-[44px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                HAPUS SEMUA RIWAYAT
              </button>
            </div>

            {/* List Cards */}
            <div className="flex flex-col gap-3.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="p-4 sm:p-5 rounded-2xl bg-white border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-transform cursor-pointer flex flex-col gap-3 group"
                >
                  {/* Top Badges & Date */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.subject && (
                        <Badge variant="blue" className="text-[10px]">
                          {item.subject}
                        </Badge>
                      )}
                      {item.topic && (
                        <Badge variant="purple" className="text-[10px]">
                          {item.topic}
                        </Badge>
                      )}
                      {item.source === 'grounded' && item.citations.length > 0 ? (
                        <Badge variant="green" icon={<Globe className="w-3 h-3" />} className="text-[10px]">
                          WEB
                        </Badge>
                      ) : (
                        <Badge variant="green" icon={<CheckCircle2 className="w-3 h-3" />} className="text-[10px]">
                          TERPECAHKAN
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-[#6F6A67]">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {/* Question Snippet */}
                  <div>
                    <p className="text-sm font-extrabold text-[#111111] line-clamp-2 leading-snug">
                      {item.questionText}
                    </p>
                  </div>

                  {/* Final Answer Snippet */}
                  <div className="bg-[#FFF7F2] p-2.5 rounded-xl border-[2px] border-[#111111] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-xs font-black uppercase text-[#6F6A67] shrink-0">
                        Jawaban:
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-[#D94336] truncate">
                        {item.finalAnswer}
                      </span>
                    </div>

                    {/* Single Delete Action */}
                    <button
                      type="button"
                      aria-label="Hapus soal ini"
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete(item);
                      }}
                      className="p-2 text-[#6F6A67] hover:text-[#D94336] hover:bg-[#FFE8E6] rounded-lg transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center border border-transparent hover:border-[#111111]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Detail View */}
        {selectedItem && (
          <div className="flex flex-col gap-6">
            {/* Top Navigation for Detail */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowLeft className="w-4 h-4 stroke-[2.5]" />}
                onClick={() => setSelectedItem(null)}
              >
                KEMBALI KE DAFTAR
              </Button>

              <button
                type="button"
                onClick={() => setItemToDelete(selectedItem)}
                className="px-3.5 py-2 min-h-[44px] rounded-xl border-[2px] border-[#111111] bg-white hover:bg-[#FFF0EF] text-[#D94336] font-bold text-xs flex items-center gap-1.5 shadow-[2px_2px_0_#111111] active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                HAPUS
              </button>
            </div>

            {/* Question Card */}
            <Card variant="white" shadow="md">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedItem.subject && (
                    <Badge variant="blue">{selectedItem.subject}</Badge>
                  )}
                  {selectedItem.topic && (
                    <Badge variant="purple">{selectedItem.topic}</Badge>
                  )}
                  {selectedItem.questionType && (
                    <Badge variant="yellow">{selectedItem.questionType}</Badge>
                  )}
                </div>
                <span className="text-xs font-bold text-[#6F6A67]">
                  {formatDate(selectedItem.createdAt)}
                </span>
              </div>

              <h2 className="text-xs font-black uppercase text-[#6F6A67] tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileQuestion className="w-4 h-4" />
                Pertanyaan
              </h2>
              <div className="p-3.5 rounded-xl bg-[#FFF7F2] border-[2px] border-[#111111] text-sm sm:text-base font-extrabold text-[#111111] leading-relaxed whitespace-pre-wrap">
                {selectedItem.questionText}
              </div>
            </Card>

            {/* Final Answer Card */}
            <Card variant="yellow" shadow="md">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#111111]" />
                  Jawaban Akhir
                </span>
                <Badge variant="dark" className="text-[10px]">
                  {selectedItem.answerType}
                </Badge>
              </div>

              <div className="text-lg sm:text-2xl font-black text-[#111111] break-words">
                {selectedItem.finalAnswer}
              </div>
            </Card>

            {/* Explanation Card */}
            {selectedItem.explanation && (
              <Card variant="white" shadow="md">
                <h3 className="text-xs font-black uppercase text-[#6F6A67] tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  Penjelasan Konseptual
                </h3>
                <p className="text-xs sm:text-sm text-[#111111] font-medium leading-relaxed whitespace-pre-wrap">
                  {selectedItem.explanation}
                </p>
              </Card>
            )}

            {/* Steps Section */}
            {selectedItem.steps && selectedItem.steps.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-black uppercase text-[#111111] tracking-wider px-1">
                  Langkah-Langkah Pengerjaan ({selectedItem.steps.length} Langkah)
                </h3>
                {selectedItem.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white border-[3px] border-[#111111] shadow-[3px_3px_0_#111111] flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#FFD447] border-[2px] border-[#111111] text-xs font-black flex items-center justify-center text-[#111111] shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-[#111111]">
                        {step.title}
                      </h4>
                    </div>

                    <p className="text-xs sm:text-sm text-[#111111] font-medium leading-relaxed pl-8">
                      {step.explanation}
                    </p>

                    {step.formula && (
                      <div className="ml-8 p-2 rounded-lg bg-[#FFF7F2] border-[2px] border-[#111111] text-xs font-mono font-bold text-[#111111] overflow-x-auto">
                        {step.formula}
                      </div>
                    )}

                    {step.result && (
                      <div className="ml-8 text-xs font-bold text-[#6F6A67]">
                        Hasil: <span className="text-[#111111]">{step.result}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Verification Card */}
            {selectedItem.verification && (
              <div className="p-4 rounded-xl bg-[#E8F8EE] border-[3px] border-[#111111] shadow-[3px_3px_0_#111111] flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#2E7D32] shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#2E7D32]">
                      Verifikasi Kebenaran
                    </span>
                  </div>
                  {selectedItem.verification.result && (
                    <Badge
                      variant={selectedItem.verification.result === 'passed' ? 'green' : 'yellow'}
                      className="text-[10px]"
                    >
                      {selectedItem.verification.result.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[#111111] font-medium leading-relaxed pl-7">
                  {selectedItem.verification.explanation}
                </p>
              </div>
            )}

            {/* M6 Citations Section (rendered ONLY if citations exist) */}
            {selectedItem.citations && selectedItem.citations.length > 0 && (
              <Card variant="canvas" shadow="md">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-[#70C5E8] shrink-0" />
                  <h3 className="text-xs font-black uppercase text-[#111111] tracking-wider">
                    Sumber & Referensi Web
                  </h3>
                </div>

                <div className="flex flex-col gap-2">
                  {selectedItem.citations.map((cite, idx) => {
                    const safe = isSafeUrl(cite.url);
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white border-[2px] border-[#111111] flex items-center justify-between gap-3"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-[#111111] truncate">
                            {cite.title || 'Sumber Web'}
                          </span>
                          <span className="text-[10px] text-[#6F6A67] truncate">
                            {cite.domain || cite.url}
                          </span>
                        </div>
                        {safe ? (
                          <a
                            href={cite.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-[#FFD447] border-[2px] border-[#111111] text-[#111111] hover:bg-[#F0C433] min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                            aria-label={`Buka tautan ${cite.title}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-[#6F6A67] font-bold">
                            Tautan tidak valid
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Follow-Up Chat History (M5) */}
            {selectedItem.followUpMessages && selectedItem.followUpMessages.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1">
                  <MessageSquare className="w-4 h-4 text-[#A98BE8]" />
                  <h3 className="text-xs font-black uppercase text-[#111111] tracking-wider">
                    Riwayat Tanya Tutor ({selectedItem.followUpMessages.length} Pesan)
                  </h3>
                </div>

                <div className="flex flex-col gap-2.5">
                  {selectedItem.followUpMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border-[2px] border-[#111111] ${
                        msg.role === 'user'
                          ? 'bg-[#FFF7F2] ml-4 text-right'
                          : 'bg-white mr-4 text-left shadow-[2px_2px_0_#111111]'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#6F6A67] block mb-1">
                        {msg.role === 'user' ? 'Kamu' : 'Antonius'}
                      </span>
                      <p className="text-xs sm:text-sm text-[#111111] font-medium whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Single Item Delete Confirmation Dialog */}
      {itemToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-white border-[4px] border-[#111111] rounded-2xl p-5 shadow-[6px_6px_0_#111111] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#FFE8E6] border-[2px] border-[#111111] flex items-center justify-center text-[#D94336] shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="p-1 rounded-lg text-[#6F6A67] hover:text-[#111111] min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-[#111111] uppercase">
                Hapus riwayat soal ini?
              </h3>
              <p className="text-xs text-[#6F6A67] font-medium mt-1 leading-relaxed">
                Soal ini akan dihapus permanen dari penyimpanan lokal perangkat kamu.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                disabled={isDeleting}
                onClick={() => setItemToDelete(null)}
              >
                BATAL
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                disabled={isDeleting}
                onClick={handleDeleteItem}
              >
                {isDeleting ? 'MENGHAPUS...' : 'HAPUS'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Dialog */}
      {showClearAllDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-white border-[4px] border-[#111111] rounded-2xl p-5 shadow-[6px_6px_0_#111111] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#FFE8E6] border-[2px] border-[#111111] flex items-center justify-center text-[#D94336] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowClearAllDialog(false)}
                className="p-1 rounded-lg text-[#6F6A67] hover:text-[#111111] min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-[#111111] uppercase">
                Hapus semua riwayat soal?
              </h3>
              <p className="text-xs text-[#6F6A67] font-medium mt-1 leading-relaxed">
                Semua riwayat di perangkat ini akan dihapus. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                disabled={isDeleting}
                onClick={() => setShowClearAllDialog(false)}
              >
                BATAL
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                disabled={isDeleting}
                onClick={handleClearAll}
              >
                {isDeleting ? 'MENGHAPUS...' : 'HAPUS SEMUA'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
