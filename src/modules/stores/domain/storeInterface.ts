export interface Store {
    id: string; // UUID
    name: string;
    slug: string;
    telegram_bot_token?: string | null;
    system_prompt?: string | null;
    address?: string | null;
    phone?: string | null;
    is_active: boolean;
    created_at?: string;
    // We can add other fields if needed, but these are the ones in DB
}
