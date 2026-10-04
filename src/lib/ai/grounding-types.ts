import { GroundingInput, GroundedSearchResult } from '@/lib/validation/grounding-schema';

export interface ISearchProvider {
  name: string;
  searchAndGround(input: GroundingInput): Promise<GroundedSearchResult>;
}
