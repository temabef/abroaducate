export interface Database {
  public: {
    Tables: {
      user_usage: {
        Row: {
          id: string
          user_id: string
          reviews_used: number
          text_enhancements_used: number
          word_optimizations_used: number
          grammar_checks_used: number
          plagiarism_checks_used: number
          tone_analysis_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reviews_used?: number
          text_enhancements_used?: number
          word_optimizations_used?: number
          grammar_checks_used?: number
          plagiarism_checks_used?: number
          tone_analysis_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reviews_used?: number
          text_enhancements_used?: number
          word_optimizations_used?: number
          grammar_checks_used?: number
          plagiarism_checks_used?: number
          tone_analysis_used?: number
          created_at?: string
          updated_at?: string
        }
      }
      // ... existing code ...
    }
  }
} 