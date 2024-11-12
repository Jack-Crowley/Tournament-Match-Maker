export interface Database {
    public: {
      Tables: {
        numbers: {
          Row: {
            id: number
            value: number
            created_at: string
          }
          Insert: {
            id?: number
            value: number
            created_at?: string
          }
          Update: {
            id?: number
            value?: number
            created_at?: string
          }
        }
      }
    }
  }