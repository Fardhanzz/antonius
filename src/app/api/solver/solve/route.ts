import { NextRequest, NextResponse } from 'next/server';
import { solverService } from '@/lib/ai/solver-service';
import { SolverInputSchema, SolveApiResponse } from '@/lib/validation/solver-schema';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse<SolveApiResponse>> {
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

    // 3. Validate Request Payload against SolverInputSchema
    const parseResult = SolverInputSchema.safeParse(body);
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json(
        {
          success: false,
          error: `Data input soal tidak valid: ${fieldErrors}`,
          code: 'INVALID_INPUT',
        },
        { status: 400 }
      );
    }

    // 4. Execute Solver Pipeline via Service Abstraction
    const solution = await solverService.solveQuestion(parseResult.data);

    // 5. Return Structured Validated Result
    return NextResponse.json(
      {
        success: true,
        data: solution,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Solver API route error:', error);

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
          : 'Antonius gagal memecahkan soal ini. Silakan coba lagi.',
        code: 'SOLVER_PROCESSING_ERROR',
      },
      { status: 500 }
    );
  }
}
