import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const keychainService = 'FinHunter Calendar';

export type SecretStore = {
  delete(account: string): Promise<void>;
  get(account: string): Promise<string | null>;
  isAvailable(): Promise<boolean>;
  set(account: string, secret: string): Promise<void>;
};

export class InMemorySecretStore implements SecretStore {
  private readonly secrets = new Map<string, string>();

  async delete(account: string): Promise<void> {
    this.secrets.delete(account);
  }

  async get(account: string): Promise<string | null> {
    return this.secrets.get(account) ?? null;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async set(account: string, secret: string): Promise<void> {
    this.secrets.set(account, secret);
  }
}

export class MacOsKeychainSecretStore implements SecretStore {
  async delete(account: string): Promise<void> {
    try {
      await execFileAsync('security', [
        'delete-generic-password',
        '-s',
        keychainService,
        '-a',
        account,
      ]);
    } catch (error) {
      if (isSecurityMissingItemError(error)) {
        return;
      }

      throw error;
    }
  }

  async get(account: string): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync('security', [
        'find-generic-password',
        '-s',
        keychainService,
        '-a',
        account,
        '-w',
      ]);

      return stdout.trimEnd();
    } catch (error) {
      if (isSecurityMissingItemError(error)) {
        return null;
      }

      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return process.platform === 'darwin';
  }

  async set(account: string, secret: string): Promise<void> {
    await execFileAsync('security', [
      'add-generic-password',
      '-s',
      keychainService,
      '-a',
      account,
      '-w',
      secret,
      '-U',
    ]);
  }
}

export function createDefaultSecretStore(): SecretStore {
  return new MacOsKeychainSecretStore();
}

function isSecurityMissingItemError(error: unknown): boolean {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 44
  ) {
    return true;
  }

  const message =
    error instanceof Error || (typeof error === 'object' && error !== null)
      ? String((error as { message?: unknown }).message ?? '')
      : '';

  return message.includes('could not be found');
}
