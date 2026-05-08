export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: unknown;
}

export interface User {
  id: string;
  name: string;
  email: string;
  businessName: string | null;
  phone: string | null;
  logoUrl: string | null;
  createdAt: string;
  paystackSubaccountCode: string | null;
  paystackSubaccountActive: boolean;
  ultramsgInstanceId: string | null;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { invoices: number };
  invoices?: Invoice[];
  reliabilityScore?: ReliabilityScore;
  avgDaysLate?: number | null;
}

export type ReliabilityScore =
  | "on_time"
  | "sometimes_late"
  | "consistently_late"
  | "no_data";

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  total: string | number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: string | number;
  method: string | null;
  reference: string | null;
  note: string | null;
  paidAt: string;
  createdAt: string;
}

export interface FollowUpLog {
  id: string;
  channel: string;
  template?: string | null;
  message: string;
  status: string;
  sentAt: string;
}

export interface FollowUpAttribution {
  followUpNumber: number;
  channel: string;
  template: string | null;
  sentAt: string;
}

export interface ClientStats {
  avgDaysToPayment: number | null;
  avgDaysLate: number | null;
  reliabilityScore: ReliabilityScore;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalChases: number;
}

export interface OverdueClientEntry {
  clientId: string;
  name: string;
  email: string;
  phone: string | null;
  totalOutstanding: number;
  invoiceCount: number;
  oldestDueDays: number;
  mostOverdueInvoiceId: string;
}

export type InvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type FollowUpStatusType =
  | "PENDING"
  | "SENT"
  | "FAILED"
  | "CANCELLED"
  | "PAUSED";

export type FollowUpTemplateType =
  | "INVOICE_SENT"
  | "PRE_DUE_REMINDER"
  | "FIRST_OVERDUE"
  | "SECOND_OVERDUE"
  | "FINAL_NOTICE";

export type FollowUpChannelType = "EMAIL" | "WHATSAPP";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  title: string;
  status: InvoiceStatus;
  dueDate: string;
  issueDate: string;
  currency: string;
  subtotal: string | number;
  tax: string | number;
  total: string | number;
  notes: string | null;
  paystackRef: string | null;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  userId: string;
  client?: Client;
  user?: User;
  items?: InvoiceItem[];
  payments?: Payment[];
  followUpLogs?: FollowUpLog[];
  followUpSchedules?: Array<{ id: string; status: string }>;
  followUpAttribution?: FollowUpAttribution | null;
}

export interface NeedsAttentionEntry {
  invoiceId: string;
  invoiceNumber: string;
  title: string;
  clientName: string;
  clientId: string;
  amount: number;
  daysOverdue: number;
  reason: "no_sequence" | "failed_send" | "sequence_paused";
}

export interface NextFollowUp {
  invoiceId: string;
  invoiceNumber: string;
  title: string;
  clientName: string;
  template: string;
  channel: string;
  scheduledAt: string;
}

export interface DashboardStats {
  overview: {
    totalInvoices: number;
    totalRevenue: number;
    outstandingAmount: number;
    totalRecovered: number;
    unprotectedOutstanding: number;
    pendingCollection: number;
    atRiskAmount: number;
    agentsActive: number;
    statusBreakdown: {
      draft: number;
      pending: number;
      partial: number;
      paid: number;
      overdue: number;
      cancelled: number;
    };
  };
  recentInvoices: (Invoice & {
    client: { name: string };
    followUpSchedules?: Array<{ id: string; status: string }>;
  })[];
  monthlyRevenue: { month: string; revenue: number }[];
  topOverdueClients: OverdueClientEntry[];
  needsAttention: NeedsAttentionEntry[];
  nextFollowUp: NextFollowUp | null;
}

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceInput {
  title: string;
  clientId: string;
  dueDate: string;
  currency?: string;
  tax?: number;
  notes?: string;
  items: CreateInvoiceItemInput[];
}

export interface UpdateInvoiceInput extends Partial<
  Omit<CreateInvoiceInput, "items">
> {
  items?: CreateInvoiceItemInput[];
}

export interface LogPaymentInput {
  invoiceId: string;
  amount: number;
  method?: string;
  reference?: string;
  note?: string;
  paidAt?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  businessName?: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  name?: string;
  businessName?: string;
  phone?: string;
  logoUrl?: string;
  paystackSubaccountCode?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    businessName: string | null;
  };
}

export interface PaymentLinkResponse {
  authorizationUrl: string;
  reference: string;
}

export interface FollowUpStepConfig {
  template: Exclude<FollowUpTemplateType, "INVOICE_SENT">;
  offsetDays: number;
  channels: FollowUpChannelType[];
  enabled: boolean;
}

export interface FollowUpSchedule {
  id: string;
  invoiceId: string;
  channel: FollowUpChannelType;
  template: FollowUpTemplateType;
  scheduledAt: string;
  sentAt: string | null;
  status: FollowUpStatusType;
  createdAt: string;
}

export interface FollowUpActivity {
  schedules: FollowUpSchedule[];
  logs: FollowUpLog[];
}

export interface FollowUpPreviewResponse {
  email: { subject: string; html: string };
  whatsapp: string;
  channel: string;
}

export interface TemplateAnalytics {
  template: string;
  sentCount: number;
  uniqueInvoicesSent: number;
  conversions: number;
  conversionRate: number;
}

export interface ChannelAnalytics {
  channel: FollowUpChannelType;
  sentCount: number;
  openCount: number;
  clickCount: number;
  conversions: number;
  conversionRate: number;
}

export interface MonthlyTrendPoint {
  month: string;
  followUpsSent: number;
  paymentsRecovered: number;
}

export interface FollowUpAnalytics {
  recoveredThisMonth: number;
  totalRecovered: number;
  totalFollowUpsSent: number;
  templateStats: TemplateAnalytics[];
  channelStats: ChannelAnalytics[];
  monthlyTrend: MonthlyTrendPoint[];
  bestPerformingTemplate: string | null;
}

export interface WhatsAppStatus {
  connected: boolean;
  status: string;
  qrCode: string | null;
  phoneConnected: string | null;
  instanceId: string | null;
}
