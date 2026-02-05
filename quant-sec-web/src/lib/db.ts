import { openDB, DBSchema, IDBPDatabase } from "idb";
import { User, Email } from "./types";

interface QuantSecDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { "by-username": string };
  };
  emails: {
    key: number;
    value: Email;
    indexes: { "by-sender": string; "by-timestamp": string };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: string;
    };
  };
}

const DB_NAME = "quantum-secure-email";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<QuantSecDB> | null = null;

async function getDB(): Promise<IDBPDatabase<QuantSecDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<QuantSecDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Users store
      if (!db.objectStoreNames.contains("users")) {
        const userStore = db.createObjectStore("users", {
          keyPath: "username",
        });
        userStore.createIndex("by-username", "username", { unique: true });
      }

      // Emails store
      if (!db.objectStoreNames.contains("emails")) {
        const emailStore = db.createObjectStore("emails", {
          keyPath: "id",
          autoIncrement: true,
        });
        emailStore.createIndex("by-sender", "sender", { unique: false });
        emailStore.createIndex("by-timestamp", "timestamp", { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    },
  });

  return dbInstance;
}

// User operations
export async function saveUser(user: User): Promise<void> {
  const db = await getDB();
  await db.put("users", user);
}

export async function getUser(username: string): Promise<User | undefined> {
  const db = await getDB();
  return db.get("users", username);
}

export async function getCurrentUser(): Promise<User | undefined> {
  const db = await getDB();
  const currentUsername = await getSetting("currentUser");
  if (!currentUsername) return undefined;
  return db.get("users", currentUsername);
}

export async function setCurrentUser(username: string): Promise<void> {
  await setSetting("currentUser", username);
}

export async function clearCurrentUser(): Promise<void> {
  await deleteSetting("currentUser");
}

export async function deleteUser(username: string): Promise<void> {
  const db = await getDB();
  await db.delete("users", username);
}

// Email operations
export async function saveEmail(email: Omit<Email, "id">): Promise<number> {
  const db = await getDB();
  return db.add("emails", email as Email);
}

export async function saveEmails(emails: Omit<Email, "id">[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("emails", "readwrite");
  for (const email of emails) {
    await tx.store.add(email as Email);
  }
  await tx.done;
}

export async function getEmails(limit?: number): Promise<Email[]> {
  const db = await getDB();
  const emails = await db.getAllFromIndex("emails", "by-timestamp");
  // Sort by timestamp descending (newest first)
  emails.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return limit ? emails.slice(0, limit) : emails;
}

export async function getEmailsByFolder(folder: "inbox" | "sent", limit?: number): Promise<Email[]> {
  const db = await getDB();
  const emails = await db.getAllFromIndex("emails", "by-timestamp");
  // Filter by folder (default to inbox if no folder specified)
  const filtered = emails.filter((email) => (email.folder || "inbox") === folder);
  // Sort by timestamp descending (newest first)
  filtered.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return limit ? filtered.slice(0, limit) : filtered;
}

export async function getEmail(id: number): Promise<Email | undefined> {
  const db = await getDB();
  return db.get("emails", id);
}

export async function updateEmail(email: Email): Promise<void> {
  const db = await getDB();
  await db.put("emails", email);
}

export async function deleteEmail(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("emails", id);
}

export async function clearEmails(): Promise<void> {
  const db = await getDB();
  await db.clear("emails");
}

// Settings operations
export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.put("settings", { key, value });
}

export async function getSetting(key: string): Promise<string | undefined> {
  const db = await getDB();
  const setting = await db.get("settings", key);
  return setting?.value;
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await getDB();
  await db.delete("settings", key);
}

// Utility to clear all data (for logout/reset)
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear("users");
  await db.clear("emails");
  await db.clear("settings");
}

export { getDB };
