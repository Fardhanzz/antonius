'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Camera,
  Image as ImageIcon,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Edit3,
  HelpCircle,
  FileQuestion,
  Loader2,
  Copy,
  CheckCheck,
  BookOpen,
  ShieldCheck,
  Send,
  MessageSquare,
  Bot,
  User,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ExtractedQuestion, ExtractApiResponse } from '@/lib/validation/question-schema';
import { SolverOutput, SolveApiResponse } from '@/lib/validation/solver-schema';
import { FollowUpMessage, FollowUpApiResponse } from '@/lib/validation/followup-schema';
import { GroundedSearchResult, GroundingApiResponse } from '@/lib/validation/grounding-schema';
import { historyService } from '@/lib/history/history-service';
import { sessionService } from '@/lib/session/session-service';
import { HomeworkSession } from '@/lib/validation/session-schema';

type ScannerMode =
  | 'idle'
  | 'camera'
  | 'preview'
  | 'processing'
  | 'identified'
  | 'clarification'
  | 'error'
  | 'solving'
  | 'solved';

interface ImageInfo {
  url: string;
  source: 'camera' | 'gallery';
  file?: File | Blob;
  sizeBytes?: number;
  width?: number;
  height?: number;
}

export default function ScanPage() {
  const [mode, setMode] = useState<ScannerMode>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [extractedQuestion, setExtractedQuestion] = useState<ExtractedQuestion | null>(null);
  const [solverResult, setSolverResult] = useState<SolverOutput | null>(null);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [copiedAnswer, setCopiedAnswer] = useState<boolean>(false);

  // M5 Follow-up conversation state
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState<string>('');
  const [isSendingFollowUp, setIsSendingFollowUp] = useState<boolean>(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [followUpClarification, setFollowUpClarification] = useState<string | null>(null);

  // M6 Web Grounding state
  const [groundedResult, setGroundedResult] = useState<GroundedSearchResult | null>(null);
  const [isGrounding, setIsGrounding] = useState<boolean>(false);
  const [groundingError, setGroundingError] = useState<string | null>(null);

  // Editable question state for confirmation UI
  const [isEditingQuestion, setIsEditingQuestion] = useState<boolean>(false);
  const [editedQuestionText, setEditedQuestionText] = useState<string>('');
  const activeHistoryIdRef = useRef<string | null>(null);

  // M8: Active Homework Session state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<HomeworkSession | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeUrlRef = useRef<string | null>(null);

  // Helper to safely revoke object URLs to prevent memory leaks
  const revokeActiveUrl = useCallback(() => {
    if (activeUrlRef.current && activeUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
  }, []);

  // Stop camera tracks and release hardware
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStartingCamera(false);
  }, []);

  // Check if an image was passed from Home page via gallery on mount
  useEffect(() => {
    try {
      const storedImage = sessionStorage.getItem('antonius_selected_image');
      const storedSource = sessionStorage.getItem('antonius_image_source') as 'camera' | 'gallery';
      if (storedImage) {
        setImageInfo({
          url: storedImage,
          source: storedSource || 'gallery',
        });
        activeUrlRef.current = storedImage;
        setMode('preview');
        sessionStorage.removeItem('antonius_selected_image');
        sessionStorage.removeItem('antonius_image_source');
      }

      // M8: Load active session context from query parameter
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const sessParam = urlParams.get('session');
        if (sessParam) {
          setActiveSessionId(sessParam);
          sessionService
            .getById(sessParam)
            .then((sess) => {
              if (sess) {
                setActiveSession(sess);
              } else {
                setSessionError('Sesi tugas tidak ditemukan di perangkat ini.');
              }
            })
            .catch((err) => {
              console.error('Failed to load active session:', err);
            });
        }
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }

    return () => {
      stopCamera();
      revokeActiveUrl();
    };
  }, [stopCamera, revokeActiveUrl]);

  // Start camera stream
  const startCamera = async () => {
    if (isStartingCamera) return;

    setCameraError(null);
    setApiError(null);
    setIsStartingCamera(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Peramban ini tidak mendukung akses kamera langsung. Silakan gunakan galeri.');
      setIsStartingCamera(false);
      return;
    }

    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      setMode('camera');
      setIsStartingCamera(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play error:', playErr);
        }
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      stopCamera();

      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            setCameraError('Akses kamera ditolak. Beri izin kamera di pengaturan browser atau gunakan galeri.');
            break;
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            setCameraError('Kamera tidak ditemukan pada perangkat ini. Gunakan galeri kalau kamera sedang tidak tersedia.');
            break;
          case 'NotReadableError':
          case 'TrackStartError':
            setCameraError('Kamera sedang digunakan aplikasi lain. Gunakan galeri kalau kamera sedang tidak tersedia.');
            break;
          case 'OverconstrainedError':
            try {
              const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
              streamRef.current = fallbackStream;
              setMode('camera');
              if (videoRef.current) {
                videoRef.current.srcObject = fallbackStream;
                await videoRef.current.play();
              }
              return;
            } catch {
              setCameraError('Kamera tidak dapat dimulai. Gunakan galeri kalau kamera sedang tidak tersedia.');
            }
            break;
          default:
            setCameraError('Akses kamera gagal. Gunakan galeri kalau kamera sedang tidak tersedia.');
            break;
        }
      } else {
        setCameraError('Gagal mengakses kamera. Gunakan galeri kalau kamera sedang tidak tersedia.');
      }
      setMode('idle');
    }
  };

  // Capture frame from video with high visual quality
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            revokeActiveUrl();
            const objectUrl = URL.createObjectURL(blob);
            activeUrlRef.current = objectUrl;

            setImageInfo({
              url: objectUrl,
              source: 'camera',
              file: blob,
              sizeBytes: blob.size,
              width,
              height,
            });

            stopCamera();
            setMode('preview');
          }
        },
        'image/jpeg',
        0.95
      );
    }
  };

  // Open device gallery file picker
  const handleGalleryClick = () => {
    stopCamera();
    fileInputRef.current?.click();
  };

  // Handle image selected from gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!file.type.startsWith('image/')) {
      setCameraError('File yang dipilih bukan gambar yang valid. Silakan pilih foto (JPG, PNG, atau WEBP).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setCameraError(null);
    revokeActiveUrl();

    const objectUrl = URL.createObjectURL(file);
    activeUrlRef.current = objectUrl;

    setImageInfo({
      url: objectUrl,
      source: 'gallery',
      file,
      sizeBytes: file.size,
    });

    stopCamera();
    setMode('preview');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Retake photo: discard preview and return to selection/camera
  const handleRetake = () => {
    const lastSource = imageInfo?.source;
    revokeActiveUrl();
    setImageInfo(null);
    setExtractedQuestion(null);
    setSolverResult(null);
    setFollowUpMessages([]);
    setFollowUpInput('');
    setIsSendingFollowUp(false);
    setFollowUpError(null);
    setFollowUpClarification(null);
    setGroundedResult(null);
    setIsGrounding(false);
    setGroundingError(null);
    setApiError(null);
    activeHistoryIdRef.current = null;

    if (lastSource === 'camera') {
      startCamera();
    } else {
      setMode('idle');
      handleGalleryClick();
    }
  };

  // Cancel/Reset back to preparation screen
  const handleResetToIdle = () => {
    stopCamera();
    revokeActiveUrl();
    setImageInfo(null);
    setCameraError(null);
    setApiError(null);
    setExtractedQuestion(null);
    setSolverResult(null);
    setIsSolving(false);
    setCopiedAnswer(false);
    setFollowUpMessages([]);
    setFollowUpInput('');
    setIsSendingFollowUp(false);
    setFollowUpError(null);
    setFollowUpClarification(null);
    setGroundedResult(null);
    setIsGrounding(false);
    setGroundingError(null);
    activeHistoryIdRef.current = null;
    setMode('idle');
  };

  // SUBMIT TO GEMINI VISION API ("GUNAKAN FOTO" in M3)
  const handleExtractQuestion = async () => {
    if (!imageInfo || isExtracting) return;

    setIsExtracting(true);
    setApiError(null);
    setMode('processing');

    try {
      const formData = new FormData();

      if (imageInfo.file) {
        formData.append('image', imageInfo.file, 'question-scan.jpg');
      } else {
        // Fallback: fetch blob from URL if file reference was not preserved
        const res = await fetch(imageInfo.url);
        const blob = await res.blob();
        formData.append('image', blob, 'question-scan.jpg');
      }

      const response = await fetch('/api/vision/extract', {
        method: 'POST',
        body: formData,
      });

      const result: ExtractApiResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        const errorMsg = result.error || 'Terjadi kesalahan saat memproses gambar.';
        setApiError(errorMsg);
        setMode('error');
        return;
      }

      const questionData = result.data;
      setExtractedQuestion(questionData);
      setEditedQuestionText(questionData.questionText);

      // Check if image needs clarification
      if (questionData.needsClarification || questionData.confidence === 'low') {
        setMode('clarification');
      } else {
        setMode('identified');
      }
    } catch (err: unknown) {
      console.error('Extraction client error:', err);
      setApiError('Koneksi internet terputus atau server tidak merespons. Pastikan koneksi stabil.');
      setMode('error');
    } finally {
      setIsExtracting(false);
    }
  };

  // SUBMIT TO GEMINI SOLVER API ("PECAHKAN SOAL" in M4)
  const handleSolveQuestion = async () => {
    if (!extractedQuestion || isSolving) return;

    setIsSolving(true);
    setApiError(null);
    setFollowUpMessages([]);
    setFollowUpInput('');
    setFollowUpError(null);
    setFollowUpClarification(null);
    setGroundedResult(null);
    setIsGrounding(false);
    setGroundingError(null);
    setMode('solving');

    try {
      const response = await fetch('/api/solver/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionText: extractedQuestion.questionText,
          subject: extractedQuestion.subject,
          topic: extractedQuestion.topic,
          hasDiagramOrTable: extractedQuestion.hasDiagramOrTable,
          diagramDescription: extractedQuestion.diagramDescription,
          detectedLanguage: extractedQuestion.detectedLanguage,
          confidence: extractedQuestion.confidence,
          needsClarification: extractedQuestion.needsClarification,
          clarificationReason: extractedQuestion.clarificationReason,
        }),
      });

      const result: SolveApiResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        const errorMsg = result.error || 'Terjadi kesalahan saat memecahkan soal.';
        setApiError(errorMsg);
        setMode('error');
        return;
      }

      const solution = result.data;
      setSolverResult(solution);

      if (solution.status === 'needs_clarification') {
        if (solution.clarificationQuestion) {
          setExtractedQuestion((prev) =>
            prev
              ? {
                  ...prev,
                  needsClarification: true,
                  clarificationReason: solution.clarificationQuestion || prev.clarificationReason,
                }
              : prev
          );
        }
        setMode('clarification');
      } else {
        setMode('solved');
        // M7: Save solved question to local history (deduplicating during session retries)
        if (solution.status === 'solved') {
          try {
            const savedItem = await historyService.saveSolvedQuestion({
              extractedQuestion,
              solverResult: solution,
              existingId: activeHistoryIdRef.current,
            });
            activeHistoryIdRef.current = savedItem.id;

            // M8: Attach solved item to active homework session
            if (activeSessionId) {
              sessionService.addHistoryItemToSession(activeSessionId, savedItem.id).catch((sessErr) => {
                console.error('Failed to attach item to session:', sessErr);
              });
            }
          } catch (histErr) {
            console.error('Failed to save to history:', histErr);
          }
        }
      }
    } catch (err: unknown) {
      console.error('Solver client error:', err);
      setApiError('Koneksi internet terputus atau server tidak merespons. Pastikan koneksi stabil.');
      setMode('error');
    } finally {
      setIsSolving(false);
    }
  };

  const handleCopyAnswer = () => {
    if (solverResult?.finalAnswer) {
      navigator.clipboard.writeText(solverResult.finalAnswer);
      setCopiedAnswer(true);
      setTimeout(() => setCopiedAnswer(false), 2000);
    }
  };

  // M5 FOLLOW-UP TUTOR HANDLER
  const handleSendFollowUp = async (customMessage?: string) => {
    if (!extractedQuestion || !solverResult || isSendingFollowUp) return;
    const textToSend = (customMessage || followUpInput).trim();
    if (!textToSend) return;

    const userMsg: FollowUpMessage = { role: 'user', content: textToSend };
    const updatedMessages = [...followUpMessages, userMsg];
    setFollowUpMessages(updatedMessages);
    setFollowUpInput('');
    setIsSendingFollowUp(true);
    setFollowUpError(null);
    setFollowUpClarification(null);

    try {
      const response = await fetch('/api/followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionText: extractedQuestion.questionText,
          subject: extractedQuestion.subject,
          topic: extractedQuestion.topic,
          solverResult,
          messages: updatedMessages.slice(0, -1), // previous history
          userMessage: textToSend,
        }),
      });

      const result: FollowUpApiResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        const errorMsg = result.error || 'Antonius lagi susah menjawab. Coba lagi.';
        setFollowUpError(errorMsg);
        return;
      }

      const output = result.data;
      if (output.status === 'needs_clarification' && output.clarificationQuestion) {
        setFollowUpClarification(output.clarificationQuestion);
      }

      const assistantMsg: FollowUpMessage = {
        role: 'assistant',
        content: output.answer,
      };
      const finalFollowUpMessages = [...updatedMessages, assistantMsg];
      setFollowUpMessages(finalFollowUpMessages);

      if (activeHistoryIdRef.current) {
        historyService.updateFollowUp(activeHistoryIdRef.current, finalFollowUpMessages).catch((err) => {
          console.error('Failed to update follow-up in history:', err);
        });
      }
    } catch (err) {
      console.error('Follow-up client error:', err);
      setFollowUpError('Koneksi internet terputus atau server tidak merespons. Silakan coba lagi.');
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  // M6 WEB GROUNDING HANDLER
  const handleGroundQuestion = async (customQuery?: string) => {
    if (!extractedQuestion || isGrounding) return;
    const queryToUse = (customQuery || extractedQuestion.questionText).trim();
    if (!queryToUse) return;

    setIsGrounding(true);
    setGroundingError(null);

    try {
      const response = await fetch('/api/search/ground', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionText: queryToUse,
          subject: extractedQuestion.subject,
          topic: extractedQuestion.topic,
          userMessage: customQuery ? `Pertanyaan spesifik siswa: ${customQuery}` : undefined,
        }),
      });

      const result: GroundingApiResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        const errorMsg = result.error || 'Antonius gagal mencari sumber. Coba lagi.';
        setGroundingError(errorMsg);
        return;
      }

      setGroundedResult(result.data);
      if (activeHistoryIdRef.current && result.data) {
        historyService.updateGroundedResult(activeHistoryIdRef.current, result.data).catch((err) => {
          console.error('Failed to update grounded result in history:', err);
        });
      }
    } catch (err) {
      console.error('Grounding client error:', err);
      setGroundingError('Koneksi internet terputus atau server tidak merespons. Silakan coba lagi.');
    } finally {
      setIsGrounding(false);
    }
  };

  const handleSaveEditedQuestion = () => {
    if (extractedQuestion && editedQuestionText.trim()) {
      setExtractedQuestion({
        ...extractedQuestion,
        questionText: editedQuestionText.trim(),
      });
      setIsEditingQuestion(false);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Scan Soal"
        subtitle="Ekstraksi teks & AI Solver"
        backHref="/"
        rightAction={
          <Badge
            variant={
              mode === 'solved'
                ? 'green'
                : mode === 'solving'
                ? 'yellow'
                : mode === 'identified'
                ? 'blue'
                : mode === 'processing'
                ? 'yellow'
                : mode === 'clarification'
                ? 'red'
                : 'default'
            }
            icon={<Sparkles className="w-3 h-3 stroke-[2.5]" />}
          >
            {mode === 'solved'
              ? 'M4 TERPECAHKAN'
              : mode === 'solving'
              ? 'LAGI MIKIR...'
              : mode === 'identified'
              ? 'SOAL TERBACA'
              : mode === 'processing'
              ? 'MEMBACA...'
              : 'M4 SOLVER'}
          </Badge>
        }
      />

      <div className="px-4 sm:px-6 py-5 flex flex-col gap-5 flex-1">
        {/* M8: Active Homework Session Banner */}
        {activeSession && (
          <div className="p-3.5 rounded-2xl bg-[#FFF7F2] border-[3px] border-[#111111] shadow-[3px_3px_0_#111111] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <Badge variant="purple" className="text-[10px] shrink-0">
                SESI AKTIF
              </Badge>
              <span className="text-xs sm:text-sm font-black text-[#111111] truncate">
                {activeSession.title}
              </span>
            </div>
            <Link
              href={`/sessions?selected=${activeSession.id}`}
              className="text-xs font-black text-[#D94336] underline uppercase shrink-0 min-h-[44px] flex items-center px-1"
            >
              Lihat Sesi
            </Link>
          </div>
        )}

        {sessionError && (
          <div className="p-3 rounded-xl bg-[#FFF0EF] border-[2px] border-[#D94336] flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#D94336]">{sessionError}</span>
            <button
              type="button"
              onClick={() => setSessionError(null)}
              className="text-xs font-bold underline text-[#111111] min-h-[44px] px-2 flex items-center"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Hidden Canvas & Accessible File Input */}
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Pilih foto soal dari galeri perangkat"
        />

        {/* 1. CAMERA ERROR STATE */}
        {cameraError && (
          <Card variant="white" shadow="lg" className="border-l-[8px] border-l-[#C7372F]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF7F2] border-[2px] border-[#111111] shadow-[2px_2px_0_#111111] flex items-center justify-center shrink-0 text-[#C7372F]">
                <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-[#111111] uppercase tracking-tight">
                  Akses Kamera Terkendala
                </h3>
                <p className="text-xs sm:text-sm text-[#6F6A67] font-medium mt-1 leading-relaxed">
                  {cameraError}
                </p>

                <div className="flex flex-wrap gap-2.5 mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={startCamera}
                    icon={<RefreshCw className="w-4 h-4 stroke-[2.5]" />}
                  >
                    Coba Lagi
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleGalleryClick}
                    icon={<ImageIcon className="w-4 h-4 stroke-[2.5]" />}
                  >
                    PILIH DARI GALERI
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 2. GENERAL / API ERROR STATE */}
        {mode === 'error' && (
          <Card variant="white" shadow="lg" className="border-l-[8px] border-l-[#C7372F] p-5">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#FFF7F2] border-[3px] border-[#111111] shadow-[2px_2px_0_#111111] flex items-center justify-center shrink-0 text-[#C7372F]">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="flex-1">
                <Badge variant="red" className="mb-1.5">
                  {extractedQuestion ? 'GAGAL MEMECAHKAN' : 'GAGAL MEMBACA'}
                </Badge>
                <h3 className="text-base sm:text-lg font-black text-[#111111] uppercase tracking-tight">
                  {extractedQuestion ? 'Waduh, Gagal Memecahkan Soal' : 'Waduh, Gagal Membaca Soal'}
                </h3>
                <p className="text-xs sm:text-sm text-[#6F6A67] font-medium mt-1.5 leading-relaxed">
                  {apiError ||
                    (extractedQuestion
                      ? 'Antonius mengalami kendala saat menyelesaikan soal ini. Silakan coba lagi.'
                      : 'Antonius gagal membaca teks dari gambar ini. Pastikan gambar jelas dan tidak terpotong.')}
                </p>

                <div className="flex flex-col gap-2.5 mt-5">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={extractedQuestion ? handleSolveQuestion : handleExtractQuestion}
                    icon={<RefreshCw className="w-4 h-4 stroke-[2.5]" />}
                  >
                    {extractedQuestion ? 'Coba Pecahkan Lagi' : 'Coba Baca Lagi'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={handleRetake}
                    icon={<RotateCcw className="w-4 h-4 stroke-[2.5]" />}
                  >
                    Foto Ulang
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 3. PROCESSING / LOADING STATE */}
        {mode === 'processing' && (
          <Card variant="yellow" shadow="lg" className="text-center p-8 flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-white border-[4px] border-[#111111] shadow-[5px_5px_0_#111111] flex items-center justify-center mb-5 animate-pulse">
              <Loader2 className="w-10 h-10 text-[#D94336] stroke-[2.5] animate-spin" />
            </div>

            <Badge variant="dark" className="mb-2">AI VISION BEKERJA</Badge>

            <h2 className="text-xl sm:text-2xl font-black text-[#111111] uppercase tracking-tight">
              Antonius lagi membaca...
            </h2>

            <p className="text-xs sm:text-sm text-[#111111] font-bold mt-2 max-w-xs leading-relaxed">
              Sebentar ya, gue lagi memahami tulisan, angka, dan rumus pada soalmu.
            </p>

            <div className="w-full bg-white/70 rounded-xl p-3 border-2 border-[#111111] mt-6 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D94336] stroke-[2.5]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#111111]">
                Gemini Vision Multimodal
              </span>
            </div>
          </Card>
        )}

        {/* 4. CLARIFICATION STATE (FOTO KURANG JELAS) */}
        {mode === 'clarification' && extractedQuestion && (
          <Card variant="white" shadow="lg" className="border-t-[8px] border-t-[#FFD447] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFD447] text-[#111111] border-[2px] border-[#111111] shadow-[2px_2px_0_#111111] flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <Badge variant="yellow">PERLU KLARIFIKASI</Badge>
                <h3 className="text-base sm:text-lg font-black text-[#111111] uppercase tracking-tight block">
                  Foto Kurang Jelas
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#6F6A67] font-medium leading-relaxed mb-4">
              Antonius kesulitan membaca sebagian isi soal dengan pasti:
            </p>

            {/* Clarification Reason Box */}
            <div className="bg-[#FFF7F2] p-3.5 rounded-xl border-[2px] border-[#111111] shadow-[2px_2px_0_#111111] mb-5">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#D94336] block mb-1">
                Catatan AI:
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#111111] leading-relaxed">
                {extractedQuestion.clarificationReason || 'Beberapa angka atau simbol buram dan tidak terbaca jelas.'}
              </p>
            </div>

            {/* Partially extracted text if any */}
            {extractedQuestion.questionText && (
              <div className="mb-5">
                <span className="text-xs font-black uppercase tracking-wider text-[#6F6A67] block mb-1.5">
                  Teks yang sempat terbaca:
                </span>
                <div className="p-3 bg-black/5 rounded-xl border border-[#111111]/30 text-xs font-mono text-[#111111] max-h-32 overflow-y-auto">
                  {extractedQuestion.questionText}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <Button
                variant="primary"
                size="hero"
                fullWidth
                onClick={handleRetake}
                icon={<RotateCcw className="w-6 h-6 stroke-[2.5]" />}
              >
                FOTO ULANG
              </Button>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={handleExtractQuestion}
                icon={<RefreshCw className="w-4 h-4 stroke-[2.5]" />}
              >
                COBA BACA LAGI
              </Button>
            </div>
          </Card>
        )}

        {/* 5. QUESTION IDENTIFIED / CONFIRMATION UI */}
        {mode === 'identified' && extractedQuestion && (
          <div className="flex flex-col gap-4">
            <Card variant="white" shadow="lg" className="border-t-[8px] border-t-[#2E9B68] p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge variant="green" icon={<CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}>
                  SOAL TERIDENTIFIKASI
                </Badge>

                {/* Human-friendly confidence badge */}
                <Badge
                  variant={
                    extractedQuestion.confidence === 'high'
                      ? 'green'
                      : extractedQuestion.confidence === 'medium'
                      ? 'yellow'
                      : 'default'
                  }
                >
                  {extractedQuestion.confidence === 'high'
                    ? 'Terbaca Sangat Jelas'
                    : extractedQuestion.confidence === 'medium'
                    ? 'Cukup Jelas'
                    : 'Perlu Konfirmasi'}
                </Badge>
              </div>

              {/* Subject & Topic Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {extractedQuestion.subject && (
                  <Badge variant="blue" className="text-xs py-1 px-3">
                    {extractedQuestion.subject.toUpperCase()}
                  </Badge>
                )}
                {extractedQuestion.topic && (
                  <Badge variant="purple" className="text-xs py-1 px-3">
                    {extractedQuestion.topic.toUpperCase()}
                  </Badge>
                )}
              </div>

              {/* Extracted Question Text Display / Inline Edit */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                    <FileQuestion className="w-4 h-4 text-[#D94336] stroke-[2.5]" />
                    Isi Soal:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingQuestion(!isEditingQuestion)}
                    className="text-xs font-bold text-[#D94336] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                    {isEditingQuestion ? 'Batal Edit' : 'Edit Teks'}
                  </button>
                </div>

                {isEditingQuestion ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editedQuestionText}
                      onChange={(e) => setEditedQuestionText(e.target.value)}
                      rows={5}
                      className="w-full p-3 text-xs sm:text-sm font-medium bg-[#FFF7F2] border-[3px] border-[#111111] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#111111] shadow-[3px_3px_0_#111111]"
                      placeholder="Ketik teks soal..."
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSaveEditedQuestion}
                      icon={<Check className="w-4 h-4 stroke-[3]" />}
                    >
                      Simpan Perubahan
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#FFF7F2] border-[3px] border-[#111111] shadow-[3px_3px_0_#111111]">
                    <p className="text-sm sm:text-base font-bold text-[#111111] leading-relaxed whitespace-pre-wrap">
                      {extractedQuestion.questionText}
                    </p>
                  </div>
                )}
              </div>

              {/* Diagram / Table Info if present */}
              {extractedQuestion.hasDiagramOrTable && extractedQuestion.diagramDescription && (
                <div className="p-3 bg-[#FFD447]/30 rounded-xl border-[2px] border-[#111111] mb-5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#111111] block mb-1">
                    📊 Diagram / Grafik / Tabel Terdeteksi:
                  </span>
                  <p className="text-xs font-medium text-[#111111] leading-relaxed">
                    {extractedQuestion.diagramDescription}
                  </p>
                </div>
              )}

              {/* Milestone 3 Status Notice */}
              <Card variant="canvas" shadow="none" className="border-2 border-[#111111] p-3 mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="green">M3 SELESAI</Badge>
                  <span className="text-xs font-black uppercase text-[#111111]">
                    Ekstraksi Berhasil
                  </span>
                </div>
                <p className="text-xs text-[#6F6A67] font-medium leading-relaxed">
                  Soal berhasil dipahami secara multimodal oleh model AI Vision. Mesin pemecah soal dan langkah penyelesaian akan diaktifkan pada <strong>Milestone 4 (Solver)</strong>.
                </p>
              </Card>

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                <Button
                  variant="primary"
                  size="hero"
                  fullWidth
                  disabled={isSolving}
                  onClick={handleSolveQuestion}
                  icon={
                    isSolving ? (
                      <Loader2 className="w-6 h-6 stroke-[3] animate-spin" />
                    ) : (
                      <Sparkles className="w-6 h-6 stroke-[3]" />
                    )
                  }
                  aria-label="Pecahkan soal ini dengan AI Solver"
                >
                  {isSolving ? 'MEMPROSES SOLUSI...' : 'PECAHKAN SOAL INI'}
                </Button>

                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleRetake}
                    icon={<RotateCcw className="w-4 h-4 stroke-[2.5]" />}
                  >
                    Foto Ulang
                  </Button>
                  <Link href="/" className="w-full block">
                    <Button
                      variant="secondary"
                      size="md"
                      fullWidth
                    >
                      Beranda
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 5b. SOLVING / REASONING LOADING STATE */}
        {mode === 'solving' && (
          <Card variant="yellow" shadow="lg" className="text-center p-8 flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-white border-[4px] border-[#111111] shadow-[5px_5px_0_#111111] flex items-center justify-center mb-5 animate-bounce">
              <Sparkles className="w-10 h-10 text-[#D94336] stroke-[2.5]" />
            </div>

            <Badge variant="dark" className="mb-2">AI REASONING SOLVER</Badge>

            <h2 className="text-xl sm:text-2xl font-black text-[#111111] uppercase tracking-tight">
              Antonius lagi mikir...
            </h2>

            <p className="text-xs sm:text-sm text-[#111111] font-bold mt-2 max-w-xs leading-relaxed">
              Membedah rumus, menghitung angka, dan memeriksa ulang hasil penyelesaian untukmu.
            </p>

            <div className="w-full bg-white/70 rounded-xl p-3 border-2 border-[#111111] mt-6 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-[#D94336] stroke-[2.5] animate-spin" />
              <span className="text-xs font-black uppercase tracking-wider text-[#111111]">
                Gemini Reasoning Engine
              </span>
            </div>
          </Card>
        )}

        {/* 5c. SOLVED RESULT CARD */}
        {mode === 'solved' && solverResult && (
          <div className="flex flex-col gap-4">
            {/* HERO FINAL ANSWER CARD */}
            <Card variant="white" shadow="lg" className="border-t-[8px] border-t-[#2E9B68] p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge variant="green" icon={<CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}>
                  JAWABAN ANTONIUS
                </Badge>
                {solverResult.answerType && (
                  <Badge variant="blue" className="text-[10px] py-0.5 px-2 uppercase">
                    {solverResult.answerType.replace('_', ' ')}
                  </Badge>
                )}
              </div>

              {/* Subject & Topic Badges */}
              {extractedQuestion && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {extractedQuestion.subject && (
                    <Badge variant="yellow" className="text-xs py-1 px-2.5">
                      {extractedQuestion.subject.toUpperCase()}
                    </Badge>
                  )}
                  {extractedQuestion.topic && (
                    <Badge variant="purple" className="text-xs py-1 px-2.5">
                      {extractedQuestion.topic.toUpperCase()}
                    </Badge>
                  )}
                </div>
              )}

              {/* Final Answer Big Box */}
              <div className="bg-[#FFF7F2] p-4 sm:p-5 rounded-2xl border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#D94336]">
                    Jawaban Akhir:
                  </span>
                  {solverResult.finalAnswer && (
                    <button
                      type="button"
                      onClick={handleCopyAnswer}
                      className="text-xs font-bold text-[#111111] hover:text-[#D94336] flex items-center gap-1 cursor-pointer transition-colors"
                      aria-label="Salin jawaban akhir"
                    >
                      {copiedAnswer ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-[#2E9B68] stroke-[2.5]" />
                          <span className="text-[#2E9B68]">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="text-lg sm:text-2xl font-black text-[#111111] leading-snug break-words">
                  {solverResult.finalAnswer || solverResult.explanation}
                </div>
              </div>

              {/* Explanation Summary */}
              <div className="mb-5">
                <span className="text-xs font-black uppercase tracking-wider text-[#6F6A67] block mb-1.5">
                  Ringkasan Solusi:
                </span>
                <p className="text-xs sm:text-sm font-medium text-[#111111] leading-relaxed">
                  {solverResult.explanation}
                </p>
              </div>

              {/* Step-by-Step Solution */}
              {solverResult.steps && solverResult.steps.length > 0 && (
                <div className="mb-5">
                  <span className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5 mb-3">
                    <BookOpen className="w-4 h-4 text-[#D94336] stroke-[2.5]" />
                    Cara Mengerjakan (Langkah demi Langkah):
                  </span>

                  <div className="flex flex-col gap-3">
                    {solverResult.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white border-[2.5px] border-[#111111] shadow-[3px_3px_0_#111111]"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-6 h-6 rounded-lg bg-[#FFD447] text-[#111111] border-2 border-[#111111] font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h4 className="text-xs sm:text-sm font-black text-[#111111]">
                            {step.title}
                          </h4>
                        </div>

                        <p className="text-xs sm:text-sm text-[#111111] font-medium leading-relaxed mb-2 pl-8">
                          {step.explanation}
                        </p>

                        {/* Formula if present */}
                        {step.formula && (
                          <div className="ml-8 mb-2 p-2 bg-[#FFF7F2] rounded-lg border border-[#111111] font-mono text-xs font-bold text-[#111111]">
                            <span className="text-[10px] text-[#6F6A67] block uppercase font-sans">Rumus:</span>
                            {step.formula}
                          </div>
                        )}

                        {/* Intermediate Result if present */}
                        {step.result && (
                          <div className="ml-8 p-1.5 px-2.5 bg-[#A8E063]/30 rounded-lg border border-[#111111] text-xs font-bold text-[#111111] inline-block">
                            Hasil: {step.result}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Section ("Periksa Lagi") */}
              <div className="mb-5">
                <div
                  className={`p-3.5 rounded-xl border-[2px] border-[#111111] shadow-[2px_2px_0_#111111] flex items-start gap-3 ${
                    solverResult.verification.result === 'passed'
                      ? 'bg-[#A8E063]/25'
                      : solverResult.verification.result === 'failed'
                      ? 'bg-[#D94336]/15'
                      : 'bg-[#FFF7F2]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white border-2 border-[#111111] flex items-center justify-center shrink-0 text-[#111111]">
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#111111]">
                        Pemeriksaan Ulang:
                      </span>
                      <Badge
                        variant={
                          solverResult.verification.result === 'passed'
                            ? 'green'
                            : solverResult.verification.result === 'failed'
                            ? 'red'
                            : 'default'
                        }
                        className="text-[10px] py-0 px-2"
                      >
                        {solverResult.verification.result === 'passed'
                          ? 'SUDAH DICEK'
                          : solverResult.verification.result === 'failed'
                          ? 'PERLU DITINJAU'
                          : 'VERIFIKASI TERBATAS'}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-[#111111] leading-relaxed">
                      {solverResult.verification.explanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warnings if any */}
              {solverResult.warnings && solverResult.warnings.length > 0 && (
                <div className="p-3 bg-[#FFD447]/30 rounded-xl border-2 border-[#111111] mb-5">
                  <span className="text-[11px] font-black uppercase text-[#111111] block mb-1">
                    ⚠️ Catatan Tambahan:
                  </span>
                  <ul className="text-xs text-[#111111] font-medium list-disc list-inside">
                    {solverResult.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* M6 WEB GROUNDING SECTION */}
              <div className="p-4 bg-[#F2F8FD] rounded-2xl border-[3px] border-[#111111] shadow-[3px_3px_0_#111111] my-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#3B82F6] border-2 border-[#111111] shadow-[2px_2px_0_#111111] flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4 text-white stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-[#111111] uppercase tracking-wide">
                        Cek Sumber Web / Fakta Terkini
                      </h3>
                      <p className="text-[11px] font-bold text-[#6F6A67]">
                        Verifikasi fakta terbaru dengan Google Search Grounding
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isGrounding}
                    onClick={() => handleGroundQuestion()}
                    icon={isGrounding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5 stroke-[2.5]" />}
                    className="shrink-0 text-[11px] font-black"
                  >
                    {isGrounding ? 'Mencari...' : 'CEK WEB'}
                  </Button>
                </div>

                {/* Grounding Loading State */}
                {isGrounding && (
                  <div className="p-3 bg-white rounded-xl border-2 border-[#111111] shadow-[2px_2px_0_#111111] mt-3 flex items-center gap-2 text-xs font-bold text-[#111111]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#3B82F6]" />
                    <span>Antonius lagi cari sumber...</span>
                  </div>
                )}

                {/* Grounding Error State */}
                {groundingError && (
                  <div className="p-3 bg-[#FF4747]/10 border-2 border-[#D94336] rounded-xl mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#D94336] shrink-0" />
                      <span className="text-xs font-bold text-[#D94336] leading-tight">
                        {groundingError}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGroundQuestion()}
                      className="text-[10px] font-black uppercase px-2 py-1 bg-[#D94336] text-white rounded-lg border-2 border-[#111111] shadow-[1px_1px_0_#111111] shrink-0"
                    >
                      COBA LAGI
                    </button>
                  </div>
                )}

                {/* Grounded Result Display */}
                {groundedResult && !isGrounding && (
                  <div className="mt-3 p-3.5 bg-white rounded-xl border-2 border-[#111111] shadow-[2px_2px_0_#111111]">
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#111111]/10">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={groundedResult.status === 'grounded' && groundedResult.citations.length > 0 ? 'green' : 'blue'}
                          icon={<Globe className="w-3 h-3 stroke-[2.5]" />}
                          className="text-[10px] py-0.5 px-2"
                        >
                          {groundedResult.status === 'grounded' && groundedResult.citations.length > 0
                            ? '🌐 DICEK DI WEB'
                            : 'FAKTA KONSEPTUAL'}
                        </Badge>
                        {groundedResult.status === 'grounded' && groundedResult.citations.length > 0 && (
                          <span className="text-[10px] font-bold text-[#2E9B68]">
                            Antonius nemu sumber.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Search Queries used */}
                    {groundedResult.searchQueries && groundedResult.searchQueries.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mb-2.5">
                        <span className="text-[10px] font-bold text-[#6F6A67]">Pencarian:</span>
                        {groundedResult.searchQueries.map((q, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold bg-[#EBF3FE] text-[#1D4ED8] px-2 py-0.5 rounded-md border border-[#111111]/20"
                          >
                            &quot;{q}&quot;
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Answer text */}
                    <p className="text-xs sm:text-sm font-medium text-[#111111] leading-relaxed whitespace-pre-wrap mb-3">
                      {groundedResult.answer}
                    </p>

                    {/* Citations List */}
                    {groundedResult.citations && groundedResult.citations.length > 0 && (
                      <div className="pt-2.5 border-t border-[#111111]/10">
                        <span className="text-[10px] font-black uppercase text-[#6F6A67] tracking-wider block mb-1.5">
                          SUMBER TERVERIFIKASI:
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {groundedResult.citations.map((c, idx) => (
                            <a
                              key={idx}
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2 rounded-lg bg-[#FFFDF8] hover:bg-[#FFD447]/30 border border-[#111111] text-xs transition-colors group"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="w-4 h-4 rounded bg-[#3B82F6] text-white text-[9px] font-black flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-[#111111] truncate group-hover:underline">
                                  {c.title || c.domain || c.url}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                {c.domain && (
                                  <span className="text-[10px] font-semibold text-[#6F6A67] px-1.5 py-0.5 rounded bg-black/5">
                                    {c.domain}
                                  </span>
                                )}
                                <ExternalLink className="w-3.5 h-3.5 text-[#111111] stroke-[2.5]" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* M5 FOLLOW-UP TUTOR CONVERSATION */}
              <div className="pt-4 border-t-4 border-dashed border-[#111111]/20 my-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#FFD447] border-2 border-[#111111] shadow-[2px_2px_0_#111111] flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-[#111111] stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#111111] uppercase tracking-wide">
                        Tanya Antonius (Tutor)
                      </h3>
                      <p className="text-[11px] font-bold text-[#6F6A67]">
                        Tanyakan langkah tertentu, minta cara lain, atau ganti angka
                      </p>
                    </div>
                  </div>
                  {followUpMessages.length > 0 && (
                    <Badge variant="blue" className="text-[10px] py-0.5 px-2">
                      {followUpMessages.length} Pesan
                    </Badge>
                  )}
                </div>

                {/* Preset quick prompt pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {[
                    { text: '💡 Kenapa langkah kedua dibagi 2?', action: () => handleSendFollowUp('Kenapa langkah kedua dibagi 2?') },
                    { text: '💡 Ada cara lain?', action: () => handleSendFollowUp('Ada cara lain?') },
                    { text: '💡 Jelaskan lebih sederhana', action: () => handleSendFollowUp('Jelaskan lebih sederhana') },
                    { text: '💡 Kalau angkanya diganti gimana?', action: () => handleSendFollowUp('Kalau angkanya diganti gimana?') },
                    { text: '🌐 Cek info web terbaru', action: () => handleGroundQuestion() },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isSendingFollowUp || isGrounding}
                      onClick={preset.action}
                      className="text-left text-[11px] font-bold bg-[#FFFDF8] hover:bg-[#FFD447] text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0_#111111] rounded-lg px-2.5 py-1.5 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
                    >
                      {preset.text}
                    </button>
                  ))}
                </div>

                {/* Chat messages thread */}
                {followUpMessages.length > 0 && (
                  <div className="flex flex-col gap-3 mb-4 max-h-[420px] overflow-y-auto p-3 bg-[#FFFDF8] rounded-xl border-2 border-[#111111] shadow-inner">
                    {followUpMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${
                          msg.role === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          {msg.role === 'user' ? (
                            <>
                              <span className="text-[10px] font-black uppercase text-[#6F6A67]">Kamu</span>
                              <User className="w-3 h-3 text-[#111111]" />
                            </>
                          ) : (
                            <>
                              <Bot className="w-3.5 h-3.5 text-[#D94336]" />
                              <span className="text-[10px] font-black uppercase text-[#D94336]">Antonius Tutor</span>
                            </>
                          )}
                        </div>
                        <div
                          className={`max-w-[92%] sm:max-w-[85%] p-3 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0_#111111] text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user'
                              ? 'bg-[#FFD447] text-[#111111] rounded-tr-none'
                              : 'bg-white text-[#111111] rounded-tl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {/* Sending loading bubble */}
                    {isSendingFollowUp && (
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <Bot className="w-3.5 h-3.5 text-[#D94336]" />
                          <span className="text-[10px] font-black uppercase text-[#D94336]">Antonius Tutor</span>
                        </div>
                        <div className="bg-white p-3 rounded-xl rounded-tl-none border-2 border-[#111111] shadow-[2px_2px_0_#111111] flex items-center gap-2 text-xs font-bold text-[#111111]">
                          <Loader2 className="w-4 h-4 animate-spin text-[#D94336]" />
                          <span>Antonius lagi mikir...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Clarification state notice */}
                {followUpClarification && (
                  <div className="p-3 bg-[#FFD447]/30 border-2 border-[#111111] rounded-xl mb-3 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-[#D94336] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-black uppercase text-[#111111] block mb-0.5">
                        Antonius belum yakin bagian mana yang kamu maksud:
                      </span>
                      <p className="text-xs font-bold text-[#111111]">
                        {followUpClarification}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error state alert */}
                {followUpError && (
                  <div className="p-3 bg-[#FF4747]/10 border-2 border-[#D94336] rounded-xl mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#D94336] shrink-0" />
                      <span className="text-xs font-bold text-[#D94336]">
                        {followUpError}
                      </span>
                    </div>
                    {followUpMessages.length > 0 && followUpMessages[followUpMessages.length - 1].role === 'user' && (
                      <button
                        type="button"
                        onClick={() => handleSendFollowUp(followUpMessages[followUpMessages.length - 1].content)}
                        className="text-[11px] font-black uppercase px-3 py-2 min-h-[44px] bg-[#D94336] text-white rounded-lg border-2 border-[#111111] shadow-[1px_1px_0_#111111] hover:bg-[#c3382c] shrink-0 flex items-center justify-center"
                      >
                        COBA LAGI
                      </button>
                    )}
                  </div>
                )}

                {/* Follow-up input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendFollowUp();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={followUpInput}
                    onChange={(e) => setFollowUpInput(e.target.value)}
                    placeholder="Tanya tentang soal ini..."
                    disabled={isSendingFollowUp}
                    maxLength={2000}
                    className="flex-1 min-h-[46px] px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#111111] shadow-[2px_2px_0_#111111] text-xs sm:text-sm font-semibold text-[#111111] placeholder:text-[#8E8883] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#FFD447] disabled:opacity-50"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSendingFollowUp || !followUpInput.trim()}
                    icon={isSendingFollowUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 stroke-[2.5]" />}
                    className="shrink-0 min-h-[46px] px-4 font-black"
                    aria-label="Kirim pertanyaan lanjutan"
                  >
                    KIRIM
                  </Button>
                </form>
              </div>
              <div className="flex flex-col gap-2.5">
                <Button
                  variant="primary"
                  size="hero"
                  fullWidth
                  onClick={handleRetake}
                  icon={<Camera className="w-5 h-5 stroke-[2.5]" />}
                  aria-label="Foto soal lain"
                >
                  {activeSession ? 'SOAL BERIKUTNYA' : 'FOTO SOAL LAIN'}
                </Button>

                {activeSession && (
                  <Link href={`/sessions?selected=${activeSession.id}`} className="w-full block">
                    <Button variant="accent-yellow" size="md" fullWidth>
                      KEMBALI KE SESI ({activeSession.title})
                    </Button>
                  </Link>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setMode('identified')}
                    icon={<RotateCcw className="w-4 h-4 stroke-[2.5]" />}
                  >
                    Lihat Soal
                  </Button>
                  <Link href="/" className="w-full block">
                    <Button variant="secondary" size="md" fullWidth>
                      Beranda
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 6. LIVE CAMERA VIEWFINDER */}
        {mode === 'camera' && (
          <div className="relative w-full rounded-2xl overflow-hidden border-[4px] border-[#111111] shadow-[7px_7px_0_#111111] bg-black aspect-[3/4] flex flex-col justify-between select-none">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-6 sm:inset-8 border-2 border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between">
                <div className="w-7 h-7 border-t-4 border-l-4 border-[#FFD447]" />
                <div className="w-7 h-7 border-t-4 border-r-4 border-[#FFD447]" />
              </div>
              <p className="text-center text-xs font-bold text-white bg-black/70 py-1 px-2.5 rounded-lg mx-auto backdrop-blur-xs border border-white/20">
                Arahkan kamera tepat ke teks soal
              </p>
              <div className="flex justify-between">
                <div className="w-7 h-7 border-b-4 border-l-4 border-[#FFD447]" />
                <div className="w-7 h-7 border-b-4 border-r-4 border-[#FFD447]" />
              </div>
            </div>

            <div className="relative z-10 p-3.5 flex justify-between items-center">
              <span className="text-[11px] font-black uppercase tracking-wider bg-[#D94336] text-white px-2.5 py-1 rounded-lg border-2 border-[#111111] shadow-[2px_2px_0_#111111]">
                Kamera Aktif
              </span>
              <button
                type="button"
                onClick={handleResetToIdle}
                aria-label="Tutup Kamera"
                className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-white border-2 border-[#111111] shadow-[2px_2px_0_#111111] flex items-center justify-center btn-tactile active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-[#111111]"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="relative z-10 p-5 flex items-center justify-around bg-gradient-to-t from-black/85 via-black/40 to-transparent">
              <button
                type="button"
                onClick={handleGalleryClick}
                aria-label="Pilih foto dari Galeri"
                className="w-12 h-12 rounded-xl bg-white border-2 border-[#111111] shadow-[2px_2px_0_#111111] flex items-center justify-center btn-tactile cursor-pointer"
              >
                <ImageIcon className="w-6 h-6 text-[#111111] stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={captureFrame}
                aria-label="Ambil Foto Soal"
                className="w-20 h-20 rounded-full bg-[#D94336] border-[4px] border-[#111111] shadow-[4px_4px_0_#111111] flex items-center justify-center btn-tactile-hero active:translate-x-1 active:translate-y-1 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full border-2 border-white bg-white/20" />
              </button>

              <div className="w-12 h-12" aria-hidden="true" />
            </div>
          </div>
        )}

        {/* 7. PREVIEW SCREEN (MODE === 'preview') */}
        {mode === 'preview' && imageInfo && (
          <div className="flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden border-[3px] border-[#111111] shadow-[6px_6px_0_#111111] bg-white">
              <div className="p-3 bg-[#FFD447] border-b-[3px] border-[#111111] flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5] text-[#111111]" />
                  Pratinjau Foto ({imageInfo.source === 'camera' ? 'Kamera' : 'Galeri'})
                </span>
                {imageInfo.sizeBytes && (
                  <Badge variant="dark" className="text-[10px] py-0 px-2">
                    {formatSize(imageInfo.sizeBytes)}
                  </Badge>
                )}
              </div>

              <div className="w-full bg-[#111111]/5 p-2 flex items-center justify-center min-h-[220px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageInfo.url}
                  alt="Pratinjau foto soal yang dipindai"
                  className="w-full max-h-[380px] object-contain rounded-lg"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                size="hero"
                fullWidth
                disabled={isExtracting}
                onClick={handleExtractQuestion}
                icon={
                  isExtracting ? (
                    <Loader2 className="w-6 h-6 stroke-[3] animate-spin" />
                  ) : (
                    <Check className="w-6 h-6 stroke-[3]" />
                  )
                }
                aria-label="Gunakan foto ini untuk diproses"
              >
                {isExtracting ? 'MEMPROSES...' : 'GUNAKAN FOTO'}
              </Button>

              <Button
                variant="secondary"
                size="md"
                fullWidth
                disabled={isExtracting}
                onClick={handleRetake}
                icon={<RotateCcw className="w-5 h-5 stroke-[2.5]" />}
                aria-label="Ambil ulang foto"
              >
                FOTO ULANG
              </Button>
            </div>
          </div>
        )}

        {/* 8. PREPARATION / IDLE SCREEN (MODE === 'idle') */}
        {mode === 'idle' && (
          <div className="flex flex-col gap-5">
            <Card variant="white" shadow="lg" className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-[#D94336] text-white border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] flex items-center justify-center mb-4">
                <Camera className="w-8 h-8 stroke-[2.5]" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#111111] uppercase tracking-tight">
                Scan Soal
              </h2>

              <p className="text-xs sm:text-sm text-[#6F6A67] font-medium max-w-xs mt-2 mb-6 leading-relaxed">
                Foto soal menggunakan kamera atau pilih gambar dari galeri.
              </p>

              <div className="w-full flex flex-col gap-3">
                <Button
                  variant="primary"
                  size="hero"
                  fullWidth
                  onClick={startCamera}
                  disabled={isStartingCamera}
                  icon={
                    isStartingCamera ? (
                      <RefreshCw className="w-6 h-6 stroke-[2.5] animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 stroke-[2.5]" />
                    )
                  }
                  aria-label="Buka Kamera untuk scan soal"
                >
                  {isStartingCamera ? 'MEMBUKA KAMERA...' : 'BUKA KAMERA'}
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={handleGalleryClick}
                  icon={<ImageIcon className="w-5 h-5 stroke-[2.5]" />}
                  aria-label="Pilih gambar soal dari galeri"
                >
                  PILIH DARI GALERI
                </Button>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card variant="yellow" shadow="sm" className="p-3.5">
                <span className="text-[10px] font-black uppercase tracking-wider block text-[#111111]">
                  TIPS 1
                </span>
                <p className="text-xs font-bold text-[#111111] mt-1 leading-snug">
                  Pastikan pencahayaan cukup dan teks terbaca jelas.
                </p>
              </Card>

              <Card variant="blue" shadow="sm" className="p-3.5">
                <span className="text-[10px] font-black uppercase tracking-wider block text-[#111111]">
                  TIPS 2
                </span>
                <p className="text-xs font-bold text-[#111111] mt-1 leading-snug">
                  Fokuskan pada satu nomor soal per foto.
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
