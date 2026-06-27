import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      markets: {
        Row: {
          id: string
          question: string
          yes_price: number
          volume_num: number
          end_date: string
          category: string | null
          slug: string | null
          condition_id: string | null
          fetched_at: string
        }
        Insert: Omit<Database['public']['Tables']['markets']['Row'], 'fetched_at'>
      }
      signals: {
        Row: {
          id: string
          market_id: string
          question: string
          yes_price: number
          confidence_score: number
          direction: 'OVERPRICED' | 'UNDERPRICED' | 'FAIRLY_PRICED'
          rationale: string
          edge: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['signals']['Row'], 'id' | 'created_at'>
      }
      watchlist: {
        Row: {
          id: string
          market_id: string
          question: string
          entry_price: number
          entry_date: string
          position: 'YES' | 'NO'
          resolved: boolean
          outcome: boolean | null
          exit_price: number | null
          pnl: number | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['watchlist']['Row'], 'id' | 'created_at'>
      }
    }
  }
}
