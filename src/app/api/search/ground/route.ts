import { NextRequest, NextResponse } from 'next/server';
import { searchService } from '@/lib/ai/search-service';
import {
  GroundingInputSchema,
  GroundingApiResponse,
} from '@/lib/validation/grounding-schema';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse<GroundingApiResponse>> {
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

    // 3. Validate Request Payload against GroundingInputSchema
    const parseResult = GroundingInputSchema.safeParse(body);
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

    // 4. Execute Search & Grounding Pipeline via SearchService
    const groundedResult = await searchService.searchAndGround(parseResult.data);

    // 5. Return Structured Validated Result
    return NextResponse.json(
      {
        success: true,
        data: groundedResult,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Grounding API Route Error:', errorMessage);

    // Rate limit / Quota / Billing availability handling
    if (
      errorMessage.includes('429') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('RESOURCE_EXHAUSTED') ||
      errorMessage.includes('billing') ||
      errorMessage.includes('plan')
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Fitur cek web belum tersedia pada API saat ini.',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    // Server overload handling
    if (
      errorMessage.includes('503') ||
      errorMessage.includes('high demand') ||
      errorMessage.includes('overloaded')
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Antonius lagi susah mencari karena layanan sedang ramai. Coba lagi sebentar.',
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
          : 'Antonius gagal mencari sumber. Coba lagi.',
        code: 'GROUNDING_PROCESSING_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse<GroundingApiResponse>> {
  return NextResponse.json(
    {
      success: false,
      error: 'Method GET tidak diizinkan. Gunakan method POST.',
      code: 'METHOD_NOT_ALLOWED',
    },
    { status: 405 }
  );
}
