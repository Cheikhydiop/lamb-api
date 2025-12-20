import { PrismaClient, Request, RequestStatus, RequestType, RequestChannel, Priority, Prisma } from '@prisma/client';
import { ValidationError } from '../../errors/customErrors';
import { paginateOrFindAll } from '../../utils/paginate.helpers';
import { IRequestRepository } from '../interfaces/IRequestRepository';
import { RequestFilters } from '../../utils/RequestFilters';


export class ImplRequestRepository implements IRequestRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getAllRequests(filters: RequestFilters = {}): Promise<{
    requests: Request[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      status,
      type,
      priority,
      channel,
      createdById,
      assignedToId,
      projectId,
      search,
      page = 1,
      limit = 10,
    } = filters;

    if (page < 1) {
      throw new ValidationError('Le numéro de page doit être supérieur ou égal à 1');
    }
    if (limit < 1 || limit > 100) {
      throw new ValidationError('La limite doit être comprise entre 1 et 100');
    }

    const where: Prisma.RequestWhereInput = {
      ...(status && { status }),
      ...(type && { type }),
      ...(priority && { priority }),
      ...(channel && { channel }),
      ...(createdById && { createdById }),
      ...(assignedToId && { assignedToId }),
      ...(projectId && { projectId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const include = {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      location: true,
    };

    const result = await paginateOrFindAll(this.prisma, 'request', {
      page,
      limit,
      findOptions: {
        where,
        include,
        orderBy: { createdAt: 'desc' },
      },
    });

    return {
      requests: result.data,
      total: typeof result.total === 'number' ? result.total : result.data.length,
      page: typeof result.page === 'number' ? result.page : page,
      totalPages: typeof result.lastPage === 'number' ? result.lastPage : 1,
    };
  }

  async getRequestDetails(id: string): Promise<Request | null> {
    try {
      if (!id || typeof id !== 'string') {
        throw new ValidationError('ID de la requête requis et doit être une chaîne de caractères');
      }

      const request = await this.prisma.request.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
              phoneNumber: true,
              jobTitle: true,
              department: true,
              organization: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
              phoneNumber: true,
              jobTitle: true,
              department: true,
              organization: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              startDate: true,
              endDate: true,
              budget: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              region: true,
              country: true,
              latitude: true,
              longitude: true,
              description: true
            },
          },
          comments: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  role: true,
                },
              },
              attachments: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          attachments: {
            include: {
              uploadedBy: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
            orderBy: { uploadedAt: 'desc' },
          },
      
        },
      });

      return request;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(`Erreur lors de la récupération des détails de la requête: ${error.message}`);
    }

}

async getRequestsByOrganizationId(
  organizationId: string,
  filters: RequestFilters = {}
): Promise<{
  requests: Request[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const {
    status,
    type,
    priority,
    channel,
    createdById,
    assignedToId,
    projectId,
    search,
    page = 1,
    limit = 10,
  } = filters;

  if (!organizationId) {
    throw new ValidationError("L'identifiant de l'organisation est requis.");
  }

  const where: Prisma.RequestWhereInput = {
    organisationOrgId: organizationId,
    ...(status && { status }),
    ...(type && { type }),
    ...(priority && { priority }),
    ...(channel && { channel }),
    ...(createdById && { createdById }),
    ...(assignedToId && { assignedToId }),
    ...(projectId && { projectId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const include = {
    createdBy: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
    assignedTo: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
    project: {
      select: {
        id: true,
        name: true,
        status: true,
      },
    },
    location: true,
  };

  const result = await paginateOrFindAll(this.prisma, 'request', {
    page,
    limit,
    findOptions: {
      where,
      include,
      orderBy: { createdAt: 'desc' },
    },
  });

  return {
    requests: result.data,
    total: typeof result.total === 'number' ? result.total : result.data.length,
    page: typeof result.page === 'number' ? result.page : page,
    totalPages: typeof result.lastPage === 'number' ? result.lastPage : 1,
  };
}

}