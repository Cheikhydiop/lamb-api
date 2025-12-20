// utils/RequestFilters.ts
import { RequestStatus, RequestType, RequestChannel, Priority } from '@prisma/client';

export interface RequestFilters {
  status?: RequestStatus;
  type?: RequestType;
  priority?: Priority;
  channel?: RequestChannel;
  createdById?: string;
  assignedToId?: string;
  projectId?: string;
  search?: string;
  page?: number;
  limit?: number;

  cursor?: any;

  // Filtres de recherche
  userId?: string;
  createdAt?: Date | { gte?: Date; lte?: Date };
  dateRange?: {
    start: Date;
    end: Date;
  };

  // Options Prisma
  orderBy?: any;
  include?: any;
  
  // Autres filtres métier selon vos besoins
  category?: string;
  assignedTo?: string;
}
