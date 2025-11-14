// User Service
// This file contains user management business logic

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUtils } from '../auth/authentication';
import { User } from '../entities/user.entity';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'customer' | 'admin' | 'staff';
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'customer' | 'admin' | 'staff';
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new user
   * @param createUserDto - User creation data
   * @returns Created user (without password)
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(createUserDto.password);

    // Create user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    const { password, ...result } = savedUser;
    return result;
  }

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User object
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Find user by email
   * @param email - User email
   * @returns User object
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * Get all users with pagination
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated users
   */
  async findAll(page = 1, limit = 10): Promise<{
    users: Omit<User, 'password'>[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt', 'updatedAt'],
    });

    return {
      users,
      total,
      page,
      limit,
    };
  }

  /**
   * Update user
   * @param id - User ID
   * @param updateUserDto - Update data
   * @returns Updated user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    const user = await this.findById(id);

    // Check if email is being updated and if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email is already taken');
      }
    }

    // Update user
    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    const { password, ...result } = updatedUser;
    return result;
  }

  /**
   * Delete user
   * @param id - User ID
   */
  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  /**
   * Validate user password
   * @param user - User object
   * @param password - Plain text password
   * @returns True if password is valid
   */
  async validatePassword(user: User, password: string): Promise<boolean> {
    return AuthUtils.comparePassword(password, user.password);
  }

  /**
   * Update user password
   * @param id - User ID
   * @param newPassword - New password
   */
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findById(id);
    const hashedPassword = await AuthUtils.hashPassword(newPassword);

    user.password = hashedPassword;
    await this.userRepository.save(user);
  }

  /**
   * Get user statistics
   * @returns User statistics
   */
  async getStatistics(): Promise<{
    totalUsers: number;
    customers: number;
    admins: number;
    staff: number;
  }> {
    const [totalUsers, customers, admins, staff] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { role: 'customer' } }),
      this.userRepository.count({ where: { role: 'admin' } }),
      this.userRepository.count({ where: { role: 'staff' } }),
    ]);

    return {
      totalUsers,
      customers,
      admins,
      staff,
    };
  }

  /**
   * Search users by name or email
   * @param query - Search query
   * @param page - Page number
   * @param limit - Items per page
   * @returns Search results
   */
  async search(query: string, page = 1, limit = 10): Promise<{
    users: Omit<User, 'password'>[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [users, total] = await this.userRepository
      .createQueryBuilder('user')
      .where(
        'user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query',
        { query: `%${query}%` }
      )
      .select(['user.id', 'user.email', 'user.firstName', 'user.lastName', 'user.role', 'user.createdAt', 'user.updatedAt'])
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      users,
      total,
      page,
      limit,
    };
  }
}
