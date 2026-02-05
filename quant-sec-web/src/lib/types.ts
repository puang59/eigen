// User types
export interface User {
  username: string;
  name: string;
  publicKey: string;
  privateKey: string;
  serverHost: string;
}

// Email types
export interface Email {
  id?: number;
  sender: string;
  receiver?: string;
  subject: string;
  body: string;
  timestamp: string;
  encrypted: boolean;
  tag?: string;
  encryptedData?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  Status: "Positive" | "Negative";
  Message: string;
  [key: string]: T | string | undefined;
}

export interface KeygenResponse extends ApiResponse {
  public_key: string;
  private_key: string;
}

export interface EncryptResponse extends ApiResponse {
  tag: string;
  encrypted_data: string;
  visualization: {
    original_message_length: number;
    shared_key_preview: string;
    encrypted_key_length: number;
    cipher_text_length: number;
  };
}

export interface DecryptResponse extends ApiResponse {
  decrypted_message: string;
  visualization: {
    decrypted_key_preview: string;
    decrypted_message_length: number;
  };
}

export interface LoginResponse extends ApiResponse {
  user: {
    username: string;
    name: string;
    public_key: string;
    private_key: string;
  };
}

export interface RegisterResponse extends ApiResponse {
  user: {
    username: string;
    name: string;
    public_key: string;
    private_key: string;
  };
}

export interface InboxResponse extends ApiResponse {
  Emails: Array<{
    sender: string;
    encrypted_subject: string;
    encrypted_body: string;
    datetime_of_arrival: string;
  }>;
}

export interface KyberParams {
  name: string;
  n: number;
  k: number;
  q: number;
  eta1: number;
  eta2: number;
  du: number;
  dv: number;
  description: string;
  security_level: string;
  public_key_size: number;
  private_key_size: number;
  ciphertext_size: number;
  shared_secret_size: number;
}

// Encryption flow step for visualization
export interface EncryptionStep {
  step: number;
  name: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  data?: Record<string, unknown>;
}
