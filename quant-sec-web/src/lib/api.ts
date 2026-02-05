import axios, { AxiosInstance } from "axios";
import {
  ApiResponse,
  KeygenResponse,
  EncryptResponse,
  DecryptResponse,
  LoginResponse,
  RegisterResponse,
  InboxResponse,
  KyberParams,
} from "./types";

const DEFAULT_SERVER = "http://localhost:8000";

class QuantSecAPI {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = DEFAULT_SERVER) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: `${baseURL}/quantserver`,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  setBaseURL(baseURL: string) {
    this.baseURL = baseURL;
    this.client.defaults.baseURL = `${baseURL}/quantserver`;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  // Authentication
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>("/api/login/", {
      username,
      password,
    });
    return response.data;
  }

  async register(
    name: string,
    username: string,
    password: string
  ): Promise<RegisterResponse> {
    const response = await this.client.post<RegisterResponse>(
      "/api/register/",
      {
        name,
        username,
        password,
      }
    );
    return response.data;
  }

  // Check if username is available
  async checkUsername(username: string): Promise<boolean> {
    const response = await this.client.get<ApiResponse>(
      `/check-uniqueness/?username=${encodeURIComponent(username)}`
    );
    return response.data.Status === "Positive";
  }

  // Cryptography
  async generateKeypair(): Promise<KeygenResponse> {
    const response = await this.client.post<KeygenResponse>("/api/keygen/");
    return response.data;
  }

  async encrypt(
    message: string,
    receiverPublicKey: string
  ): Promise<EncryptResponse> {
    const response = await this.client.post<EncryptResponse>("/api/encrypt/", {
      message,
      receiver_public_key: receiverPublicKey,
    });
    return response.data;
  }

  async decrypt(
    tag: string,
    encryptedData: string,
    privateKey: string
  ): Promise<DecryptResponse> {
    const response = await this.client.post<DecryptResponse>("/api/decrypt/", {
      tag,
      encrypted_data: encryptedData,
      private_key: privateKey,
    });
    return response.data;
  }

  async getKyberParams(): Promise<KyberParams> {
    const response = await this.client.get<{ Status: string; params: KyberParams }>(
      "/api/kyber-params/"
    );
    return response.data.params;
  }

  // Email operations
  async getPublicKey(
    username: string
  ): Promise<{ name: string; publicKey: string }> {
    const response = await this.client.get<{
      Status: string;
      Name: string;
      "Public Key": string;
    }>(`/get-public-key/?username=${encodeURIComponent(username)}`);
    if (response.data.Status !== "Positive") {
      throw new Error("User not found");
    }
    return {
      name: response.data.Name,
      publicKey: response.data["Public Key"],
    };
  }

  async sendEmail(
    senderUsername: string,
    senderPassword: string,
    receiverUsername: string,
    encryptedSubject: string,
    encryptedBody: string
  ): Promise<ApiResponse> {
    const response = await this.client.post<ApiResponse>("/post-email/", {
      sender_username: senderUsername,
      reciever_username: receiverUsername,
      password: senderPassword,
      subject: encryptedSubject,
      body: encryptedBody,
    });
    return response.data;
  }

  async getInbox(
    username: string,
    password: string
  ): Promise<InboxResponse> {
    const response = await this.client.get<InboxResponse>(
      `/get-inbox/?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    );
    return response.data;
  }

  async clearInbox(
    username: string,
    password: string
  ): Promise<ApiResponse> {
    const response = await this.client.post<ApiResponse>("/clear-inbox/", {
      username,
      password,
    });
    return response.data;
  }
}

// Singleton instance
export const api = new QuantSecAPI();

export default api;
