import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  ServiceUnavailableException
} from "@nestjs/common";
import { createDatabaseConfig, PrismaClient } from "@tigerpingpong/db";
import StripeConstructor from "stripe";

import { getStripeWebhookConfig } from "../config";

const SUPPORTED_EVENTS = new Set<string>(["checkout.session.completed"]);

interface StripeWebhookResponse {
  received: true;
  status: "duplicate" | "ignored" | "recorded";
  type: string;
}

@Injectable()
export class StripeWebhookService implements OnModuleDestroy {
  private readonly logger = new Logger(StripeWebhookService.name);
  private prisma: PrismaClient | null = null;

  async onModuleDestroy(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }

  async receiveWebhook(
    rawBody: Buffer | undefined,
    signature: string | string[] | undefined
  ): Promise<StripeWebhookResponse> {
    if (!signature || (Array.isArray(signature) && signature.length === 0)) {
      throw new BadRequestException({
        message: "Stripe signature is required."
      });
    }

    const webhookSecret = this.readWebhookSecret();

    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      throw new BadRequestException({
        message: "Stripe webhook payload is required."
      });
    }

    const event = this.verifyWebhookEvent(rawBody, signature, webhookSecret);
    const supported = SUPPORTED_EVENTS.has(event.type);
    const duplicate = await this.recordWebhookEvent(event.id, event.type);
    const status = duplicate ? "duplicate" : supported ? "recorded" : "ignored";

    this.logger.log(
      `Stripe webhook ${status}: eventId=${event.id} eventType=${event.type}`
    );

    return {
      received: true,
      status,
      type: event.type
    };
  }

  private readWebhookSecret(): string {
    try {
      return getStripeWebhookConfig().stripeWebhookSecret;
    } catch {
      throw new ServiceUnavailableException({
        message: "Stripe webhook is not configured."
      });
    }
  }

  private verifyWebhookEvent(rawBody: Buffer, signature: string | string[], webhookSecret: string) {
    try {
      return StripeConstructor.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException({
        message: "Stripe webhook signature verification failed."
      });
    }
  }

  private async recordWebhookEvent(stripeEventId: string, type: string): Promise<boolean> {
    try {
      await this.getPrisma().stripeWebhookEvent.create({
        data: {
          stripeEventId,
          type
        }
      });

      return false;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        return true;
      }

      throw new ServiceUnavailableException({
        message: "Stripe webhook event could not be recorded."
      });
    }
  }

  private getPrisma(): PrismaClient {
    if (!this.prisma) {
      try {
        const config = createDatabaseConfig(process.env);

        this.prisma = new PrismaClient({
          datasources: {
            db: {
              url: config.databaseUrl
            }
          }
        });
      } catch {
        throw new ServiceUnavailableException({
          message: "Stripe webhook database is not configured."
        });
      }
    }

    return this.prisma;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return this.isRecord(error) && error.code === "P2002";
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
