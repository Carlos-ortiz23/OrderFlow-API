export interface User {
    id: string;
    store_id?: string | null;
    email: string;
    password_hash: string;
    full_name?: string | null;
    role: string;
    created_at?: string;
}

export interface UserRepository {
    getUserById(id: string): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
}
