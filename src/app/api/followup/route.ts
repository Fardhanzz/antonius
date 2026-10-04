import { NextRequest, NextResponse } from 'next/server';
import { followUpService } from '@/lib/ai/followup-service';
import { FollowUpInputSchema, FollowUpApiResponse } from '@/lib/validation/followup-schema';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse<FollowUpApiResponse>> {
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

    // 2. Parse Request JSON
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Format request tidak valid. Harus berupa JSON body.',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    // 3. Validate Request Payload against FollowUpInputSchema
    const parseResult = FollowUpInputSchema.safeParse(body);
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      return NextResponse.json(
        {
          success: false,
          error: `Data input pertanyaan tidak valid: ${fieldErrors}`,
          code: 'INVALID_INPUT',
        },
        { status: 400 }
      );
    }

    // 4. Execute Follow-up Pipeline via Service Abstraction
    const response = await followUpService.answerFollowUp(parseResult.data);

    // 5. Return Structured Validated Result
    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Follow-up API route error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';

    // Detect Rate Limiting (HTTP 429)
    if (
      errorMessage.includes('429') ||
      errorMessage.toLowerCase().includes('quota') ||
      errorMessage.toLowerCase().includes('rate limit')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Batas pemanggilan Gemini tercapai (rate limit). Silakan tunggu beberapa saat dan coba lagi.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      );
    }

    // Detect Temporary Provider Overload (HTTP 503 / High Demand)
    if (
      errorMessage.includes('503') ||
      errorMessage.includes('high demand') ||
      errorMessage.includes('Service Unavailable') ||
      errorMessage.includes('PROVIDER_OVERLOAD')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Antonius lagi susah mikir karena server sedang ramai. Coba lagi sebentar.',
          code: 'SERVER_OVERLOAD',
        },
        { status: 503 }
      );
    }

    // Controlled safe error response without leaking stack traces or internal secrets
    return NextResponse.json(
      {
        success: false,
        error: errorMessage.includes('GEMINI_API_KEY')
          ? errorMessage
          : 'Antonius lagi susah menjawab. Coba lagi.',
        code: 'FOLLOWUP_PROCESSING_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse<FollowUpApiResponse>> {
  return NextResponse.json(
    {
      success: false,
      error: 'Method GET tidak diizinkan. Gunakan method POST.',
      code: 'METHOD_NOT_ALLOWED',
    },
    { status: 405 }
  );
}
