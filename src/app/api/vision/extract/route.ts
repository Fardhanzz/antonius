import { NextRequest, NextResponse } from 'next/server';
import { visionService } from '@/lib/ai/vision-service';
import { ExtractApiResponse } from '@/lib/validation/question-schema';

export const runtime = 'nodejs';

// Max allowed image upload size: 15MB
const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export async function POST(req: NextRequest): Promise<NextResponse<ExtractApiResponse>> {
  try {
    // 1. Verify Server-Side API Key Configuration
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'GEMINI_API_KEY belum dikonfigurasi pada environment server.',
          code: 'MISSING_API_KEY',
        },
        { status: 500 }
      );
    }

    // 2. Parse Multipart Form Data
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Format request tidak valid. Harus berupa multipart/form-data.',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    // 3. Extract and Validate Image File
    const file = formData.get('image') as File | null;
    if (!file || typeof file === 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Gambar soal tidak ditemukan. Unggah gambar melalui form field "image".',
          code: 'MISSING_IMAGE',
        },
        { status: 400 }
      );
    }

    // Check MIME type
    if (!file.type || !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      // Fallback check if it starts with image/
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Format file tidak didukung. Harap unggah gambar JPG, PNG, atau WEBP.',
            code: 'INVALID_FILE_TYPE',
          },
          { status: 400 }
        );
      }
    }

    // Check File Size
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ukuran gambar melebihi batas maksimum 15MB.',
          code: 'IMAGE_TOO_LARGE',
        },
        { status: 413 }
      );
    }

    // 4. Convert to Binary Buffer safely
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Call Vision Service Abstraction
    const extractedData = await visionService.extractQuestion({
      buffer,
      mimeType: file.type || 'image/jpeg',
    });

    // 6. Return Structured Validated Result
    return NextResponse.json(
      {
        success: true,
        data: extractedData,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Vision extraction route error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';

    // Detect Rate Limiting (HTTP 429)
    if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate limit')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Batas pemanggilan Gemini tercapai (rate limit). Silakan tunggu beberapa saat dan coba lagi.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      );
    }

    // Controlled safe error response without leaking stack traces or internal secrets
    return NextResponse.json(
      {
        success: false,
        error: errorMessage.includes('GEMINI_API_KEY')
          ? errorMessage
          : 'Antonius gagal membaca soal dari gambar ini. Pastikan gambar jelas dan coba lagi.',
        code: 'VISION_PROCESSING_ERROR',
      },
      { status: 500 }
    );
  }
}
