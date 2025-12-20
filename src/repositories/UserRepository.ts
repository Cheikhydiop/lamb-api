import { PrismaClient, User, Wallet, UserRole } from '@prisma/client';
import { DatabaseError } from '../errors/customErrors';

export class UserRepository {
  constructor(private prisma: PrismaClient) { }

  // Méthode helper pour convertir BigInt en string de manière récursive
  private sanitizeBigInt<T>(data: T): T {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'bigint') {
      return String(data) as any;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeBigInt(item)) as any;
    }

    if (typeof data === 'object') {
      const sanitized: any = {};
      for (const key in data) {
        sanitized[key] = this.sanitizeBigInt(data[key]);
      }
      return sanitized;
    }

    return data;
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email }
      });
      return this.sanitizeBigInt(user);
    } catch (error: any) {
      throw new DatabaseError(`Failed to find user by email: ${error.message}`);
    }
  }

  async findByEmailWithWallet(email: string): Promise<(User & { wallet: Wallet | null }) | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { wallet: true }
      });
      return this.sanitizeBigInt(user);
    } catch (error: any) {
      throw new DatabaseError(`Failed to find user by email with wallet: ${error.message}`);
    }
  }

  async findByPhone(phone: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { phone }
      });
      return this.sanitizeBigInt(user);
    } catch (error: any) {
      throw new DatabaseError(`Failed to find user by phone: ${error.message}`);
    }
  }

  async findByIdWithWallet(userId: string): Promise<(User & { wallet: Wallet | null }) | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true }
      });
      return this.sanitizeBigInt(user);
    } catch (error: any) {
      throw new DatabaseError(`Failed to find user by ID with wallet: ${error.message}`);
    }
  }

  async create(userData: {
    name: string;
    phone: string;
    email: string;
    password: string;
    role?: UserRole;
    isActive?: boolean;
    isEmailVerified?: boolean;
  }): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: userData
      });
      return this.sanitizeBigInt(user);
    } catch (error: any) {
      throw new DatabaseError(`Failed to create user: ${error.message}`);
    }
  }

  async createUserWithWallet(userData: {
    name: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<{ user: User; wallet: Wallet }> {
    try {
      // Utiliser une transaction pour créer l'utilisateur et le portefeuille ensemble
      const result = await this.prisma.$transaction(async (tx) => {
        // Créer l'utilisateur
        const user = await tx.user.create({
          data: userData
        });

        // Créer le portefeuille automatiquement
        const wallet = await tx.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
            lockedBalance: 0
          }
        });

        return { user, wallet };
      });

      return this.sanitizeBigInt(result);
    } catch (error: any) {
      throw new DatabaseError(`Failed to create user with wallet: ${error.message}`);
    }
  }

  async update(userId: string, updateData: Partial<{
    name: string;
    phone: string;
    email: string;
    password: string;
    isActive: boolean;
    isEmailVerified: boolean;
    role: UserRole;
  }>): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: updateData
      });
      return this.sanitizeBigInt(user);
    } catch (error: any) {
      throw new DatabaseError(`Failed to update user: ${error.message}`);
    }
  }

  async updateLastLogin(userId: string, loginTime: Date): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastLogin: loginTime }
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to update last login: ${error.message}`);
    }
  }

  async delete(userId: string): Promise<void> {
    try {
      // Le portefeuille sera supprimé automatiquement grâce à onDelete: Cascade
      await this.prisma.user.delete({
        where: { id: userId }
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to delete user: ${error.message}`);
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    users: (User & { wallet: Wallet | null })[];
    total: number;
    pages: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          skip: offset,
          take: limit,
          include: { wallet: true },
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.user.count()
      ]);

      return this.sanitizeBigInt({
        users,
        total,
        pages: Math.ceil(total / limit)
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to fetch users: ${error.message}`);
    }
  }

  // Dans UserRepository, ajoutez :
  async createWithWallet(userData: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    role: UserRole;
    isActive: boolean;
    isEmailVerified: boolean;
  }): Promise<{ user: User; wallet: Wallet }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Créer l'utilisateur
        const user = await tx.user.create({
          data: {
            email: userData.email,
            password: userData.password,
            name: userData.name || '',  // Prisma typically expects string if required or null if optional, but here error says undefined not assignable to string. If field is required in schema, must provide string. If optional, likely string | null. Assuming required or defaulting to empty string based on error. Actually, let's use || null if schema allows, but error "Type 'undefined' is not assignable to type 'string'" suggests strictly string.
            phone: userData.phone || '',
            role: userData.role,
            isActive: userData.isActive,
            isEmailVerified: userData.isEmailVerified,
          }
        });

        // Créer le wallet associé
        const wallet = await tx.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
            lockedBalance: 0
          }
        });

        return { user, wallet };
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to create user with wallet: ${error.message}`);
    }
  }


  // ----------------------------------------------------
  // NOUVELLE MÉTHODE À AJOUTER DANS UserRepository.ts
  // ----------------------------------------------------
  async findById(userId: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      // Utilisation de la méthode helper existante
      return this.sanitizeBigInt(user);
    } catch (error: any) {
      throw new DatabaseError(`Failed to find user by ID: ${error.message}`);
    }
  }

  // ----------------------------------------------------
  // MÉTHODE À AJOUTER DANS UserRepository.ts
  // ----------------------------------------------------
  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });
    } catch (error: any) {
      throw new DatabaseError(`Failed to update password for user: ${error.message}`);
    }
  }
  // ----------------------------------------------------
  // ----------------------------------------------------
}