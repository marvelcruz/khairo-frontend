import type {
  CatalogueItem,
} from "./catalogue";

export type SubscriptionStatus =
  | "pending"
  | "active"
  | "grace_period"
  | "paused"
  | "expired"
  | "cancelled";

export type SubscriptionClient = {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  program?: string;
  status?: string;
};

export type Subscription = {
  _id: string;
  client?: SubscriptionClient | null;
  program: string;
  offering?: CatalogueItem | null;
  amount: number;
  cycleDays?: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  status: SubscriptionStatus;
  autoRenew?: boolean;
  lastPaymentAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SubscriptionListResponse = {
  success: boolean;
  subscriptions: Subscription[];
  statuses?: SubscriptionStatus[];
};
