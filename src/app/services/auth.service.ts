import { computed, Injectable, signal } from '@angular/core';

export type AuthSession = {
    username: string;
    displayName: string;
    role: string;
};

type AuthorizedUser = AuthSession & {
    password: string;
};

const STORAGE_KEY = 'crs-userguide-auth-session';

const AUTHORIZED_USERS: AuthorizedUser[] = [
    {
        username: 'operator',
        password: 'crs-ops-2026',
        displayName: 'Operations User',
        role: 'Operations'
    },
    {
        username: 'admin',
        password: 'crs-admin-2026',
        displayName: 'Documentation Admin',
        role: 'Admin'
    }
];

@Injectable({ providedIn: 'root' })
export class AuthService {
    readonly session = signal<AuthSession | null>(this.readSession());
    readonly isLoggedIn = computed(() => this.session() !== null);

    login(username: string, password: string): boolean {
        const normalizedUsername = username.trim().toLowerCase();
        const matchedUser = AUTHORIZED_USERS.find(
            (user) => user.username === normalizedUsername && user.password === password
        );

        if (!matchedUser) {
            return false;
        }

        const session: AuthSession = {
            username: matchedUser.username,
            displayName: matchedUser.displayName,
            role: matchedUser.role
        };

        this.session.set(session);
        this.writeSession(session);
        return true;
    }

    logout(): void {
        this.session.set(null);

        try {
            globalThis.localStorage?.removeItem(STORAGE_KEY);
        } catch {
            // Ignore storage failures and clear the in-memory session only.
        }
    }

    private readSession(): AuthSession | null {
        try {
            const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) as AuthSession) : null;
        } catch {
            return null;
        }
    }

    private writeSession(session: AuthSession): void {
        try {
            globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch {
            // Ignore storage failures and rely on the in-memory session.
        }
    }
}