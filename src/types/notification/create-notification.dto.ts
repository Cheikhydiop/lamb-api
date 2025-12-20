import { IsEnum, IsNotEmpty, IsOptional, IsObject, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationMetadata,
} from '../../types/notification-types';
import { User } from '../../entity/User';
import { Organization } from '../../entity/Organization';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsNotEmpty()
  recipient: User;

  @IsNotEmpty()
  organization: Organization;

  @IsOptional()
  @IsObject()
  metadata?: NotificationMetadata;

  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsBoolean()
  requiresAcknowledgement?: boolean;

  @IsOptional()
  expiresAt?: Date;
}
