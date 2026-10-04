'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  CheckCircle2,
  Trash2,
  ArrowLeft,
  Camera,
  Layers,
  AlertTriangle,
  X,
  Loader2,
  ChevronRight,
  ShieldCheck,
  FileQuestion,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { sessionService } from '@/lib/session/session-service';
import { SessionWithItems, HomeworkSession } from '@/lib/session/session-types';
import { HistoryItem } from '@/lib/validation/history-schema';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionWithItems[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Active selected session for detail view
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<SessionWithItems | null>(null);

  // Create session modal state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createTitle, setCreateTitle] = useState<string>('');
  const [createSubject, setCreateSubject] = useState<string>('');
  const [createTopic, setCreateTopic] = useState<string>('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Modals for confirmation
  const [sessionToDelete, setSessionToDelete] = useState<HomeworkSession | null>(null);
  const [sessionToComplete, setSessionToComplete] = useState<HomeworkSession | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Modal to inspect full question detail from a session
  const [questionDetailItem, setQuestionDetailItem] = useState<HistoryItem | null>(null);

  // Load all sessions and their items
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setStorageError(null);
    try {
      const rawSessions = await sessionService.getAll();
      const enriched: SessionWithItems[] = [];
      for (const s of rawSessions) {
        const withItems = await sessionService.getSessionWithItems(s.id);
        if (withItems) {
          enriched.push(withItems);
        }
      }
      setSessions(enriched);

      // If user had a selected session, refresh it
      if (selectedSessionId) {
        const current = enriched.find((s) => s.id === selectedSessionId);
        setSelectedSessionDetail(current || null);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setStorageError('Gagal memuat sesi tugas dari penyimpanan perangkat.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Handle URL query param for deep linking (e.g. /sessions?selected=<id>)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const selId = params.get('selected');
      if (selId) {
        setSelectedSessionId(selId);
      }
    }
  }, []);

  // Update selected session detail when selectedSessionId changes
  useEffect(() => {
    if (selectedSessionId) {
      sessionService.getSessionWithItems(selectedSessionId).then((res) => {
        setSelectedSessionDetail(res);
      });
    } else {
      setSelectedSessionDetail(null);
    }
  }, [selectedSessionId]);

  // Create new session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = createTitle.trim();
    if (!trimmedTitle) {
      setCreateError('Judul sesi wajib diisi.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      const newSession = await sessionService.createSession({
        title: trimmedTitle,
        subject: createSubject.trim() || null,
        topic: createTopic.trim() || null,
      });

      setIsCreateOpen(false);
      setCreateTitle('');
      setCreateSubject('');
      setCreateTopic('');
      await loadSessions();

      // Open new session detail directly
      setSelectedSessionId(newSession.id);
    } catch (err) {
      console.error('Create session error:', err);
      setCreateError('Gagal membuat sesi tugas. Silakan coba lagi.');
    } finally {
      setIsCreating(false);
    }
  };

  // Delete session
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsActionLoading(true);
    try {
      await sessionService.delete(sessionToDelete.id);
      if (selectedSessionId === sessionToDelete.id) {
        setSelectedSessionId(null);
      }
      setSessionToDelete(null);
      await loadSessions();
    } catch (err) {
      console.error('Delete session error:', err);
      setStorageError('Gagal menghapus sesi tugas.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Toggle complete / reopen status
  const handleToggleStatus = async (session: HomeworkSession, targetStatus: 'active' | 'completed') => {
    setIsActionLoading(true);
    try {
      await sessionService.setSessionStatus(session.id, targetStatus);
      setSessionToComplete(null);
      await loadSessions();
    } catch (err) {
      console.error('Status update error:', err);
      setStorageError('Gagal mengubah status sesi.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Safe Indonesian date formatter
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

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="SESI TUGAS"
        subtitle="Kerjakan satu rangkaian soal dalam satu sesi PR."
        backHref="/"
        rightAction={
          <Button
            variant="accent-yellow"
            size="sm"
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            onClick={() => {
              setCreateError(null);
              setIsCreateOpen(true);
            }}
          >
            BUAT SESI
          </Button>
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
              onClick={loadSessions}
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
              Memuat sesi tugas kamu...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && sessions.length === 0 && !storageError && (
          <EmptyState
            title="Belum ada sesi."
            description="Pisahkan tugas kamu jadi beberapa sesi biar lebih gampang dikerjakan."
            icon={<Layers className="w-8 h-8 stroke-[2.5]" />}
            action={
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-5 h-5 stroke-[2.5]" />}
                onClick={() => {
                  setCreateError(null);
                  setIsCreateOpen(true);
                }}
              >
                BUAT SESI
              </Button>
            }
          />
        )}

        {/* ========================================================================= */}
        {/* SESSION LIST VIEW */}
        {/* ========================================================================= */}
        {!isLoading && sessions.length > 0 && !selectedSessionDetail && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase text-[#6F6A67] tracking-wider">
                Total: {sessions.length} Sesi
              </span>
            </div>

            <div className="flex flex-col gap-3.5">
              {sessions.map((session) => {
                const isCompleted = session.status === 'completed';
                const total = session.progress.totalItems;
                const solved = session.progress.solvedCount;

                return (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className="p-5 rounded-2xl bg-white border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-transform cursor-pointer flex flex-col gap-3"
                  >
                    {/* Top Badges & Status */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isCompleted ? (
                          <Badge variant="dark" icon={<CheckCircle2 className="w-3 h-3 text-[#A8E063]" />} className="text-[10px]">
                            SELESAI
                          </Badge>
                        ) : (
                          <Badge variant="green" className="text-[10px]">
                            AKTIF
                          </Badge>
                        )}
                        {session.subject && (
                          <Badge variant="blue" className="text-[10px]">
                            {session.subject}
                          </Badge>
                        )}
                        {session.topic && (
                          <Badge variant="purple" className="text-[10px]">
                            {session.topic}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-[#6F6A67]">
                        {formatDate(session.updatedAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-black text-[#111111] uppercase tracking-tight">
                      {session.title}
                    </h3>

                    {/* Progress Info */}
                    <div className="bg-[#FFF7F2] p-3 rounded-xl border-[2px] border-[#111111] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-[#111111]">
                          {total > 0 ? `${solved} / ${total} SOAL SELESAI` : 'BELUM ADA SOAL'}
                        </span>
                        {total > 0 && (
                          <span className="text-xs font-black text-[#D94336]">
                            {session.progress.percentage}%
                          </span>
                        )}
                      </div>

                      {/* Accessible Progress Bar */}
                      {total > 0 && (
                        <div
                          role="progressbar"
                          aria-valuenow={session.progress.percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          className="w-full h-3 bg-white rounded-full border-[2px] border-[#111111] overflow-hidden"
                        >
                          <div
                            className="h-full bg-[#A8E063] transition-all duration-300"
                            style={{ width: `${session.progress.percentage}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold text-[#6F6A67] flex items-center gap-1">
                        Buka Detail <ChevronRight className="w-3.5 h-3.5" />
                      </span>

                      {!isCompleted && (
                        <Link
                          href={`/scan?session=${session.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-block"
                        >
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<Camera className="w-4 h-4 stroke-[2.5]" />}
                          >
                            LANJUTKAN
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SESSION DETAIL VIEW */}
        {/* ========================================================================= */}
        {selectedSessionDetail && (
          <div className="flex flex-col gap-6">
            {/* Top Navigation for Detail */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowLeft className="w-4 h-4 stroke-[2.5]" />}
                onClick={() => setSelectedSessionId(null)}
              >
                KEMBALI KE SESI
              </Button>

              <div className="flex items-center gap-2">
                {selectedSessionDetail.status === 'active' ? (
                  <Button
                    variant="accent-green"
                    size="sm"
                    icon={<CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                    onClick={() => setSessionToComplete(selectedSessionDetail)}
                  >
                    SELESAI SESI
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RotateCcw className="w-4 h-4 stroke-[2.5]" />}
                    onClick={() => handleToggleStatus(selectedSessionDetail, 'active')}
                  >
                    BUKA LAGI
                  </Button>
                )}

                <button
                  type="button"
                  aria-label="Hapus sesi ini"
                  onClick={() => setSessionToDelete(selectedSessionDetail)}
                  className="px-3 py-2 min-h-[44px] rounded-xl border-[2px] border-[#111111] bg-white hover:bg-[#FFF0EF] text-[#D94336] font-bold text-xs flex items-center gap-1 shadow-[2px_2px_0_#111111] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Session Header Card */}
            <Card variant="white" shadow="md">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedSessionDetail.status === 'completed' ? (
                    <Badge variant="dark" icon={<CheckCircle2 className="w-3 h-3 text-[#A8E063]" />}>
                      SELESAI
                    </Badge>
                  ) : (
                    <Badge variant="green">AKTIF</Badge>
                  )}
                  {selectedSessionDetail.subject && (
                    <Badge variant="blue">{selectedSessionDetail.subject}</Badge>
                  )}
                  {selectedSessionDetail.topic && (
                    <Badge variant="purple">{selectedSessionDetail.topic}</Badge>
                  )}
                </div>
                <span className="text-xs font-bold text-[#6F6A67]">
                  {formatDate(selectedSessionDetail.updatedAt)}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#111111] uppercase tracking-tight mt-1">
                {selectedSessionDetail.title}
              </h2>

              {/* Progress Box */}
              <div className="mt-4 p-4 rounded-xl bg-[#FFF7F2] border-[2px] border-[#111111] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black uppercase text-[#111111]">
                    {selectedSessionDetail.progress.totalItems > 0
                      ? `${selectedSessionDetail.progress.solvedCount} / ${selectedSessionDetail.progress.totalItems} SOAL SELESAI`
                      : 'BELUM ADA SOAL DI SESI INI'}
                  </span>
                  {selectedSessionDetail.progress.totalItems > 0 && (
                    <span className="text-xs sm:text-sm font-black text-[#D94336]">
                      {selectedSessionDetail.progress.percentage}%
                    </span>
                  )}
                </div>

                {selectedSessionDetail.progress.totalItems > 0 && (
                  <div
                    role="progressbar"
                    aria-valuenow={selectedSessionDetail.progress.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="w-full h-3.5 bg-white rounded-full border-[2px] border-[#111111] overflow-hidden"
                  >
                    <div
                      className="h-full bg-[#A8E063] transition-all duration-300"
                      style={{ width: `${selectedSessionDetail.progress.percentage}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Primary Action Button to Scan into this Session */}
              <div className="mt-5">
                <Link
                  href={`/scan?session=${selectedSessionDetail.id}`}
                  className="w-full block"
                >
                  <Button
                    variant="primary"
                    size="hero"
                    fullWidth
                    icon={<Camera className="w-6 h-6 stroke-[2.5]" />}
                  >
                    LANJUTKAN SESI
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Questions List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-black uppercase text-[#111111] tracking-wider px-1">
                Daftar Soal Dalam Sesi ({selectedSessionDetail.items.length})
              </h3>

              {selectedSessionDetail.items.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] text-center flex flex-col items-center gap-3">
                  <p className="text-xs sm:text-sm font-bold text-[#6F6A67]">
                    Belum ada soal di sesi ini. Tekan &quot;LANJUTKAN SESI&quot; untuk scan soal pertama kamu.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedSessionDetail.items.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => setQuestionDetailItem(item)}
                      className="p-4 rounded-xl bg-white border-[3px] border-[#111111] shadow-[3px_3px_0_#111111] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-transform cursor-pointer flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-[#FFD447] border-[2px] border-[#111111] text-xs font-black flex items-center justify-center text-[#111111]">
                            {idx + 1}
                          </span>
                          <Badge variant="green" className="text-[10px]">
                            TERPECAHKAN
                          </Badge>
                        </div>
                        <span className="text-[10px] font-bold text-[#6F6A67]">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-extrabold text-[#111111] line-clamp-2">
                        {item.questionText}
                      </p>

                      <div className="bg-[#FFF7F2] p-2 rounded-lg border-[2px] border-[#111111] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-[10px] font-black uppercase text-[#6F6A67] shrink-0">
                            Jawaban:
                          </span>
                          <span className="text-xs font-extrabold text-[#D94336] truncate">
                            {item.finalAnswer}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#6F6A67] shrink-0">
                          Lihat Detail &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE SESSION */}
      {/* ========================================================================= */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-white border-[4px] border-[#111111] rounded-2xl p-5 shadow-[6px_6px_0_#111111] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#FFD447] border-[2px] border-[#111111] flex items-center justify-center text-[#111111] shrink-0">
                <Layers className="w-5 h-5 stroke-[2.5]" />
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-[#6F6A67] hover:text-[#111111] min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-[#111111] uppercase">
                Buat Sesi Tugas Baru
              </h3>
              <p className="text-xs text-[#6F6A67] font-medium mt-1">
                Kumpulkan beberapa soal dalam satu PR agar mudah dilanjutkan.
              </p>
            </div>

            <form onSubmit={handleCreateSession} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-black uppercase text-[#111111] block mb-1">
                  Judul Sesi <span className="text-[#D94336]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: PR Matematika Bab 3"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-[2px] border-[#111111] text-sm font-bold text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#FFD447] min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-[#111111] block mb-1">
                  Mata Pelajaran <span className="text-[10px] text-[#6F6A67] font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: Matematika / Fisika"
                  value={createSubject}
                  onChange={(e) => setCreateSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-[2px] border-[#111111] text-sm font-bold text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#FFD447] min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-[#111111] block mb-1">
                  Topik / Bab <span className="text-[10px] text-[#6F6A67] font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: Persamaan Kuadrat"
                  value={createTopic}
                  onChange={(e) => setCreateTopic(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-[2px] border-[#111111] text-sm font-bold text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#FFD447] min-h-[44px]"
                />
              </div>

              {createError && (
                <p className="text-xs font-bold text-[#D94336]">{createError}</p>
              )}

              <div className="flex gap-2.5 pt-2">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  disabled={isCreating}
                  onClick={() => setIsCreateOpen(false)}
                >
                  BATAL
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  type="submit"
                  disabled={isCreating}
                >
                  {isCreating ? 'MEMBUAT...' : 'MULAI SESI'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COMPLETE SESSION CONFIRMATION */}
      {/* ========================================================================= */}
      {sessionToComplete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-white border-[4px] border-[#111111] rounded-2xl p-5 shadow-[6px_6px_0_#111111] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] border-[2px] border-[#111111] flex items-center justify-center text-[#2E7D32] shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setSessionToComplete(null)}
                className="p-1 rounded-lg text-[#6F6A67] hover:text-[#111111] min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-[#111111] uppercase">
                Selesai mengerjakan sesi ini?
              </h3>
              <p className="text-xs text-[#6F6A67] font-medium mt-1 leading-relaxed">
                Sesi ini akan ditandai selesai. Kamu tetap bisa membuka atau melanjutkannya kapan saja.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                disabled={isActionLoading}
                onClick={() => setSessionToComplete(null)}
              >
                BATAL
              </Button>
              <Button
                variant="accent-green"
                size="md"
                fullWidth
                disabled={isActionLoading}
                onClick={() => handleToggleStatus(sessionToComplete, 'completed')}
              >
                {isActionLoading ? 'PROSES...' : 'SELESAI'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE SESSION CONFIRMATION */}
      {/* ========================================================================= */}
      {sessionToDelete && (
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
                onClick={() => setSessionToDelete(null)}
                className="p-1 rounded-lg text-[#6F6A67] hover:text-[#111111] min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-[#111111] uppercase">
                Hapus sesi ini?
              </h3>
              <p className="text-xs text-[#6F6A67] font-medium mt-1 leading-relaxed">
                Riwayat soal di dalam sesi tidak ikut terhapus. Hanya grup sesi ini yang akan dihapus.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                disabled={isActionLoading}
                onClick={() => setSessionToDelete(null)}
              >
                BATAL
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                disabled={isActionLoading}
                onClick={handleDeleteSession}
              >
                {isActionLoading ? 'MENGHAPUS...' : 'HAPUS SESI'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUESTION DETAIL INSPECTION (FROM SESSION) */}
      {/* ========================================================================= */}
      {questionDetailItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg bg-white border-[4px] border-[#111111] rounded-2xl p-5 shadow-[6px_6px_0_#111111] flex flex-col gap-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {questionDetailItem.subject && (
                  <Badge variant="blue" className="text-[10px]">
                    {questionDetailItem.subject}
                  </Badge>
                )}
                <Badge variant="green" className="text-[10px]">
                  TERPECAHKAN
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => setQuestionDetailItem(null)}
                className="p-1 rounded-lg text-[#6F6A67] hover:text-[#111111] min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase text-[#6F6A67] tracking-wider mb-1 flex items-center gap-1">
                <FileQuestion className="w-3.5 h-3.5" />
                Pertanyaan
              </h4>
              <p className="p-3 rounded-xl bg-[#FFF7F2] border-[2px] border-[#111111] text-xs sm:text-sm font-bold text-[#111111] whitespace-pre-wrap">
                {questionDetailItem.questionText}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FFD447] border-[2px] border-[#111111] flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-[#111111]">
                Jawaban Akhir
              </span>
              <p className="text-base sm:text-lg font-black text-[#111111]">
                {questionDetailItem.finalAnswer}
              </p>
            </div>

            {questionDetailItem.explanation && (
              <div>
                <h4 className="text-xs font-black uppercase text-[#6F6A67] tracking-wider mb-1">
                  Penjelasan
                </h4>
                <p className="text-xs text-[#111111] leading-relaxed">
                  {questionDetailItem.explanation}
                </p>
              </div>
            )}

            {questionDetailItem.steps && questionDetailItem.steps.length > 0 && (
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-black uppercase text-[#111111] tracking-wider">
                  Langkah-Langkah ({questionDetailItem.steps.length})
                </h4>
                {questionDetailItem.steps.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white border-[2px] border-[#111111] text-xs flex flex-col gap-1"
                  >
                    <span className="font-black text-[#111111]">
                      {idx + 1}. {st.title}
                    </span>
                    <p className="text-[#6F6A67]">{st.explanation}</p>
                    {st.formula && (
                      <div className="font-mono bg-[#FFF7F2] p-1.5 rounded border border-[#111111]">
                        {st.formula}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {questionDetailItem.verification && (
              <div className="p-3 rounded-xl bg-[#E8F8EE] border-[2px] border-[#111111] text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2E7D32] shrink-0" />
                <span className="font-bold text-[#111111]">
                  {questionDetailItem.verification.explanation}
                </span>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => setQuestionDetailItem(null)}
              >
                TUTUP DETAIL
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
