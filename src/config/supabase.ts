import { createClient } from '@supabase/supabase-js';
import { envConfig } from './env.config';

/**
 * Supabase client configured with validated environment variables
 */
const supabase = createClient(envConfig.SUPABASE_URL, envConfig.SUPABASE_KEY);

export { supabase };