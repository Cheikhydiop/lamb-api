// dto/fighter.dto.ts
export interface CreateFighterDTO {
    name: string;
    nickname?: string;
    stable?: string;
    birthDate?: string | Date;
    nationality?: string;
    weight?: number;
    height?: number;
    wins?: number;
    losses?: number;
    draws?: number;
    isActive?: boolean;
  }
  
  export interface UpdateFighterDTO {
    name?: string;
    nickname?: string;
    stable?: string;
    birthDate?: string | Date;
    nationality?: string;
    weight?: number;
    height?: number;
    wins?: number;
    losses?: number;
    draws?: number;
    isActive?: boolean;
  }
  
  export interface FighterFiltersDTO {
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }
  
  export interface SearchFightersDTO {
    query: string;
    limit?: number;
  }