import { Request, RequestStatus, RequestType, RequestChannel, Priority } from '@prisma/client';

export interface IRequestRepository {
  getAllRequests(filters?: {
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
  }): Promise<{
    requests: Request[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  getRequestDetails(id: string): Promise<Request | null>;

  // Ajout de la méthode pour récupérer les requests par organisation
  getRequestsByOrganizationId(
    organizationId: string,
    filters?: {
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
    }
  ): Promise<{
    requests: Request[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}

  // createRequest(requestData: {
  //   title: string;
  //   description?: string;
  //   type: RequestType;
  //   priority: Priority;
  //   channel: RequestChannel;
  //   status?: RequestStatus;
  //   createdById: string;
  //   assignedToId?: string;
  //   projectId?: string;
  //   locationId?: string;
  //   dueDate?: Date;
  //   estimatedHours?: number;
  //   actualHours?: number;
  //   tags?: string[];
  //   metadata?: any;
  // }): Promise<Request>;

  // updateRequest(id: string, updateData: Partial<{
  //   title: string;
  //   description: string;
  //   type: RequestType;
  //   priority: Priority;
  //   channel: RequestChannel;
  //   status: RequestStatus;
  //   assignedToId: string;
  //   projectId: string;
  //   locationId: string;
  //   dueDate: Date;
  //   estimatedHours: number;
  //   actualHours: number;
  //   tags: string[];
  //   metadata: any;
  // }>): Promise<Request>;

  // deleteRequest(id: string): Promise<boolean>;

  // assignRequest(requestId: string, assignedToId: string): Promise<Request>;

  // updateRequestStatus(requestId: string, status: RequestStatus): Promise<Request>;
