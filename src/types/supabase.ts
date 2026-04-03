export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string
          actor_type: Database["public"]["Enums"]["actor_type"]
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          organization_id: string
          proposal_id: string
        }
        Insert: {
          action: string
          actor_id: string
          actor_type?: Database["public"]["Enums"]["actor_type"]
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          organization_id: string
          proposal_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          actor_type?: Database["public"]["Enums"]["actor_type"]
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          messages: Json
          organization_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          messages?: Json
          organization_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          messages?: Json
          organization_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          organization_id: string
          revoked_at: string | null
          scopes: string[]
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          organization_id: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_location_history: {
        Row: {
          asset_id: string
          condition_at_move: string | null
          created_at: string
          id: string
          location: Json
          moved_at: string
          moved_by: string | null
          notes: string | null
          photo_urls: string[]
        }
        Insert: {
          asset_id: string
          condition_at_move?: string | null
          created_at?: string
          id?: string
          location: Json
          moved_at?: string
          moved_by?: string | null
          notes?: string | null
          photo_urls?: string[]
        }
        Update: {
          asset_id?: string
          condition_at_move?: string | null
          created_at?: string
          id?: string
          location?: Json
          moved_at?: string
          moved_by?: string | null
          notes?: string | null
          photo_urls?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "asset_location_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_location_history_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          acquisition_cost: number | null
          barcode: string | null
          category: string
          condition: Database["public"]["Enums"]["asset_condition"]
          created_at: string
          current_location: Json | null
          current_value: number | null
          deployment_count: number
          depreciation_method: string | null
          description: string | null
          dimensions: string | null
          id: string
          is_return_required: boolean
          is_reusable: boolean
          is_trackable: boolean
          material: string | null
          max_deployments: number | null
          name: string
          organization_id: string
          photo_urls: string[]
          proposal_id: string
          serial_number: string | null
          source_addon_id: string | null
          source_deliverable_id: string | null
          status: Database["public"]["Enums"]["asset_status"]
          storage_requirements: string | null
          type: string
          updated_at: string
          useful_life_months: number | null
          weight: string | null
        }
        Insert: {
          acquisition_cost?: number | null
          barcode?: string | null
          category: string
          condition?: Database["public"]["Enums"]["asset_condition"]
          created_at?: string
          current_location?: Json | null
          current_value?: number | null
          deployment_count?: number
          depreciation_method?: string | null
          description?: string | null
          dimensions?: string | null
          id?: string
          is_return_required?: boolean
          is_reusable?: boolean
          is_trackable?: boolean
          material?: string | null
          max_deployments?: number | null
          name: string
          organization_id: string
          photo_urls?: string[]
          proposal_id: string
          serial_number?: string | null
          source_addon_id?: string | null
          source_deliverable_id?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          storage_requirements?: string | null
          type: string
          updated_at?: string
          useful_life_months?: number | null
          weight?: string | null
        }
        Update: {
          acquisition_cost?: number | null
          barcode?: string | null
          category?: string
          condition?: Database["public"]["Enums"]["asset_condition"]
          created_at?: string
          current_location?: Json | null
          current_value?: number | null
          deployment_count?: number
          depreciation_method?: string | null
          description?: string | null
          dimensions?: string | null
          id?: string
          is_return_required?: boolean
          is_reusable?: boolean
          is_trackable?: boolean
          material?: string | null
          max_deployments?: number | null
          name?: string
          organization_id?: string
          photo_urls?: string[]
          proposal_id?: string
          serial_number?: string | null
          source_addon_id?: string | null
          source_deliverable_id?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          storage_requirements?: string | null
          type?: string
          updated_at?: string
          useful_life_months?: number | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_source_addon_id_fkey"
            columns: ["source_addon_id"]
            isOneToOne: false
            referencedRelation: "phase_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_source_deliverable_id_fkey"
            columns: ["source_deliverable_id"]
            isOneToOne: false
            referencedRelation: "phase_deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          organization_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          organization_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          automation_id: string
          completed_at: string | null
          error: string | null
          id: string
          organization_id: string
          result: Json | null
          started_at: string
          status: string
          trigger_data: Json | null
        }
        Insert: {
          automation_id: string
          completed_at?: string | null
          error?: string | null
          id?: string
          organization_id: string
          result?: Json | null
          started_at?: string
          status?: string
          trigger_data?: Json | null
        }
        Update: {
          automation_id?: string
          completed_at?: string | null
          error?: string | null
          id?: string
          organization_id?: string
          result?: Json | null
          started_at?: string
          status?: string
          trigger_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          organization_id: string
          run_count: number
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          organization_id: string
          run_count?: number
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          organization_id?: string
          run_count?: number
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_alerts: {
        Row: {
          acknowledged: boolean
          budget_id: string
          created_at: string
          id: string
          message: string
          organization_id: string
          type: string
        }
        Insert: {
          acknowledged?: boolean
          budget_id: string
          created_at?: string
          id?: string
          message: string
          organization_id: string
          type: string
        }
        Update: {
          acknowledged?: boolean
          budget_id?: string
          created_at?: string
          id?: string
          message?: string
          organization_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_alerts_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "project_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_line_items: {
        Row: {
          actual_amount: number
          budget_id: string
          category: string
          created_at: string
          description: string | null
          id: string
          planned_amount: number
          updated_at: string
        }
        Insert: {
          actual_amount?: number
          budget_id: string
          category: string
          created_at?: string
          description?: string | null
          id?: string
          planned_amount?: number
          updated_at?: string
        }
        Update: {
          actual_amount?: number
          budget_id?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          planned_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_line_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "project_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sync_configs: {
        Row: {
          access_token_encrypted: string | null
          calendar_id: string | null
          created_at: string
          external_calendar_id: string | null
          id: string
          last_synced_at: string | null
          organization_id: string
          provider: string
          refresh_token_encrypted: string | null
          sync_enabled: boolean
          sync_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          calendar_id?: string | null
          created_at?: string
          external_calendar_id?: string | null
          id?: string
          last_synced_at?: string | null
          organization_id: string
          provider: string
          refresh_token_encrypted?: string | null
          sync_enabled?: boolean
          sync_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          calendar_id?: string | null
          created_at?: string
          external_calendar_id?: string | null
          id?: string
          last_synced_at?: string | null
          organization_id?: string
          provider?: string
          refresh_token_encrypted?: string | null
          sync_enabled?: boolean
          sync_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      capacity_overrides: {
        Row: {
          available_hours: number
          created_at: string
          date: string
          id: string
          organization_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          available_hours?: number
          created_at?: string
          date: string
          id?: string
          organization_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          available_hours?: number
          created_at?: string
          date?: string
          id?: string
          organization_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capacity_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capacity_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      change_orders: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          organization_id: string
          proposal_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id: string
          proposal_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          proposal_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_orders_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          contact_role: Database["public"]["Enums"]["contact_role"]
          created_at: string
          email: string
          first_name: string
          id: string
          is_decision_maker: boolean
          is_signatory: boolean
          last_name: string
          phone: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          client_id: string
          contact_role?: Database["public"]["Enums"]["contact_role"]
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_decision_maker?: boolean
          is_signatory?: boolean
          last_name: string
          phone?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          client_id?: string
          contact_role?: Database["public"]["Enums"]["contact_role"]
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_decision_maker?: boolean
          is_signatory?: boolean
          last_name?: string
          phone?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_interactions: {
        Row: {
          body: string | null
          client_id: string
          created_at: string
          id: string
          occurred_at: string
          organization_id: string
          subject: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          client_id: string
          created_at?: string
          id?: string
          occurred_at?: string
          organization_id: string
          subject: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          client_id?: string
          created_at?: string
          id?: string
          occurred_at?: string
          organization_id?: string
          subject?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          annual_revenue: number | null
          billing_address: Json | null
          company_name: string
          created_at: string
          crm_external_ids: Json | null
          employee_count: number | null
          id: string
          industry: string | null
          linkedin: string | null
          notes: string | null
          organization_id: string
          source: string | null
          tags: string[]
          updated_at: string
          website: string | null
        }
        Insert: {
          annual_revenue?: number | null
          billing_address?: Json | null
          company_name: string
          created_at?: string
          crm_external_ids?: Json | null
          employee_count?: number | null
          id?: string
          industry?: string | null
          linkedin?: string | null
          notes?: string | null
          organization_id: string
          source?: string | null
          tags?: string[]
          updated_at?: string
          website?: string | null
        }
        Update: {
          annual_revenue?: number | null
          billing_address?: Json | null
          company_name?: string
          created_at?: string
          crm_external_ids?: Json | null
          employee_count?: number | null
          id?: string
          industry?: string | null
          linkedin?: string | null
          notes?: string | null
          organization_id?: string
          source?: string | null
          tags?: string[]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_references: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          label: string
          phase_id: string
          sort_order: number
          type: Database["public"]["Enums"]["creative_reference_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          label: string
          phase_id: string
          sort_order?: number
          type?: Database["public"]["Enums"]["creative_reference_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          label?: string
          phase_id?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["creative_reference_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_references_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_notes: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          credit_number: string
          id: string
          invoice_id: string
          issued_date: string
          organization_id: string
          reason: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          credit_number: string
          id?: string
          invoice_id: string
          issued_date: string
          organization_id: string
          reason?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          credit_number?: string
          id?: string
          invoice_id?: string
          issued_date?: string
          organization_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_availability: {
        Row: {
          created_at: string
          date: string
          id: string
          note: string | null
          organization_id: string
          status: Database["public"]["Enums"]["availability_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          note?: string | null
          organization_id: string
          status: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_availability_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_bookings: {
        Row: {
          call_time: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          proposal_id: string
          rate_amount: number
          rate_type: string
          role: string
          shift_end: string
          shift_start: string
          status: string
          updated_at: string
          user_id: string
          venue_id: string | null
        }
        Insert: {
          call_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          proposal_id: string
          rate_amount?: number
          rate_type?: string
          role: string
          shift_end: string
          shift_start: string
          status?: string
          updated_at?: string
          user_id: string
          venue_id?: string | null
        }
        Update: {
          call_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          proposal_id?: string
          rate_amount?: number
          rate_type?: string
          role?: string
          shift_end?: string
          shift_start?: string
          status?: string
          updated_at?: string
          user_id?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_bookings_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_profiles: {
        Row: {
          availability_default: string
          certifications: Json
          created_at: string
          day_rate: number | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          hourly_rate: number | null
          id: string
          notes: string | null
          onboarding_status: string
          organization_id: string
          ot_rate: number | null
          per_diem_rate: number | null
          skills: string[]
          travel_rate: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability_default?: string
          certifications?: Json
          created_at?: string
          day_rate?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          onboarding_status?: string
          organization_id: string
          ot_rate?: number | null
          per_diem_rate?: number | null
          skills?: string[]
          travel_rate?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability_default?: string
          certifications?: Json
          created_at?: string
          day_rate?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          onboarding_status?: string
          organization_id?: string
          ot_rate?: number | null
          per_diem_rate?: number | null
          skills?: string[]
          travel_rate?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_definitions: {
        Row: {
          created_at: string
          created_by: string | null
          default_value: Json | null
          description: string | null
          entity_type: string
          field_key: string
          field_name: string
          field_options: Json | null
          field_type: Database["public"]["Enums"]["custom_field_type"]
          id: string
          is_active: boolean
          is_filterable: boolean
          is_required: boolean
          is_visible_in_list: boolean
          organization_id: string
          section: string | null
          sort_order: number
          updated_at: string
          visibility_roles: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_value?: Json | null
          description?: string | null
          entity_type: string
          field_key: string
          field_name: string
          field_options?: Json | null
          field_type: Database["public"]["Enums"]["custom_field_type"]
          id?: string
          is_active?: boolean
          is_filterable?: boolean
          is_required?: boolean
          is_visible_in_list?: boolean
          organization_id: string
          section?: string | null
          sort_order?: number
          updated_at?: string
          visibility_roles?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_value?: Json | null
          description?: string | null
          entity_type?: string
          field_key?: string
          field_name?: string
          field_options?: Json | null
          field_type?: Database["public"]["Enums"]["custom_field_type"]
          id?: string
          is_active?: boolean
          is_filterable?: boolean
          is_required?: boolean
          is_visible_in_list?: boolean
          organization_id?: string
          section?: string | null
          sort_order?: number
          updated_at?: string
          visibility_roles?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_definitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string | null
          field_definition_id: string
          id: string
          updated_at: string
          value: Json | null
          value_boolean: boolean | null
          value_date: string | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type?: string | null
          field_definition_id: string
          id?: string
          updated_at?: string
          value?: Json | null
          value_boolean?: boolean | null
          value_date?: string | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string | null
          field_definition_id?: string
          id?: string
          updated_at?: string
          value?: Json | null
          value_boolean?: boolean | null
          value_date?: string | null
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_field_definition_id_fkey"
            columns: ["field_definition_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_reports: {
        Row: {
          columns: Json
          created_at: string
          created_by: string | null
          description: string | null
          filters: Json
          id: string
          is_shared: boolean
          name: string
          organization_id: string
          query_config: Json
          updated_at: string
          visualization_type: string
        }
        Insert: {
          columns?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          filters?: Json
          id?: string
          is_shared?: boolean
          name: string
          organization_id: string
          query_config?: Json
          updated_at?: string
          visualization_type?: string
        }
        Update: {
          columns?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          filters?: Json
          id?: string
          is_shared?: boolean
          name?: string
          organization_id?: string
          query_config?: Json
          updated_at?: string
          visualization_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_activities: {
        Row: {
          actor_id: string | null
          created_at: string
          deal_id: string
          description: string
          id: string
          metadata: Json | null
          organization_id: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          deal_id: string
          description: string
          id?: string
          metadata?: Json | null
          organization_id: string
          type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          deal_id?: string
          description?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_activities_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          client_id: string
          created_at: string
          deal_value: number
          expected_close_date: string | null
          id: string
          lost_date: string | null
          lost_reason: string | null
          notes: string | null
          organization_id: string
          owner_id: string | null
          pipeline_id: string | null
          probability: number
          proposal_id: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at: string
          won_date: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          deal_value?: number
          expected_close_date?: string | null
          id?: string
          lost_date?: string | null
          lost_reason?: string | null
          notes?: string | null
          organization_id: string
          owner_id?: string | null
          pipeline_id?: string | null
          probability?: number
          proposal_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at?: string
          won_date?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          deal_value?: number
          expected_close_date?: string | null
          id?: string
          lost_date?: string | null
          lost_reason?: string | null
          notes?: string | null
          organization_id?: string
          owner_id?: string | null
          pipeline_id?: string | null
          probability?: number
          proposal_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string
          updated_at?: string
          won_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "sales_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      document_defaults: {
        Row: {
          content: string
          created_at: string
          document_type: string
          id: string
          organization_id: string
          section: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          document_type: string
          id?: string
          organization_id: string
          section: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          document_type?: string
          id?: string
          organization_id?: string
          section?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_defaults_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          body_html: string | null
          body_text: string | null
          created_at: string
          direction: string
          external_id: string | null
          from_email: string
          from_name: string | null
          id: string
          sent_at: string
          subject: string
          thread_id: string
          to_emails: string[]
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          direction?: string
          external_id?: string | null
          from_email: string
          from_name?: string | null
          id?: string
          sent_at?: string
          subject: string
          thread_id: string
          to_emails: string[]
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          direction?: string
          external_id?: string | null
          from_email?: string
          from_name?: string | null
          id?: string
          sent_at?: string
          subject?: string
          thread_id?: string
          to_emails?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications: {
        Row: {
          body: string
          created_at: string
          error: string | null
          id: string
          organization_id: string
          recipient_email: string
          recipient_name: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sent_at: string | null
          subject: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string
          error?: string | null
          id?: string
          organization_id: string
          recipient_email: string
          recipient_name?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          subject: string
          type: string
        }
        Update: {
          body?: string
          created_at?: string
          error?: string | null
          id?: string
          organization_id?: string
          recipient_email?: string
          recipient_name?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          subject?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_template: string
          created_at: string
          enabled: boolean
          event_type: string
          id: string
          organization_id: string
          subject_template: string
          updated_at: string
        }
        Insert: {
          body_template: string
          created_at?: string
          enabled?: boolean
          event_type: string
          id?: string
          organization_id: string
          subject_template: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          created_at?: string
          enabled?: boolean
          event_type?: string
          id?: string
          organization_id?: string
          subject_template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_threads: {
        Row: {
          client_id: string | null
          created_at: string
          deal_id: string | null
          id: string
          last_message_at: string
          message_count: number
          organization_id: string
          subject: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          last_message_at?: string
          message_count?: number
          organization_id: string
          subject: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          last_message_at?: string
          message_count?: number
          organization_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_threads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_threads_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_threads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_bundles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          items: Json
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          items?: Json
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          items?: Json
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_bundles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_reservations: {
        Row: {
          asset_id: string
          checked_out_at: string | null
          checked_out_by: string | null
          condition_on_return: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          proposal_id: string
          quantity: number
          reserved_from: string
          reserved_until: string
          returned_at: string | null
          returned_by: string | null
          status: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          asset_id: string
          checked_out_at?: string | null
          checked_out_by?: string | null
          condition_on_return?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          proposal_id: string
          quantity?: number
          reserved_from: string
          reserved_until: string
          returned_at?: string | null
          returned_by?: string | null
          status?: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          asset_id?: string
          checked_out_at?: string | null
          checked_out_by?: string | null
          condition_on_return?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          proposal_id?: string
          quantity?: number
          reserved_from?: string
          reserved_until?: string
          returned_at?: string | null
          returned_by?: string | null
          status?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_reservations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_reservations_checked_out_by_fkey"
            columns: ["checked_out_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_reservations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_reservations_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_reservations_returned_by_fkey"
            columns: ["returned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_reservations_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      esignature_requests: {
        Row: {
          created_at: string
          document_title: string
          document_type: string
          id: string
          ip_address: unknown
          organization_id: string
          pdf_url: string | null
          proposal_id: string | null
          sent_at: string | null
          signature_data: string | null
          signed_at: string | null
          signer_email: string
          signer_name: string
          status: string
          token: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string
          document_title: string
          document_type: string
          id?: string
          ip_address?: unknown
          organization_id: string
          pdf_url?: string | null
          proposal_id?: string | null
          sent_at?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signer_email: string
          signer_name: string
          status?: string
          token: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string
          document_title?: string
          document_type?: string
          id?: string
          ip_address?: unknown
          organization_id?: string
          pdf_url?: string | null
          proposal_id?: string | null
          sent_at?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signer_email?: string
          signer_name?: string
          status?: string
          token?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esignature_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esignature_requests_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          currency: string
          description: string | null
          expense_date: string
          id: string
          organization_id: string
          proposal_id: string | null
          receipt_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string
          id?: string
          organization_id: string
          proposal_id?: string | null
          receipt_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string
          id?: string
          organization_id?: string
          proposal_id?: string | null
          receipt_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      export_configurations: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          organization_id: string
          platform: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          platform: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          platform?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      file_attachments: {
        Row: {
          category: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_client_visible: boolean
          mime_type: string
          phase_id: string | null
          proposal_id: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          category?: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          is_client_visible?: boolean
          mime_type: string
          phase_id?: string | null
          proposal_id: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          category?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_client_visible?: boolean
          mime_type?: string
          phase_id?: string | null
          proposal_id?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_attachments_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_attachments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_calendars: {
        Row: {
          created_at: string
          date: string
          id: string
          is_recurring: boolean
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_recurring?: boolean
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_recurring?: boolean
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holiday_calendars_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_log: {
        Row: {
          completed_at: string | null
          direction: string
          entity_count: number
          entity_type: string
          error: string | null
          id: string
          integration_id: string
          organization_id: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          direction: string
          entity_count?: number
          entity_type: string
          error?: string | null
          id?: string
          integration_id: string
          organization_id: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          direction?: string
          entity_count?: number
          entity_type?: string
          error?: string | null
          id?: string
          integration_id?: string
          organization_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_log_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          access_token_encrypted: string | null
          config: Json
          created_at: string
          id: string
          last_sync_at: string | null
          organization_id: string
          platform: string
          refresh_token_encrypted: string | null
          status: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted?: string | null
          config?: Json
          created_at?: string
          id?: string
          last_sync_at?: string | null
          organization_id: string
          platform: string
          refresh_token_encrypted?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string | null
          config?: Json
          created_at?: string
          id?: string
          last_sync_at?: string | null
          organization_id?: string
          platform?: string
          refresh_token_encrypted?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          addon_id: string | null
          amount: number
          category: string | null
          created_at: string
          deliverable_id: string | null
          description: string
          id: string
          invoice_id: string
          is_taxable: boolean
          phase_number: string | null
          quantity: number
          rate: number
          updated_at: string
        }
        Insert: {
          addon_id?: string | null
          amount?: number
          category?: string | null
          created_at?: string
          deliverable_id?: string | null
          description: string
          id?: string
          invoice_id: string
          is_taxable?: boolean
          phase_number?: string | null
          quantity?: number
          rate?: number
          updated_at?: string
        }
        Update: {
          addon_id?: string | null
          amount?: number
          category?: string | null
          created_at?: string
          deliverable_id?: string | null
          description?: string
          id?: string
          invoice_id?: string
          is_taxable?: boolean
          phase_number?: string | null
          quantity?: number
          rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "phase_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "phase_deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: string
          notes: string | null
          organization_id: string
          received_date: string
          recorded_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method: string
          notes?: string | null
          organization_id: string
          received_date: string
          recorded_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          notes?: string | null
          organization_id?: string
          received_date?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          client_id: string
          created_at: string
          currency: string
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          memo: string | null
          organization_id: string
          paid_date: string | null
          payment_link: string | null
          pdf_url: string | null
          proposal_id: string
          reminder_sent_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          total: number
          triggered_by_milestone_id: string | null
          type: Database["public"]["Enums"]["invoice_type"]
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          client_id: string
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          invoice_number: string
          issue_date?: string
          memo?: string | null
          organization_id: string
          paid_date?: string | null
          payment_link?: string | null
          pdf_url?: string | null
          proposal_id: string
          reminder_sent_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          triggered_by_milestone_id?: string | null
          type?: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          client_id?: string
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          memo?: string | null
          organization_id?: string
          paid_date?: string | null
          payment_link?: string | null
          pdf_url?: string | null
          proposal_id?: string
          reminder_sent_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          triggered_by_milestone_id?: string | null
          type?: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_triggered_by_milestone_id_fkey"
            columns: ["triggered_by_milestone_id"]
            isOneToOne: false
            referencedRelation: "milestone_gates"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_forms: {
        Row: {
          auto_response_body: string | null
          auto_response_enabled: boolean
          auto_response_subject: string | null
          created_at: string
          embed_token: string
          fields: Json
          id: string
          is_active: boolean
          name: string
          organization_id: string
          thank_you_message: string | null
          updated_at: string
        }
        Insert: {
          auto_response_body?: string | null
          auto_response_enabled?: boolean
          auto_response_subject?: string | null
          created_at?: string
          embed_token?: string
          fields?: Json
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          thank_you_message?: string | null
          updated_at?: string
        }
        Update: {
          auto_response_body?: string | null
          auto_response_enabled?: boolean
          auto_response_subject?: string | null
          created_at?: string
          embed_token?: string
          fields?: Json
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          thank_you_message?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_forms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company_name: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          converted_to_deal_id: string | null
          created_at: string
          estimated_budget: number | null
          event_date: string | null
          event_type: string | null
          id: string
          message: string | null
          organization_id: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_name?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          converted_to_deal_id?: string | null
          created_at?: string
          estimated_budget?: number | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          message?: string | null
          organization_id: string
          source: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_name?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          converted_to_deal_id?: string | null
          created_at?: string
          estimated_budget?: number | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          message?: string | null
          organization_id?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_to_deal_id_fkey"
            columns: ["converted_to_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          asset_id: string
          completed_date: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          organization_id: string
          performed_by: string | null
          scheduled_date: string
          status: string
          type: Database["public"]["Enums"]["maintenance_type"]
          updated_at: string
        }
        Insert: {
          asset_id: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          performed_by?: string | null
          scheduled_date: string
          status?: string
          type: Database["public"]["Enums"]["maintenance_type"]
          updated_at?: string
        }
        Update: {
          asset_id?: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          performed_by?: string | null
          scheduled_date?: string
          status?: string
          type?: Database["public"]["Enums"]["maintenance_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_gates: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          name: string
          phase_id: string
          status: Database["public"]["Enums"]["milestone_status"]
          unlocks_description: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name: string
          phase_id: string
          status?: Database["public"]["Enums"]["milestone_status"]
          unlocks_description?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          phase_id?: string
          status?: Database["public"]["Enums"]["milestone_status"]
          unlocks_description?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_gates_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_requirements: {
        Row: {
          assignee: Database["public"]["Enums"]["requirement_assignee"]
          completed_at: string | null
          completed_by: string | null
          created_at: string
          due_date: string | null
          due_offset: string | null
          evidence_required: boolean
          finance_trigger: Json | null
          id: string
          milestone_id: string
          sort_order: number
          status: Database["public"]["Enums"]["requirement_status"]
          text: string
          updated_at: string
        }
        Insert: {
          assignee?: Database["public"]["Enums"]["requirement_assignee"]
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          due_offset?: string | null
          evidence_required?: boolean
          finance_trigger?: Json | null
          id?: string
          milestone_id: string
          sort_order?: number
          status?: Database["public"]["Enums"]["requirement_status"]
          text: string
          updated_at?: string
        }
        Update: {
          assignee?: Database["public"]["Enums"]["requirement_assignee"]
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          due_offset?: string | null
          evidence_required?: boolean
          finance_trigger?: Json | null
          id?: string
          milestone_id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["requirement_status"]
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_requirements_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_requirements_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestone_gates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          channel: string
          created_at: string
          enabled: boolean
          event_type: string
          id: string
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          enabled?: boolean
          event_type: string
          id?: string
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          enabled?: boolean
          event_type?: string
          id?: string
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_documents: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          status: string
          type: Database["public"]["Enums"]["onboarding_doc_type"]
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          status?: string
          type: Database["public"]["Enums"]["onboarding_doc_type"]
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          status?: string
          type?: Database["public"]["Enums"]["onboarding_doc_type"]
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      org_chart_positions: {
        Row: {
          created_at: string
          department: string | null
          id: string
          level: number
          organization_id: string
          reports_to: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          level?: number
          organization_id: string
          reports_to?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          level?: number
          organization_id?: string
          reports_to?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_chart_positions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_chart_positions_reports_to_fkey"
            columns: ["reports_to"]
            isOneToOne: false
            referencedRelation: "org_chart_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_chart_positions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_email: string | null
          brand_config: Json
          created_at: string
          date_format: string
          default_payment_terms: Json
          default_phase_template_id: string | null
          facilities: Json
          favicon_url: string | null
          first_day_of_week: number
          id: string
          language: string
          logo_url: string | null
          name: string
          number_format: string
          payment_instructions: string | null
          require_sso: boolean
          settings: Json
          slug: string
          stripe_connect_account_id: string | null
          stripe_connect_onboarding_complete: boolean
          stripe_customer_id: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          time_format: string
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          brand_config?: Json
          created_at?: string
          date_format?: string
          default_payment_terms?: Json
          default_phase_template_id?: string | null
          facilities?: Json
          favicon_url?: string | null
          first_day_of_week?: number
          id?: string
          language?: string
          logo_url?: string | null
          name: string
          number_format?: string
          payment_instructions?: string | null
          require_sso?: boolean
          settings?: Json
          slug: string
          stripe_connect_account_id?: string | null
          stripe_connect_onboarding_complete?: boolean
          stripe_customer_id?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          time_format?: string
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          brand_config?: Json
          created_at?: string
          date_format?: string
          default_payment_terms?: Json
          default_phase_template_id?: string | null
          facilities?: Json
          favicon_url?: string | null
          first_day_of_week?: number
          id?: string
          language?: string
          logo_url?: string | null
          name?: string
          number_format?: string
          payment_instructions?: string | null
          require_sso?: boolean
          settings?: Json
          slug?: string
          stripe_connect_account_id?: string | null
          stripe_connect_onboarding_complete?: boolean
          stripe_customer_id?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          time_format?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_org_default_template"
            columns: ["default_phase_template_id"]
            isOneToOne: false
            referencedRelation: "phase_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_links: {
        Row: {
          amount: number
          created_at: string
          currency: string
          expires_at: string | null
          external_id: string
          id: string
          invoice_id: string
          organization_id: string
          provider: string
          status: string
          url: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          external_id: string
          id?: string
          invoice_id: string
          organization_id: string
          provider?: string
          status?: string
          url: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          external_id?: string
          id?: string
          invoice_id?: string
          organization_id?: string
          provider?: string
          status?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          allowed: boolean
          created_at: string
          id: string
          organization_id: string
          resource: string
          role: string
          updated_at: string
        }
        Insert: {
          action: string
          allowed?: boolean
          created_at?: string
          id?: string
          organization_id: string
          resource: string
          role: string
          updated_at?: string
        }
        Update: {
          action?: string
          allowed?: boolean
          created_at?: string
          id?: string
          organization_id?: string
          resource?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_addons: {
        Row: {
          asset_metadata: Json | null
          category: string
          created_at: string
          description: string | null
          id: string
          is_selected: boolean
          is_taxable: boolean
          mutually_exclusive_group: string | null
          name: string
          phase_id: string
          pm_metadata: Json | null
          qty: number
          resource_metadata: Json | null
          sort_order: number
          terms_sections: string[] | null
          total_cost: number
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          asset_metadata?: Json | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_selected?: boolean
          is_taxable?: boolean
          mutually_exclusive_group?: string | null
          name: string
          phase_id: string
          pm_metadata?: Json | null
          qty?: number
          resource_metadata?: Json | null
          sort_order?: number
          terms_sections?: string[] | null
          total_cost?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          asset_metadata?: Json | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_selected?: boolean
          is_taxable?: boolean
          mutually_exclusive_group?: string | null
          name?: string
          phase_id?: string
          pm_metadata?: Json | null
          qty?: number
          resource_metadata?: Json | null
          sort_order?: number
          terms_sections?: string[] | null
          total_cost?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_addons_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_deliverables: {
        Row: {
          asset_metadata: Json | null
          category: string
          created_at: string
          description: string | null
          details: string[]
          id: string
          is_taxable: boolean
          name: string
          phase_id: string
          pm_metadata: Json | null
          qty: number
          resource_metadata: Json | null
          sort_order: number
          terms_sections: string[] | null
          total_cost: number
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          asset_metadata?: Json | null
          category?: string
          created_at?: string
          description?: string | null
          details?: string[]
          id?: string
          is_taxable?: boolean
          name: string
          phase_id: string
          pm_metadata?: Json | null
          qty?: number
          resource_metadata?: Json | null
          sort_order?: number
          terms_sections?: string[] | null
          total_cost?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          asset_metadata?: Json | null
          category?: string
          created_at?: string
          description?: string | null
          details?: string[]
          id?: string
          is_taxable?: boolean
          name?: string
          phase_id?: string
          pm_metadata?: Json | null
          qty?: number
          resource_metadata?: Json | null
          sort_order?: number
          terms_sections?: string[] | null
          total_cost?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_deliverables_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_portfolio_links: {
        Row: {
          context_description: string | null
          created_at: string
          id: string
          phase_id: string
          portfolio_item_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          context_description?: string | null
          created_at?: string
          id?: string
          phase_id: string
          portfolio_item_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          context_description?: string | null
          created_at?: string
          id?: string
          phase_id?: string
          portfolio_item_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_portfolio_links_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_portfolio_links_portfolio_item_id_fkey"
            columns: ["portfolio_item_id"]
            isOneToOne: false
            referencedRelation: "portfolio_library"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          organization_id: string
          phases: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          phases?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          phases?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      phases: {
        Row: {
          created_at: string
          id: string
          name: string
          narrative: string | null
          phase_investment: number
          phase_number: string
          proposal_id: string
          sort_order: number
          status: Database["public"]["Enums"]["phase_status"]
          subtitle: string | null
          terms_sections: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          narrative?: string | null
          phase_investment?: number
          phase_number: string
          proposal_id: string
          sort_order?: number
          status?: Database["public"]["Enums"]["phase_status"]
          subtitle?: string | null
          terms_sections?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          narrative?: string | null
          phase_investment?: number
          phase_number?: string
          proposal_id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["phase_status"]
          subtitle?: string | null
          terms_sections?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phases_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_library: {
        Row: {
          category: string
          client_name: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string
          organization_id: string
          project_name: string
          project_year: number | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          category: string
          client_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          organization_id: string
          project_name: string
          project_year?: number | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          category?: string
          client_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          organization_id?: string
          project_name?: string
          project_year?: number | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_library_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_budgets: {
        Row: {
          alert_threshold_percent: number
          created_at: string
          id: string
          organization_id: string
          proposal_id: string
          spent: number
          total_budget: number
          updated_at: string
        }
        Insert: {
          alert_threshold_percent?: number
          created_at?: string
          id?: string
          organization_id: string
          proposal_id: string
          spent?: number
          total_budget?: number
          updated_at?: string
        }
        Update: {
          alert_threshold_percent?: number
          created_at?: string
          id?: string
          organization_id?: string
          proposal_id?: string
          spent?: number
          total_budget?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_budgets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_budgets_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      project_costs: {
        Row: {
          amount: number
          category: string
          cost_date: string
          created_at: string
          description: string | null
          id: string
          organization_id: string
          proposal_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category: string
          cost_date?: string
          created_at?: string
          description?: string | null
          id?: string
          organization_id: string
          proposal_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          cost_date?: string
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string
          proposal_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_costs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_costs_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_comments: {
        Row: {
          addon_id: string | null
          author_id: string
          body: string
          created_at: string
          deliverable_id: string | null
          id: string
          is_internal: boolean
          is_resolved: boolean
          phase_id: string | null
          proposal_id: string
          resolved_at: string | null
          resolved_by: string | null
          updated_at: string
        }
        Insert: {
          addon_id?: string | null
          author_id: string
          body: string
          created_at?: string
          deliverable_id?: string | null
          id?: string
          is_internal?: boolean
          is_resolved?: boolean
          phase_id?: string | null
          proposal_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
        }
        Update: {
          addon_id?: string | null
          author_id?: string
          body?: string
          created_at?: string
          deliverable_id?: string | null
          id?: string
          is_internal?: boolean
          is_resolved?: boolean
          phase_id?: string | null
          proposal_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_comments_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "phase_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_comments_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "phase_deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_comments_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_comments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_comments_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_scenarios: {
        Row: {
          adjustments: Json
          created_at: string
          description: string | null
          id: string
          is_baseline: boolean
          name: string
          organization_id: string
          proposal_id: string
          total_value: number
          updated_at: string
        }
        Insert: {
          adjustments?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_baseline?: boolean
          name: string
          organization_id: string
          proposal_id: string
          total_value?: number
          updated_at?: string
        }
        Update: {
          adjustments?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_baseline?: boolean
          name?: string
          organization_id?: string
          proposal_id?: string
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_scenarios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_scenarios_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          currency: string
          current_phase_id: string | null
          deal_stage: Database["public"]["Enums"]["deal_stage"] | null
          expected_close_date: string | null
          id: string
          name: string
          narrative_context: Json | null
          organization_id: string
          parent_proposal_id: string | null
          payment_terms: Json | null
          phase_template_id: string | null
          pipeline_id: string | null
          portal_access_token: string | null
          portal_first_viewed_at: string | null
          prepared_date: string | null
          probability_percent: number | null
          source: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          subtitle: string | null
          tags: string[]
          terms_document_id: string | null
          total_value: number
          total_with_addons: number
          updated_at: string
          valid_until: string | null
          version: number
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          currency?: string
          current_phase_id?: string | null
          deal_stage?: Database["public"]["Enums"]["deal_stage"] | null
          expected_close_date?: string | null
          id?: string
          name: string
          narrative_context?: Json | null
          organization_id: string
          parent_proposal_id?: string | null
          payment_terms?: Json | null
          phase_template_id?: string | null
          pipeline_id?: string | null
          portal_access_token?: string | null
          portal_first_viewed_at?: string | null
          prepared_date?: string | null
          probability_percent?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          subtitle?: string | null
          tags?: string[]
          terms_document_id?: string | null
          total_value?: number
          total_with_addons?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          current_phase_id?: string | null
          deal_stage?: Database["public"]["Enums"]["deal_stage"] | null
          expected_close_date?: string | null
          id?: string
          name?: string
          narrative_context?: Json | null
          organization_id?: string
          parent_proposal_id?: string | null
          payment_terms?: Json | null
          phase_template_id?: string | null
          pipeline_id?: string | null
          portal_access_token?: string | null
          portal_first_viewed_at?: string | null
          prepared_date?: string | null
          probability_percent?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          subtitle?: string | null
          tags?: string[]
          terms_document_id?: string | null
          total_value?: number
          total_with_addons?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_proposals_current_phase"
            columns: ["current_phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_parent_proposal_id_fkey"
            columns: ["parent_proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_phase_template_id_fkey"
            columns: ["phase_template_id"]
            isOneToOne: false
            referencedRelation: "phase_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "sales_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_terms_document_id_fkey"
            columns: ["terms_document_id"]
            isOneToOne: false
            referencedRelation: "terms_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          issued_date: string | null
          organization_id: string
          po_number: string
          proposal_id: string | null
          status: string
          total_amount: number
          updated_at: string
          vendor_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          issued_date?: string | null
          organization_id: string
          po_number: string
          proposal_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          vendor_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          issued_date?: string | null
          organization_id?: string
          po_number?: string
          proposal_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_invoice_schedules: {
        Row: {
          client_id: string
          created_at: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          last_generated_at: string | null
          next_issue_date: string
          organization_id: string
          template_data: Json
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_generated_at?: string | null
          next_issue_date: string
          organization_id: string
          template_data?: Json
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_generated_at?: string | null
          next_issue_date?: string
          organization_id?: string
          template_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoice_schedules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoice_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_allocations: {
        Row: {
          created_at: string
          end_date: string
          hours_per_day: number
          id: string
          notes: string | null
          organization_id: string
          proposal_id: string | null
          role: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          hours_per_day?: number
          id?: string
          notes?: string | null
          organization_id: string
          proposal_id?: string | null
          role?: string | null
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          hours_per_day?: number
          id?: string
          notes?: string | null
          organization_id?: string
          proposal_id?: string | null
          role?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_allocations_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_allocations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_recognition: {
        Row: {
          created_at: string
          deferred_amount: number
          id: string
          method: string
          notes: string | null
          organization_id: string
          period_end: string
          period_start: string
          proposal_id: string
          recognized_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deferred_amount?: number
          id?: string
          method?: string
          notes?: string | null
          organization_id: string
          period_end: string
          period_start: string
          proposal_id: string
          recognized_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deferred_amount?: number
          id?: string
          method?: string
          notes?: string | null
          organization_id?: string
          period_end?: string
          period_start?: string
          proposal_id?: string
          recognized_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_recognition_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_recognition_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_pipelines: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          organization_id: string
          stages: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          stages?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          stages?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_pipelines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_reports: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          id: string
          is_favorite: boolean
          name: string
          organization_id: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_favorite?: boolean
          name: string
          organization_id: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_favorite?: boolean
          name?: string
          organization_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          call_time: string | null
          created_at: string
          date: string
          end_time: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          proposal_id: string
          start_time: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          call_time?: string | null
          created_at?: string
          date: string
          end_time: string
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          proposal_id: string
          start_time: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          call_time?: string | null
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          proposal_id?: string
          start_time?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_configurations: {
        Row: {
          client_id: string
          created_at: string
          enabled: boolean
          id: string
          metadata_url: string | null
          organization_id: string
          provider: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          metadata_url?: string | null
          organization_id: string
          provider: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          metadata_url?: string | null
          organization_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          entity_type: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          entity_type: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          color?: string
          created_at?: string
          entity_type?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          depends_on_task_id: string
          id: string
          task_id: string
          type: string
        }
        Insert: {
          created_at?: string
          depends_on_task_id: string
          id?: string
          task_id: string
          type?: string
        }
        Update: {
          created_at?: string
          depends_on_task_id?: string
          id?: string
          task_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          organization_id: string
          phase_id: string | null
          priority: string
          proposal_id: string | null
          sort_order: number
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          organization_id: string
          phase_id?: string | null
          priority?: string
          proposal_id?: string | null
          sort_order?: number
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          organization_id?: string
          phase_id?: string | null
          priority?: string
          proposal_id?: string | null
          sort_order?: number
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      team_assignments: {
        Row: {
          created_at: string
          facility_id: string | null
          id: string
          proposal_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          facility_id?: string | null
          id?: string
          proposal_id: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          facility_id?: string | null
          id?: string
          proposal_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_assignments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_documents: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          organization_id: string
          sections: Json
          status: Database["public"]["Enums"]["terms_document_status"]
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          sections?: Json
          status?: Database["public"]["Enums"]["terms_document_status"]
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          sections?: Json
          status?: Database["public"]["Enums"]["terms_document_status"]
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "terms_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          approved_by: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          end_time: string | null
          hourly_rate: number | null
          id: string
          is_approved: boolean
          is_billable: boolean
          organization_id: string
          phase_id: string | null
          proposal_id: string | null
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          is_approved?: boolean
          is_billable?: boolean
          organization_id: string
          phase_id?: string | null
          proposal_id?: string | null
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          is_approved?: boolean
          is_billable?: boolean
          organization_id?: string
          phase_id?: string | null
          proposal_id?: string | null
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off_balances: {
        Row: {
          carried_over: number
          created_at: string
          entitled_days: number
          id: string
          organization_id: string
          policy_id: string
          updated_at: string
          used_days: number
          user_id: string
          year: number
        }
        Insert: {
          carried_over?: number
          created_at?: string
          entitled_days?: number
          id?: string
          organization_id: string
          policy_id: string
          updated_at?: string
          used_days?: number
          user_id: string
          year: number
        }
        Update: {
          carried_over?: number
          created_at?: string
          entitled_days?: number
          id?: string
          organization_id?: string
          policy_id?: string
          updated_at?: string
          used_days?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "time_off_balances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_balances_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "time_off_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off_policies: {
        Row: {
          carry_over_max: number
          created_at: string
          days_per_year: number
          id: string
          name: string
          organization_id: string
          requires_approval: boolean
          type: string
          updated_at: string
        }
        Insert: {
          carry_over_max?: number
          created_at?: string
          days_per_year?: number
          id?: string
          name: string
          organization_id: string
          requires_approval?: boolean
          type: string
          updated_at?: string
        }
        Update: {
          carry_over_max?: number
          created_at?: string
          days_per_year?: number
          id?: string
          name?: string
          organization_id?: string
          requires_approval?: boolean
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          days_requested: number
          end_date: string
          id: string
          organization_id: string
          policy_id: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_requested: number
          end_date: string
          id?: string
          organization_id: string
          policy_id: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_requested?: number
          end_date?: string
          id?: string
          organization_id?: string
          policy_id?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_requests_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "time_off_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      time_policies: {
        Row: {
          created_at: string
          id: string
          max_hours_per_day: number
          max_hours_per_week: number
          name: string
          organization_id: string
          overtime_multiplier: number
          requires_approval: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_hours_per_day?: number
          max_hours_per_week?: number
          name: string
          organization_id: string
          overtime_multiplier?: number
          requires_approval?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_hours_per_day?: number
          max_hours_per_week?: number
          name?: string
          organization_id?: string
          overtime_multiplier?: number
          requires_approval?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          organization_id: string
          status: string
          submitted_at: string | null
          total_hours: number
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          organization_id: string
          status?: string
          submitted_at?: string | null
          total_hours?: number
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          status?: string
          submitted_at?: string | null
          total_hours?: number
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          date_format: string
          default_calendar_view: string
          first_day_of_week: number
          id: string
          language: string
          number_format: string
          organization_id: string
          sidebar_collapsed: boolean
          theme: string
          time_format: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_format?: string
          default_calendar_view?: string
          first_day_of_week?: number
          id?: string
          language?: string
          number_format?: string
          organization_id: string
          sidebar_collapsed?: boolean
          theme?: string
          time_format?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_format?: string
          default_calendar_view?: string
          first_day_of_week?: number
          id?: string
          language?: string
          number_format?: string
          organization_id?: string
          sidebar_collapsed?: boolean
          theme?: string
          time_format?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          employment_type: string | null
          facility_id: string | null
          first_name: string
          full_name: string
          hourly_cost: number | null
          id: string
          last_login_at: string | null
          last_name: string
          login_count: number
          mfa_enabled: boolean
          notification_preferences: Json
          organization_id: string
          phone: string | null
          rate_card: string | null
          role: Database["public"]["Enums"]["org_role"]
          start_date: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          employment_type?: string | null
          facility_id?: string | null
          first_name: string
          full_name: string
          hourly_cost?: number | null
          id: string
          last_login_at?: string | null
          last_name: string
          login_count?: number
          mfa_enabled?: boolean
          notification_preferences?: Json
          organization_id: string
          phone?: string | null
          rate_card?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          start_date?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          employment_type?: string | null
          facility_id?: string | null
          first_name?: string
          full_name?: string
          hourly_cost?: number | null
          id?: string
          last_login_at?: string | null
          last_name?: string
          login_count?: number
          mfa_enabled?: boolean
          notification_preferences?: Json
          organization_id?: string
          phone?: string | null
          rate_card?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          start_date?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          activation_dates: Json | null
          address: Json
          contact_on_site: Json | null
          created_at: string
          id: string
          load_in: Json | null
          name: string
          notes: string | null
          proposal_id: string
          sequence: number
          site_constraints: Json
          strike: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          activation_dates?: Json | null
          address?: Json
          contact_on_site?: Json | null
          created_at?: string
          id?: string
          load_in?: Json | null
          name: string
          notes?: string | null
          proposal_id: string
          sequence?: number
          site_constraints?: Json
          strike?: Json | null
          type?: string
          updated_at?: string
        }
        Update: {
          activation_dates?: Json | null
          address?: Json
          contact_on_site?: Json | null
          created_at?: string
          id?: string
          load_in?: Json | null
          name?: string
          notes?: string | null
          proposal_id?: string
          sequence?: number
          site_constraints?: Json
          strike?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_transfers: {
        Row: {
          created_at: string
          from_facility_id: string
          id: string
          initiated_by: string
          items: Json
          notes: string | null
          organization_id: string
          received_at: string | null
          shipped_at: string | null
          status: string
          to_facility_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_facility_id: string
          id?: string
          initiated_by: string
          items?: Json
          notes?: string | null
          organization_id: string
          received_at?: string | null
          shipped_at?: string | null
          status?: string
          to_facility_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_facility_id?: string
          id?: string
          initiated_by?: string
          items?: Json
          notes?: string | null
          organization_id?: string
          received_at?: string | null
          shipped_at?: string | null
          status?: string
          to_facility_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_transfers_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          delivered_at: string
          event: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          webhook_endpoint_id: string
        }
        Insert: {
          delivered_at?: string
          event: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          webhook_endpoint_id: string
        }
        Update: {
          delivered_at?: string
          event?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          webhook_endpoint_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_endpoint_id_fkey"
            columns: ["webhook_endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          organization_id: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          organization_id: string
          secret: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          organization_id?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_user_org_id: { Args: never; Returns: string }
      auth_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["org_role"]
      }
      auth_user_subscription_tier: {
        Args: never
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      is_org_admin_or_above: { Args: never; Returns: boolean }
      is_producer_role: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      tier_has_access: {
        Args: { required: Database["public"]["Enums"]["subscription_tier"] }
        Returns: boolean
      }
    }
    Enums: {
      actor_type: "admin" | "client" | "system"
      asset_condition:
        | "new"
        | "excellent"
        | "good"
        | "fair"
        | "poor"
        | "damaged"
      asset_status:
        | "planned"
        | "in_production"
        | "in_transit"
        | "deployed"
        | "in_storage"
        | "retired"
        | "disposed"
      availability_status: "available" | "unavailable" | "tentative"
      booking_status:
        | "offered"
        | "accepted"
        | "declined"
        | "confirmed"
        | "cancelled"
      change_order_status:
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "void"
      contact_role: "primary" | "billing" | "creative" | "operations"
      creative_reference_type:
        | "reference"
        | "mood"
        | "palette"
        | "experience"
        | "campaign"
        | "material"
        | "competitor"
        | "inspiration"
      crew_rate_type:
        | "hourly"
        | "day"
        | "overtime"
        | "per_diem"
        | "travel"
        | "flat"
      custom_field_type:
        | "text"
        | "textarea"
        | "number"
        | "currency"
        | "date"
        | "datetime"
        | "boolean"
        | "select"
        | "multi_select"
        | "url"
        | "email"
        | "phone"
        | "file"
        | "user"
        | "relation"
      deal_stage:
        | "lead"
        | "qualified"
        | "proposal_sent"
        | "negotiation"
        | "verbal_yes"
        | "contract_signed"
        | "lost"
        | "on_hold"
      esign_status: "pending" | "viewed" | "signed" | "declined" | "expired"
      expense_status: "pending" | "approved" | "rejected" | "reimbursed"
      integration_status:
        | "disconnected"
        | "connecting"
        | "connected"
        | "error"
        | "suspended"
      invoice_status:
        | "draft"
        | "sent"
        | "viewed"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "void"
      invoice_type:
        | "deposit"
        | "balance"
        | "change_order"
        | "addon"
        | "final"
        | "recurring"
      lead_status: "new" | "contacted" | "qualified" | "converted" | "lost"
      maintenance_status: "scheduled" | "in_progress" | "complete" | "cancelled"
      maintenance_type: "repair" | "inspection" | "cleaning" | "calibration"
      milestone_status: "pending" | "in_progress" | "complete"
      onboarding_doc_status: "pending" | "uploaded" | "verified" | "rejected"
      onboarding_doc_type:
        | "w9"
        | "nda"
        | "i9"
        | "direct_deposit"
        | "emergency_contact"
        | "other"
      org_role:
        | "super_admin"
        | "org_admin"
        | "project_manager"
        | "designer"
        | "fabricator"
        | "installer"
        | "client_primary"
        | "client_viewer"
      payment_link_status: "active" | "paid" | "expired"
      phase_status:
        | "not_started"
        | "in_progress"
        | "pending_approval"
        | "approved"
        | "complete"
        | "skipped"
      po_status: "draft" | "sent" | "acknowledged" | "received" | "cancelled"
      proposal_status:
        | "draft"
        | "sent"
        | "viewed"
        | "negotiating"
        | "approved"
        | "in_production"
        | "active"
        | "complete"
        | "cancelled"
      requirement_assignee: "client" | "producer" | "both" | "external_vendor"
      requirement_status: "pending" | "in_progress" | "complete" | "waived"
      reservation_status: "reserved" | "checked_out" | "returned" | "cancelled"
      subscription_tier: "free" | "starter" | "professional" | "enterprise"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "todo"
        | "in_progress"
        | "review"
        | "done"
        | "blocked"
        | "cancelled"
      terms_document_status: "draft" | "active" | "archived"
      time_off_status: "pending" | "approved" | "rejected" | "cancelled"
      timesheet_status: "draft" | "submitted" | "approved" | "rejected"
      transfer_status: "pending" | "in_transit" | "received" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      actor_type: ["admin", "client", "system"],
      asset_condition: ["new", "excellent", "good", "fair", "poor", "damaged"],
      asset_status: [
        "planned",
        "in_production",
        "in_transit",
        "deployed",
        "in_storage",
        "retired",
        "disposed",
      ],
      availability_status: ["available", "unavailable", "tentative"],
      booking_status: [
        "offered",
        "accepted",
        "declined",
        "confirmed",
        "cancelled",
      ],
      change_order_status: [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "void",
      ],
      contact_role: ["primary", "billing", "creative", "operations"],
      creative_reference_type: [
        "reference",
        "mood",
        "palette",
        "experience",
        "campaign",
        "material",
        "competitor",
        "inspiration",
      ],
      crew_rate_type: [
        "hourly",
        "day",
        "overtime",
        "per_diem",
        "travel",
        "flat",
      ],
      custom_field_type: [
        "text",
        "textarea",
        "number",
        "currency",
        "date",
        "datetime",
        "boolean",
        "select",
        "multi_select",
        "url",
        "email",
        "phone",
        "file",
        "user",
        "relation",
      ],
      deal_stage: [
        "lead",
        "qualified",
        "proposal_sent",
        "negotiation",
        "verbal_yes",
        "contract_signed",
        "lost",
        "on_hold",
      ],
      esign_status: ["pending", "viewed", "signed", "declined", "expired"],
      expense_status: ["pending", "approved", "rejected", "reimbursed"],
      integration_status: [
        "disconnected",
        "connecting",
        "connected",
        "error",
        "suspended",
      ],
      invoice_status: [
        "draft",
        "sent",
        "viewed",
        "partially_paid",
        "paid",
        "overdue",
        "void",
      ],
      invoice_type: [
        "deposit",
        "balance",
        "change_order",
        "addon",
        "final",
        "recurring",
      ],
      lead_status: ["new", "contacted", "qualified", "converted", "lost"],
      maintenance_status: ["scheduled", "in_progress", "complete", "cancelled"],
      maintenance_type: ["repair", "inspection", "cleaning", "calibration"],
      milestone_status: ["pending", "in_progress", "complete"],
      onboarding_doc_status: ["pending", "uploaded", "verified", "rejected"],
      onboarding_doc_type: [
        "w9",
        "nda",
        "i9",
        "direct_deposit",
        "emergency_contact",
        "other",
      ],
      org_role: [
        "super_admin",
        "org_admin",
        "project_manager",
        "designer",
        "fabricator",
        "installer",
        "client_primary",
        "client_viewer",
      ],
      payment_link_status: ["active", "paid", "expired"],
      phase_status: [
        "not_started",
        "in_progress",
        "pending_approval",
        "approved",
        "complete",
        "skipped",
      ],
      po_status: ["draft", "sent", "acknowledged", "received", "cancelled"],
      proposal_status: [
        "draft",
        "sent",
        "viewed",
        "negotiating",
        "approved",
        "in_production",
        "active",
        "complete",
        "cancelled",
      ],
      requirement_assignee: ["client", "producer", "both", "external_vendor"],
      requirement_status: ["pending", "in_progress", "complete", "waived"],
      reservation_status: ["reserved", "checked_out", "returned", "cancelled"],
      subscription_tier: ["free", "starter", "professional", "enterprise"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "todo",
        "in_progress",
        "review",
        "done",
        "blocked",
        "cancelled",
      ],
      terms_document_status: ["draft", "active", "archived"],
      time_off_status: ["pending", "approved", "rejected", "cancelled"],
      timesheet_status: ["draft", "submitted", "approved", "rejected"],
      transfer_status: ["pending", "in_transit", "received", "cancelled"],
    },
  },
} as const
