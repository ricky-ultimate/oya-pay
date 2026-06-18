import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import type {
  ApiResponse,
  AuthResponse,
  Client,
  ClientStats,
  CreateClientInput,
  CreateInvoiceInput,
  CreateTemplateInput,
  DashboardStats,
  FollowUpActivity,
  FollowUpAnalytics,
  FollowUpPreviewResponse,
  FollowUpStepConfig,
  Invoice,
  InvoiceStatus,
  InvoiceTemplate,
  InvoiceType,
  LoginInput,
  LogPaymentInput,
  Payment,
  PaymentLinkResponse,
  PaymentVerificationResult,
  RegisterInput,
  RegisterPendingResponse,
  ResendCodeResponse,
  UpdateInvoiceInput,
  UpdateProfileInput,
  UpdateTemplateInput,
  User,
  VerifyEmailInput,
  WhatsAppStatus,
} from "@/types";

export * from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

const DECIMAL_INVOICE_KEYS = ["subtotal", "tax", "total"] as const;
const DECIMAL_ITEM_KEYS = ["quantity", "unitPrice", "total"] as const;
const DECIMAL_PAYMENT_KEYS = ["amount"] as const;

function coerceInvoice(invoice: Record<string, unknown>): void {
  for (const key of DECIMAL_INVOICE_KEYS) {
    if (invoice[key] !== undefined) invoice[key] = Number(invoice[key]);
  }
  if (Array.isArray(invoice["items"])) {
    for (const item of invoice["items"] as Record<string, unknown>[]) {
      for (const key of DECIMAL_ITEM_KEYS) {
        if (item[key] !== undefined) item[key] = Number(item[key]);
      }
    }
  }
  if (Array.isArray(invoice["payments"])) {
    for (const payment of invoice["payments"] as Record<string, unknown>[]) {
      for (const key of DECIMAL_PAYMENT_KEYS) {
        if (payment[key] !== undefined) payment[key] = Number(payment[key]);
      }
    }
  }
}

function coerceApiResponse(data: unknown): void {
  if (!data || typeof data !== "object") return;
  const response = data as Record<string, unknown>;
  const payload = response["data"];
  if (!payload) return;

  if (Array.isArray(payload)) {
    for (const item of payload as Record<string, unknown>[]) {
      if (
        typeof item === "object" &&
        item !== null &&
        "invoiceNumber" in item
      ) {
        coerceInvoice(item);
      }
      if (
        typeof item === "object" &&
        item !== null &&
        "amount" in item &&
        "paidAt" in item
      ) {
        const payment = item as Record<string, unknown>;
        payment["amount"] = Number(payment["amount"]);
      }
    }
  } else if (typeof payload === "object" && payload !== null) {
    const obj = payload as Record<string, unknown>;
    if ("invoiceNumber" in obj) coerceInvoice(obj);
    if ("recentInvoices" in obj && Array.isArray(obj["recentInvoices"])) {
      for (const inv of obj["recentInvoices"] as Record<string, unknown>[]) {
        coerceInvoice(inv);
      }
    }
    if ("invoices" in obj && Array.isArray(obj["invoices"])) {
      for (const inv of obj["invoices"] as Record<string, unknown>[]) {
        coerceInvoice(inv);
      }
    }
  }
}

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse>;
    const responseData = axiosError.response?.data;
    if (responseData) {
      if (
        Array.isArray(responseData.errors) &&
        responseData.errors.length > 0
      ) {
        const firstError = responseData.errors[0] as
          | { message?: string }
          | undefined;
        if (firstError?.message) return firstError.message;
      }
      if (responseData.message) return responseData.message;
    }
    if (axiosError.message) return axiosError.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export class ApiError extends Error {
  status: number;
  errors: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export const buildDefaultFollowUpSteps = (
  hasPhone: boolean,
  invoiceType: InvoiceType = "STANDARD",
): FollowUpStepConfig[] => {
  const channels: ("EMAIL" | "WHATSAPP")[] = hasPhone
    ? ["EMAIL", "WHATSAPP"]
    : ["EMAIL"];

  if (invoiceType === "DEPOSIT") {
    return [
      {
        template: "PRE_DUE_REMINDER",
        offsetDays: -1,
        channels: [...channels],
        enabled: true,
      },
      {
        template: "FIRST_OVERDUE",
        offsetDays: 2,
        channels: [...channels],
        enabled: true,
      },
      {
        template: "SECOND_OVERDUE",
        offsetDays: 5,
        channels: [...channels],
        enabled: true,
      },
      {
        template: "FINAL_NOTICE",
        offsetDays: 10,
        channels: [...channels],
        enabled: true,
      },
    ];
  }

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

export const calculateDueDate = (invoiceType: InvoiceType): string => {
  const today = new Date();
  const days = invoiceType === "DEPOSIT" ? 5 : 14;
  const date = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  return date.toISOString().split("T")[0] ?? "";
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
      (response) => {
        coerceApiResponse(response.data);
        return response;
      },
      async (error: AxiosError<ApiResponse>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };
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
        const status = error.response?.status ?? 0;
        const responseData = error.response?.data;
        throw new ApiError(
          extractErrorMessage(error),
          status,
          responseData?.errors,
        );
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

  async register(data: RegisterInput): Promise<RegisterPendingResponse> {
    return this.registerInitiate(data);
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

  async verifyPaymentByReference(
    reference: string,
  ): Promise<PaymentVerificationResult> {
    const response = await this.client.get<
      ApiResponse<PaymentVerificationResult>
    >(`/api/paystack/verify/${encodeURIComponent(reference)}`);
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

  async getWhatsAppStatus(): Promise<WhatsAppStatus> {
    const response = await this.client.get<ApiResponse<WhatsAppStatus>>(
      "/api/whatsapp/status",
    );
    return response.data.data!;
  }

  async createSubaccount(data: {
    businessName: string;
    settlementBank: string;
    accountNumber: string;
    description?: string;
    primaryContactEmail?: string;
    primaryContactName?: string;
    primaryContactPhone?: string;
  }): Promise<{
    subaccountCode: string;
    businessName: string;
    settlementBank: string;
    accountNumber: string;
  }> {
    const response = await this.client.post<
      ApiResponse<{
        subaccountCode: string;
        businessName: string;
        settlementBank: string;
        accountNumber: string;
      }>
    >("/api/paystack/subaccount", data);
    return response.data.data!;
  }

  async verifyAndSaveSubaccount(code: string): Promise<void> {
    await this.client.post(`/api/paystack/subaccount/verify/${code}`);
  }

  async registerInitiate(
    data: RegisterInput,
  ): Promise<RegisterPendingResponse> {
    const response = await this.client.post<
      ApiResponse<RegisterPendingResponse>
    >("/api/auth/register", data);
    return response.data.data!;
  }

  async verifyEmail(data: VerifyEmailInput): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>(
      "/api/auth/verify",
      data,
    );
    const result = response.data.data!;
    this.setTokens(result.accessToken, result.refreshToken);
    return result;
  }

  async resendVerificationCode(email: string): Promise<ResendCodeResponse> {
    const response = await this.client.post<ApiResponse<ResendCodeResponse>>(
      "/api/auth/resend-code",
      { email },
    );
    return response.data.data!;
  }

  async listTemplates(): Promise<InvoiceTemplate[]> {
    const response =
      await this.client.get<ApiResponse<InvoiceTemplate[]>>("/api/templates");
    return response.data.data!;
  }

  async getTemplate(id: string): Promise<InvoiceTemplate> {
    const response = await this.client.get<ApiResponse<InvoiceTemplate>>(
      `/api/templates/${id}`,
    );
    return response.data.data!;
  }

  async createTemplate(data: CreateTemplateInput): Promise<InvoiceTemplate> {
    const response = await this.client.post<ApiResponse<InvoiceTemplate>>(
      "/api/templates",
      data,
    );
    return response.data.data!;
  }

  async updateTemplate(
    id: string,
    data: UpdateTemplateInput,
  ): Promise<InvoiceTemplate> {
    const response = await this.client.put<ApiResponse<InvoiceTemplate>>(
      `/api/templates/${id}`,
      data,
    );
    return response.data.data!;
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.client.delete(`/api/templates/${id}`);
  }
}

export const api = new ApiClient();
