import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

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
  reliabilityScore?:
    | "on_time"
    | "sometimes_late"
    | "consistently_late"
    | "no_data";
  avgDaysLate?: number | null;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  amount: number;
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
  reliabilityScore:
    | "on_time"
    | "sometimes_late"
    | "consistently_late"
    | "no_data";
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

export interface Invoice {
  id: string;
  invoiceNumber: string;
  title: string;
  status: InvoiceStatus;
  dueDate: string;
  issueDate: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
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
  template:
    | "PRE_DUE_REMINDER"
    | "FIRST_OVERDUE"
    | "SECOND_OVERDUE"
    | "FINAL_NOTICE";
  offsetDays: number;
  channels: ("EMAIL" | "WHATSAPP")[];
  enabled: boolean;
}

export interface FollowUpSchedule {
  id: string;
  invoiceId: string;
  channel: "EMAIL" | "WHATSAPP";
  template:
    | "INVOICE_SENT"
    | "PRE_DUE_REMINDER"
    | "FIRST_OVERDUE"
    | "SECOND_OVERDUE"
    | "FINAL_NOTICE";
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
  channel: "EMAIL" | "WHATSAPP";
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

export const DEFAULT_FOLLOWUP_STEPS: FollowUpStepConfig[] = [
  {
    template: "PRE_DUE_REMINDER",
    offsetDays: -3,
    channels: ["EMAIL"],
    enabled: true,
  },
  {
    template: "FIRST_OVERDUE",
    offsetDays: 1,
    channels: ["EMAIL"],
    enabled: true,
  },
  {
    template: "SECOND_OVERDUE",
    offsetDays: 7,
    channels: ["EMAIL"],
    enabled: true,
  },
  {
    template: "FINAL_NOTICE",
    offsetDays: 14,
    channels: ["EMAIL"],
    enabled: true,
  },
];

export const buildDefaultFollowUpSteps = (
  hasPhone: boolean,
): FollowUpStepConfig[] => {
  const channels: ("EMAIL" | "WHATSAPP")[] = hasPhone
    ? ["EMAIL", "WHATSAPP"]
    : ["EMAIL"];

  return [
    {
      template: "PRE_DUE_REMINDER",
      offsetDays: -3,
      channels: [...channels],
      enabled: true,
    },
    {
      template: "FIRST_OVERDUE",
      offsetDays: 1,
      channels: [...channels],
      enabled: true,
    },
    {
      template: "SECOND_OVERDUE",
      offsetDays: 7,
      channels: [...channels],
      enabled: true,
    },
    {
      template: "FINAL_NOTICE",
      offsetDays: 14,
      channels: [...channels],
      enabled: true,
    },
  ];
};

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { "Content-Type": "application/json" },
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newToken = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch {
            this.clearTokens();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      },
    );
  }

  private getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }

  private getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  }

  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }

  clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  hasTokens(): boolean {
    return !!this.getAccessToken();
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token available");

    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.client
      .post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        "/api/auth/refresh",
        { refreshToken },
      )
      .then((response) => {
        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data!;
        this.setTokens(accessToken, newRefreshToken);
        return accessToken;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  async register(data: RegisterInput): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>(
      "/api/auth/register",
      data,
    );
    const result = response.data.data!;
    this.setTokens(result.accessToken, result.refreshToken);
    return result;
  }

  async login(data: LoginInput): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>(
      "/api/auth/login",
      data,
    );
    const result = response.data.data!;
    this.setTokens(result.accessToken, result.refreshToken);
    return result;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      await this.client
        .post("/api/auth/logout", { refreshToken })
        .catch(() => {});
    }
    this.clearTokens();
  }

  async getMe(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>("/api/auth/me");
    return response.data.data!;
  }

  async updateProfile(data: UpdateProfileInput): Promise<User> {
    const response = await this.client.patch<ApiResponse<User>>(
      "/api/auth/profile",
      data,
    );
    return response.data.data!;
  }

  async getClients(): Promise<Client[]> {
    const response =
      await this.client.get<ApiResponse<Client[]>>("/api/clients");
    return response.data.data!;
  }

  async getClient(id: string): Promise<Client> {
    const response = await this.client.get<ApiResponse<Client>>(
      `/api/clients/${id}`,
    );
    return response.data.data!;
  }

  async getClientStats(id: string): Promise<ClientStats> {
    const response = await this.client.get<ApiResponse<ClientStats>>(
      `/api/clients/${id}/stats`,
    );
    return response.data.data!;
  }

  async createClient(data: CreateClientInput): Promise<Client> {
    const response = await this.client.post<ApiResponse<Client>>(
      "/api/clients",
      data,
    );
    return response.data.data!;
  }

  async updateClient(
    id: string,
    data: Partial<CreateClientInput>,
  ): Promise<Client> {
    const response = await this.client.patch<ApiResponse<Client>>(
      `/api/clients/${id}`,
      data,
    );
    return response.data.data!;
  }

  async deleteClient(id: string): Promise<void> {
    await this.client.delete(`/api/clients/${id}`);
  }

  async getInvoices(status?: string): Promise<Invoice[]> {
    const params = status ? { status } : {};
    const response = await this.client.get<ApiResponse<Invoice[]>>(
      "/api/invoices",
      { params },
    );
    return response.data.data!;
  }

  async getInvoice(id: string): Promise<Invoice> {
    const response = await this.client.get<ApiResponse<Invoice>>(
      `/api/invoices/${id}`,
    );
    return response.data.data!;
  }

  async createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
    const response = await this.client.post<ApiResponse<Invoice>>(
      "/api/invoices",
      data,
    );
    return response.data.data!;
  }

  async updateInvoice(id: string, data: UpdateInvoiceInput): Promise<Invoice> {
    const response = await this.client.patch<ApiResponse<Invoice>>(
      `/api/invoices/${id}`,
      data,
    );
    return response.data.data!;
  }

  async deleteInvoice(id: string): Promise<void> {
    await this.client.delete(`/api/invoices/${id}`);
  }

  async sendInvoice(
    id: string,
    channels: ("EMAIL" | "WHATSAPP")[],
    followUpConfig?: FollowUpStepConfig[],
  ): Promise<{ results: Record<string, boolean>; invoiceNumber: string }> {
    const response = await this.client.post<
      ApiResponse<{ results: Record<string, boolean>; invoiceNumber: string }>
    >(`/api/invoices/${id}/send`, { channels, followUpConfig });
    return response.data.data!;
  }

  async downloadInvoicePDF(id: string): Promise<Blob> {
    const response = await this.client.get(`/api/invoices/${id}/pdf`, {
      responseType: "blob",
    });
    return response.data;
  }

  async updateInvoiceStatus(
    id: string,
    status: InvoiceStatus,
  ): Promise<Invoice> {
    const response = await this.client.patch<ApiResponse<Invoice>>(
      `/api/invoices/${id}/status`,
      { status },
    );
    return response.data.data!;
  }

  async getPaymentLink(
    id: string,
    regenerate?: boolean,
  ): Promise<PaymentLinkResponse> {
    const params = regenerate ? { regenerate: "true" } : {};
    const response = await this.client.get<ApiResponse<PaymentLinkResponse>>(
      `/api/invoices/${id}/payment-link`,
      { params },
    );
    return response.data.data!;
  }

  async logPayment(data: LogPaymentInput): Promise<Payment> {
    const response = await this.client.post<ApiResponse<Payment>>(
      "/api/payments",
      data,
    );
    return response.data.data!;
  }

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    const response = await this.client.get<ApiResponse<Payment[]>>(
      `/api/payments/invoice/${invoiceId}`,
    );
    return response.data.data!;
  }

  async deletePayment(id: string): Promise<void> {
    await this.client.delete(`/api/payments/${id}`);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response =
      await this.client.get<ApiResponse<DashboardStats>>("/api/dashboard");
    return response.data.data!;
  }

  async getFollowUpActivity(invoiceId: string): Promise<FollowUpActivity> {
    const response = await this.client.get<ApiResponse<FollowUpActivity>>(
      `/api/invoices/${invoiceId}/followups`,
    );
    return response.data.data!;
  }

  async previewFollowUp(
    invoiceId: string,
    template: string,
    channel: string,
  ): Promise<FollowUpPreviewResponse> {
    const response = await this.client.post<
      ApiResponse<FollowUpPreviewResponse>
    >(`/api/invoices/${invoiceId}/followups/preview`, { template, channel });
    return response.data.data!;
  }

  async triggerFollowUp(
    invoiceId: string,
    scheduleId: string,
    note?: string,
  ): Promise<void> {
    await this.client.post(
      `/api/invoices/${invoiceId}/followups/${scheduleId}/trigger`,
      { note },
    );
  }

  async escalateFollowUp(
    invoiceId: string,
    template: string,
    channel: string,
    note?: string,
  ): Promise<void> {
    await this.client.post(`/api/invoices/${invoiceId}/followups/escalate`, {
      template,
      channel,
      note,
    });
  }

  async pauseFollowUps(invoiceId: string): Promise<{ count: number }> {
    const response = await this.client.patch<ApiResponse<{ count: number }>>(
      `/api/invoices/${invoiceId}/followups/pause`,
    );
    return response.data.data!;
  }

  async resumeFollowUps(invoiceId: string): Promise<{ count: number }> {
    const response = await this.client.patch<ApiResponse<{ count: number }>>(
      `/api/invoices/${invoiceId}/followups/resume`,
    );
    return response.data.data!;
  }

  async cancelFollowUp(invoiceId: string, scheduleId: string): Promise<void> {
    await this.client.delete(
      `/api/invoices/${invoiceId}/followups/${scheduleId}`,
    );
  }

  async getFollowUpAnalytics(): Promise<FollowUpAnalytics> {
    const response = await this.client.get<ApiResponse<FollowUpAnalytics>>(
      "/api/analytics/followups",
    );
    return response.data.data!;
  }
}

export const api = new ApiClient();
