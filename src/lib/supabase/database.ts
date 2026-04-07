export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      activation_assignments: {
        Row: {
          activation_id: string
          created_at: string
          id: string
          notes: string | null
          project_id: string
        }
        Insert: {
          activation_id: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
        }
        Update: {
          activation_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activation_assignments_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: false
            referencedRelation: "activations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      activations: {
        Row: {
          created_at: string
          ends_at: string | null
          event_id: string
          id: string
          load_in: Json | null
          location_id: string
          name: string
          notes: string | null
          organization_id: string
          starts_at: string | null
          status: string
          strike: Json | null
          type: Database["public"]["Enums"]["activation_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          event_id: string
          id?: string
          load_in?: Json | null
          location_id: string
          name: string
          notes?: string | null
          organization_id: string
          starts_at?: string | null
          status?: string
          strike?: Json | null
          type?: Database["public"]["Enums"]["activation_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          event_id?: string
          id?: string
          load_in?: Json | null
          location_id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          starts_at?: string | null
          status?: string
          strike?: Json | null
          type?: Database["public"]["Enums"]["activation_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      advance_access_codes: {
        Row: {
          advance_id: string
          allowed_advance_types:
            | Database["public"]["Enums"]["advance_type"][]
            | null
          allowed_category_groups: string[] | null
          allowed_domains: string[] | null
          code: string
          code_type: Database["public"]["Enums"]["access_code_type"]
          collaborator_role: Database["public"]["Enums"]["collaborator_role"]
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          metadata: Json | null
        }
        Insert: {
          advance_id: string
          allowed_advance_types?:
            | Database["public"]["Enums"]["advance_type"][]
            | null
          allowed_category_groups?: string[] | null
          allowed_domains?: string[] | null
          code: string
          code_type?: Database["public"]["Enums"]["access_code_type"]
          collaborator_role?: Database["public"]["Enums"]["collaborator_role"]
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
        }
        Update: {
          advance_id?: string
          allowed_advance_types?:
            | Database["public"]["Enums"]["advance_type"][]
            | null
          allowed_category_groups?: string[] | null
          allowed_domains?: string[] | null
          code?: string
          code_type?: Database["public"]["Enums"]["access_code_type"]
          collaborator_role?: Database["public"]["Enums"]["collaborator_role"]
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_access_codes_advance_id_fkey"
            columns: ["advance_id"]
            isOneToOne: false
            referencedRelation: "production_advances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_access_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_catalog_items: {
        Row: {
          bundle_components: Json | null
          created_at: string | null
          currency_code: string | null
          default_unit_of_measure:
            | Database["public"]["Enums"]["unit_of_measure"]
            | null
          description: string | null
          display_name: string | null
          has_variants: boolean | null
          id: string
          image_urls: string[] | null
          is_active: boolean | null
          is_discountable: boolean | null
          is_shared_catalog: boolean | null
          is_system: boolean | null
          is_taxable: boolean | null
          is_trackable: boolean | null
          item_code: string
          metadata: Json | null
          name: string
          organization_id: string
          prerequisites: string[] | null
          pricing_strategy:
            | Database["public"]["Enums"]["pricing_strategy"]
            | null
          procurement_method:
            | Database["public"]["Enums"]["procurement_method"]
            | null
          product_type: string | null
          recommended_items: string[] | null
          related_names: string[] | null
          revenue_category: string | null
          search_vector: unknown
          short_description: string | null
          sku_prefix: string | null
          sort_order: number | null
          specifications: Json | null
          subcategory_id: string
          tax_class: string | null
          thumbnail_url: string | null
          updated_at: string | null
          variant_attributes: Json | null
          version: number | null
        }
        Insert: {
          bundle_components?: Json | null
          created_at?: string | null
          currency_code?: string | null
          default_unit_of_measure?:
            | Database["public"]["Enums"]["unit_of_measure"]
            | null
          description?: string | null
          display_name?: string | null
          has_variants?: boolean | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          is_discountable?: boolean | null
          is_shared_catalog?: boolean | null
          is_system?: boolean | null
          is_taxable?: boolean | null
          is_trackable?: boolean | null
          item_code: string
          metadata?: Json | null
          name: string
          organization_id: string
          prerequisites?: string[] | null
          pricing_strategy?:
            | Database["public"]["Enums"]["pricing_strategy"]
            | null
          procurement_method?:
            | Database["public"]["Enums"]["procurement_method"]
            | null
          product_type?: string | null
          recommended_items?: string[] | null
          related_names?: string[] | null
          revenue_category?: string | null
          search_vector?: unknown
          short_description?: string | null
          sku_prefix?: string | null
          sort_order?: number | null
          specifications?: Json | null
          subcategory_id: string
          tax_class?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          variant_attributes?: Json | null
          version?: number | null
        }
        Update: {
          bundle_components?: Json | null
          created_at?: string | null
          currency_code?: string | null
          default_unit_of_measure?:
            | Database["public"]["Enums"]["unit_of_measure"]
            | null
          description?: string | null
          display_name?: string | null
          has_variants?: boolean | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          is_discountable?: boolean | null
          is_shared_catalog?: boolean | null
          is_system?: boolean | null
          is_taxable?: boolean | null
          is_trackable?: boolean | null
          item_code?: string
          metadata?: Json | null
          name?: string
          organization_id?: string
          prerequisites?: string[] | null
          pricing_strategy?:
            | Database["public"]["Enums"]["pricing_strategy"]
            | null
          procurement_method?:
            | Database["public"]["Enums"]["procurement_method"]
            | null
          product_type?: string | null
          recommended_items?: string[] | null
          related_names?: string[] | null
          revenue_category?: string | null
          search_vector?: unknown
          short_description?: string | null
          sku_prefix?: string | null
          sort_order?: number | null
          specifications?: Json | null
          subcategory_id?: string
          tax_class?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          variant_attributes?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_catalog_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_catalog_items_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "advance_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_catalog_variants: {
        Row: {
          barcode: string | null
          compare_at_price_cents: number | null
          cost_cents: number | null
          created_at: string | null
          dimensions: Json | null
          id: string
          increment_quantity: number | null
          is_active: boolean | null
          is_sellable: boolean | null
          is_stockable: boolean | null
          item_id: string
          lead_time_hours: number | null
          maximum_order_quantity: number | null
          metadata: Json | null
          minimum_order_quantity: number | null
          name: string
          option_values: Json | null
          organization_id: string
          price_cents: number | null
          price_tiers: Json | null
          pricing_strategy:
            | Database["public"]["Enums"]["pricing_strategy"]
            | null
          requires_shipping: boolean | null
          sku: string | null
          sort_order: number | null
          unit_of_measure: Database["public"]["Enums"]["unit_of_measure"] | null
          updated_at: string | null
          version: number | null
          weight_grams: number | null
        }
        Insert: {
          barcode?: string | null
          compare_at_price_cents?: number | null
          cost_cents?: number | null
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          increment_quantity?: number | null
          is_active?: boolean | null
          is_sellable?: boolean | null
          is_stockable?: boolean | null
          item_id: string
          lead_time_hours?: number | null
          maximum_order_quantity?: number | null
          metadata?: Json | null
          minimum_order_quantity?: number | null
          name: string
          option_values?: Json | null
          organization_id: string
          price_cents?: number | null
          price_tiers?: Json | null
          pricing_strategy?:
            | Database["public"]["Enums"]["pricing_strategy"]
            | null
          requires_shipping?: boolean | null
          sku?: string | null
          sort_order?: number | null
          unit_of_measure?:
            | Database["public"]["Enums"]["unit_of_measure"]
            | null
          updated_at?: string | null
          version?: number | null
          weight_grams?: number | null
        }
        Update: {
          barcode?: string | null
          compare_at_price_cents?: number | null
          cost_cents?: number | null
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          increment_quantity?: number | null
          is_active?: boolean | null
          is_sellable?: boolean | null
          is_stockable?: boolean | null
          item_id?: string
          lead_time_hours?: number | null
          maximum_order_quantity?: number | null
          metadata?: Json | null
          minimum_order_quantity?: number | null
          name?: string
          option_values?: Json | null
          organization_id?: string
          price_cents?: number | null
          price_tiers?: Json | null
          pricing_strategy?:
            | Database["public"]["Enums"]["pricing_strategy"]
            | null
          requires_shipping?: boolean | null
          sku?: string | null
          sort_order?: number | null
          unit_of_measure?:
            | Database["public"]["Enums"]["unit_of_measure"]
            | null
          updated_at?: string | null
          version?: number | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_catalog_variants_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "advance_catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_catalog_variants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_categories: {
        Row: {
          created_at: string | null
          description: string | null
          group_id: string
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_system: boolean | null
          metadata: Json | null
          name: string
          organization_id: string
          slug: string
          sort_order: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_id: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_system?: boolean | null
          metadata?: Json | null
          name: string
          organization_id: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_id?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_system?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "advance_category_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_category_groups: {
        Row: {
          color_hex: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          metadata: Json | null
          name: string
          organization_id: string
          slug: string
          sort_order: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          metadata?: Json | null
          name: string
          organization_id: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_category_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_collaborators: {
        Row: {
          accepted_at: string | null
          access_code_id: string | null
          advance_id: string
          allowed_advance_types:
            | Database["public"]["Enums"]["advance_type"][]
            | null
          allowed_category_groups: string[] | null
          collaborator_role: Database["public"]["Enums"]["collaborator_role"]
          created_at: string | null
          custom_instructions: string | null
          declined_at: string | null
          email: string | null
          id: string
          invite_status: Database["public"]["Enums"]["invite_status"]
          invited_at: string | null
          invited_by: string | null
          last_accessed_at: string | null
          metadata: Json | null
          organization_id: string | null
          revoked_at: string | null
          submission_notes: string | null
          submission_status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          access_code_id?: string | null
          advance_id: string
          allowed_advance_types?:
            | Database["public"]["Enums"]["advance_type"][]
            | null
          allowed_category_groups?: string[] | null
          collaborator_role?: Database["public"]["Enums"]["collaborator_role"]
          created_at?: string | null
          custom_instructions?: string | null
          declined_at?: string | null
          email?: string | null
          id?: string
          invite_status?: Database["public"]["Enums"]["invite_status"]
          invited_at?: string | null
          invited_by?: string | null
          last_accessed_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          revoked_at?: string | null
          submission_notes?: string | null
          submission_status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          access_code_id?: string | null
          advance_id?: string
          allowed_advance_types?:
            | Database["public"]["Enums"]["advance_type"][]
            | null
          allowed_category_groups?: string[] | null
          collaborator_role?: Database["public"]["Enums"]["collaborator_role"]
          created_at?: string | null
          custom_instructions?: string | null
          declined_at?: string | null
          email?: string | null
          id?: string
          invite_status?: Database["public"]["Enums"]["invite_status"]
          invited_at?: string | null
          invited_by?: string | null
          last_accessed_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          revoked_at?: string | null
          submission_notes?: string | null
          submission_status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_collaborators_access_code_id_fkey"
            columns: ["access_code_id"]
            isOneToOne: false
            referencedRelation: "advance_access_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_collaborators_advance_id_fkey"
            columns: ["advance_id"]
            isOneToOne: false
            referencedRelation: "production_advances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_collaborators_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_collaborators_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_comments: {
        Row: {
          advance_id: string
          attachments: Json | null
          comment_text: string
          created_at: string | null
          id: string
          is_contributor_visible: boolean | null
          is_internal: boolean | null
          line_item_id: string | null
          mentioned_user_ids: string[] | null
          parent_comment_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          advance_id: string
          attachments?: Json | null
          comment_text: string
          created_at?: string | null
          id?: string
          is_contributor_visible?: boolean | null
          is_internal?: boolean | null
          line_item_id?: string | null
          mentioned_user_ids?: string[] | null
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          advance_id?: string
          attachments?: Json | null
          comment_text?: string
          created_at?: string | null
          id?: string
          is_contributor_visible?: boolean | null
          is_internal?: boolean | null
          line_item_id?: string | null
          mentioned_user_ids?: string[] | null
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_comments_advance_id_fkey"
            columns: ["advance_id"]
            isOneToOne: false
            referencedRelation: "production_advances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_comments_line_item_id_fkey"
            columns: ["line_item_id"]
            isOneToOne: false
            referencedRelation: "advance_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "advance_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_inventory_levels: {
        Row: {
          id: string
          last_counted_at: string | null
          location_id: string
          metadata: Json | null
          organization_id: string
          quantity_damaged: number | null
          quantity_incoming: number | null
          quantity_on_hand: number | null
          quantity_reserved: number | null
          reorder_point: number | null
          reorder_quantity: number | null
          updated_at: string | null
          variant_id: string
        }
        Insert: {
          id?: string
          last_counted_at?: string | null
          location_id: string
          metadata?: Json | null
          organization_id: string
          quantity_damaged?: number | null
          quantity_incoming?: number | null
          quantity_on_hand?: number | null
          quantity_reserved?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          updated_at?: string | null
          variant_id: string
        }
        Update: {
          id?: string
          last_counted_at?: string | null
          location_id?: string
          metadata?: Json | null
          organization_id?: string
          quantity_damaged?: number | null
          quantity_incoming?: number | null
          quantity_on_hand?: number | null
          quantity_reserved?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          updated_at?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advance_inventory_levels_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "advance_inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_inventory_levels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_inventory_levels_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "advance_catalog_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_inventory_locations: {
        Row: {
          address: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          location_type: string | null
          metadata: Json | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_type?: string | null
          metadata?: Json | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_type?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_inventory_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_inventory_transactions: {
        Row: {
          created_at: string | null
          id: string
          location_id: string
          organization_id: string
          performed_by: string | null
          quantity_change: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          variant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_id: string
          organization_id: string
          performed_by?: string | null
          quantity_change: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          variant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location_id?: string
          organization_id?: string
          performed_by?: string | null
          quantity_change?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advance_inventory_transactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "advance_inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_inventory_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_inventory_transactions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_inventory_transactions_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "advance_catalog_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_item_modifier_lists: {
        Row: {
          id: string
          item_id: string
          max_selected_override: number | null
          min_selected_override: number | null
          modifier_list_id: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          item_id: string
          max_selected_override?: number | null
          min_selected_override?: number | null
          modifier_list_id: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          item_id?: string
          max_selected_override?: number | null
          min_selected_override?: number | null
          modifier_list_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_item_modifier_lists_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "advance_catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_item_modifier_lists_modifier_list_id_fkey"
            columns: ["modifier_list_id"]
            isOneToOne: false
            referencedRelation: "advance_modifier_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_line_items: {
        Row: {
          actual_delivery_at: string | null
          advance_id: string
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_location_id: string | null
          assigned_user_id: string | null
          assigned_vendor_id: string | null
          catalog_item_id: string | null
          catalog_variant_id: string | null
          collaborator_id: string | null
          created_at: string | null
          damage_report: Json | null
          discount_cents: number | null
          expected_delivery_at: string | null
          fulfillment_status:
            | Database["public"]["Enums"]["fulfillment_status"]
            | null
          fulfillment_type:
            | Database["public"]["Enums"]["fulfillment_type"]
            | null
          id: string
          internal_notes: string | null
          item_code: string | null
          item_description: string | null
          item_name: string
          line_total_cents: number | null
          load_in_date: string | null
          make_model: string | null
          metadata: Json | null
          modifier_total_cents: number | null
          notes: string | null
          organization_id: string
          purpose: string | null
          quantity: number
          rejection_reason: string | null
          returned_at: string | null
          revenue_category: string | null
          selected_modifiers: Json | null
          service_end_date: string | null
          service_start_date: string | null
          sort_order: number | null
          special_considerations: string | null
          special_request: string | null
          specifications_snapshot: Json | null
          strike_date: string | null
          submitted_by_org_id: string | null
          submitted_by_user_id: string | null
          tax_cents: number | null
          tracking_number: string | null
          unit_of_measure: Database["public"]["Enums"]["unit_of_measure"] | null
          unit_price_cents: number | null
          updated_at: string | null
          variant_name: string | null
          variant_sku: string | null
          vendor_confirmation_number: string | null
          version: number | null
        }
        Insert: {
          actual_delivery_at?: string | null
          advance_id: string
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_location_id?: string | null
          assigned_user_id?: string | null
          assigned_vendor_id?: string | null
          catalog_item_id?: string | null
          catalog_variant_id?: string | null
          collaborator_id?: string | null
          created_at?: string | null
          damage_report?: Json | null
          discount_cents?: number | null
          expected_delivery_at?: string | null
          fulfillment_status?:
            | Database["public"]["Enums"]["fulfillment_status"]
            | null
          fulfillment_type?:
            | Database["public"]["Enums"]["fulfillment_type"]
            | null
          id?: string
          internal_notes?: string | null
          item_code?: string | null
          item_description?: string | null
          item_name: string
          line_total_cents?: number | null
          load_in_date?: string | null
          make_model?: string | null
          metadata?: Json | null
          modifier_total_cents?: number | null
          notes?: string | null
          organization_id: string
          purpose?: string | null
          quantity?: number
          rejection_reason?: string | null
          returned_at?: string | null
          revenue_category?: string | null
          selected_modifiers?: Json | null
          service_end_date?: string | null
          service_start_date?: string | null
          sort_order?: number | null
          special_considerations?: string | null
          special_request?: string | null
          specifications_snapshot?: Json | null
          strike_date?: string | null
          submitted_by_org_id?: string | null
          submitted_by_user_id?: string | null
          tax_cents?: number | null
          tracking_number?: string | null
          unit_of_measure?:
            | Database["public"]["Enums"]["unit_of_measure"]
            | null
          unit_price_cents?: number | null
          updated_at?: string | null
          variant_name?: string | null
          variant_sku?: string | null
          vendor_confirmation_number?: string | null
          version?: number | null
        }
        Update: {
          actual_delivery_at?: string | null
          advance_id?: string
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_location_id?: string | null
          assigned_user_id?: string | null
          assigned_vendor_id?: string | null
          catalog_item_id?: string | null
          catalog_variant_id?: string | null
          collaborator_id?: string | null
          created_at?: string | null
          damage_report?: Json | null
          discount_cents?: number | null
          expected_delivery_at?: string | null
          fulfillment_status?:
            | Database["public"]["Enums"]["fulfillment_status"]
            | null
          fulfillment_type?:
            | Database["public"]["Enums"]["fulfillment_type"]
            | null
          id?: string
          internal_notes?: string | null
          item_code?: string | null
          item_description?: string | null
          item_name?: string
          line_total_cents?: number | null
          load_in_date?: string | null
          make_model?: string | null
          metadata?: Json | null
          modifier_total_cents?: number | null
          notes?: string | null
          organization_id?: string
          purpose?: string | null
          quantity?: number
          rejection_reason?: string | null
          returned_at?: string | null
          revenue_category?: string | null
          selected_modifiers?: Json | null
          service_end_date?: string | null
          service_start_date?: string | null
          sort_order?: number | null
          special_considerations?: string | null
          special_request?: string | null
          specifications_snapshot?: Json | null
          strike_date?: string | null
          submitted_by_org_id?: string | null
          submitted_by_user_id?: string | null
          tax_cents?: number | null
          tracking_number?: string | null
          unit_of_measure?:
            | Database["public"]["Enums"]["unit_of_measure"]
            | null
          unit_price_cents?: number | null
          updated_at?: string | null
          variant_name?: string | null
          variant_sku?: string | null
          vendor_confirmation_number?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_line_items_advance_id_fkey"
            columns: ["advance_id"]
            isOneToOne: false
            referencedRelation: "production_advances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_line_items_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_line_items_assigned_location_id_fkey"
            columns: ["assigned_location_id"]
            isOneToOne: false
            referencedRelation: "advance_inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_line_items_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_line_items_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "client_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_line_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "advance_catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_line_items_catalog_variant_id_fkey"
            columns: ["catalog_variant_id"]
            isOneToOne: false
            referencedRelation: "advance_catalog_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_line_items_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "advance_collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_line_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_line_items_submitted_by_org_id_fkey"
            columns: ["submitted_by_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_line_items_submitted_by_user_id_fkey"
            columns: ["submitted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_modifier_lists: {
        Row: {
          allow_quantities: boolean | null
          created_at: string | null
          id: string
          is_required: boolean | null
          max_selected: number | null
          metadata: Json | null
          min_selected: number | null
          name: string
          organization_id: string
          selection_type:
            | Database["public"]["Enums"]["modifier_selection_type"]
            | null
          sort_order: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          allow_quantities?: boolean | null
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          max_selected?: number | null
          metadata?: Json | null
          min_selected?: number | null
          name: string
          organization_id: string
          selection_type?:
            | Database["public"]["Enums"]["modifier_selection_type"]
            | null
          sort_order?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          allow_quantities?: boolean | null
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          max_selected?: number | null
          metadata?: Json | null
          min_selected?: number | null
          name?: string
          organization_id?: string
          selection_type?:
            | Database["public"]["Enums"]["modifier_selection_type"]
            | null
          sort_order?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_modifier_lists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_modifier_options: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          metadata: Json | null
          modifier_list_id: string
          name: string
          organization_id: string
          pre_modifier: string | null
          price_adjustment_cents: number | null
          price_adjustment_type: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          modifier_list_id: string
          name: string
          organization_id: string
          pre_modifier?: string | null
          price_adjustment_cents?: number | null
          price_adjustment_type?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          modifier_list_id?: string
          name?: string
          organization_id?: string
          pre_modifier?: string | null
          price_adjustment_cents?: number | null
          price_adjustment_type?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_modifier_options_modifier_list_id_fkey"
            columns: ["modifier_list_id"]
            isOneToOne: false
            referencedRelation: "advance_modifier_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_modifier_options_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_status_history: {
        Row: {
          advance_id: string
          changed_by: string | null
          created_at: string | null
          entity_type: string
          id: string
          line_item_id: string | null
          metadata: Json | null
          new_status: string
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          advance_id: string
          changed_by?: string | null
          created_at?: string | null
          entity_type?: string
          id?: string
          line_item_id?: string | null
          metadata?: Json | null
          new_status: string
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          advance_id?: string
          changed_by?: string | null
          created_at?: string | null
          entity_type?: string
          id?: string
          line_item_id?: string | null
          metadata?: Json | null
          new_status?: string
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_status_history_advance_id_fkey"
            columns: ["advance_id"]
            isOneToOne: false
            referencedRelation: "production_advances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_status_history_line_item_id_fkey"
            columns: ["line_item_id"]
            isOneToOne: false
            referencedRelation: "advance_line_items"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          organization_id: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          organization_id: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "advance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_subcategories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_templates: {
        Row: {
          advance_mode: Database["public"]["Enums"]["advance_mode"] | null
          advance_type: Database["public"]["Enums"]["advance_type"] | null
          collection_settings: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_shared: boolean | null
          metadata: Json | null
          name: string
          organization_id: string
          template_items: Json
          updated_at: string | null
          use_count: number | null
        }
        Insert: {
          advance_mode?: Database["public"]["Enums"]["advance_mode"] | null
          advance_type?: Database["public"]["Enums"]["advance_type"] | null
          collection_settings?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          metadata?: Json | null
          name: string
          organization_id: string
          template_items?: Json
          updated_at?: string | null
          use_count?: number | null
        }
        Update: {
          advance_mode?: Database["public"]["Enums"]["advance_mode"] | null
          advance_type?: Database["public"]["Enums"]["advance_type"] | null
          collection_settings?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          template_items?: Json
          updated_at?: string | null
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_webhook_events: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          organization_id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          organization_id: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          organization_id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_webhook_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          allowed_ips: unknown[]
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          last_used_ip: unknown
          name: string
          organization_id: string
          rate_limit_rpm: number
          revoked_at: string | null
          role_id: string | null
          scopes: string[]
        }
        Insert: {
          allowed_ips?: unknown[]
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          last_used_ip?: unknown
          name: string
          organization_id: string
          rate_limit_rpm?: number
          revoked_at?: string | null
          role_id?: string | null
          scopes?: string[]
        }
        Update: {
          allowed_ips?: unknown[]
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          last_used_ip?: unknown
          name?: string
          organization_id?: string
          rate_limit_rpm?: number
          revoked_at?: string | null
          role_id?: string | null
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
          {
            foreignKeyName: "api_keys_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approvers: string[]
          created_at: string
          entity_id: string
          entity_title: string
          entity_type: string
          id: string
          organization_id: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          requested_by: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approvers?: string[]
          created_at?: string
          entity_id: string
          entity_title?: string
          entity_type: string
          id?: string
          organization_id: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approvers?: string[]
          created_at?: string
          entity_id?: string
          entity_title?: string
          entity_type?: string
          id?: string
          organization_id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_audit_log: {
        Row: {
          asset_id: string
          change_source: string
          changed_at: string
          changed_by: string | null
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          organization_id: string
        }
        Insert: {
          asset_id: string
          change_source?: string
          changed_at?: string
          changed_by?: string | null
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id: string
        }
        Update: {
          asset_id?: string
          change_source?: string
          changed_at?: string
          changed_by?: string | null
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_audit_log_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_depreciation_entries: {
        Row: {
          accumulated_depreciation: number
          asset_id: string
          book_value: number
          created_at: string
          depreciation_amount: number
          entry_date: string
          id: string
          is_posted: boolean
          method: string
          notes: string | null
          organization_id: string
          period_number: number
        }
        Insert: {
          accumulated_depreciation: number
          asset_id: string
          book_value: number
          created_at?: string
          depreciation_amount: number
          entry_date: string
          id?: string
          is_posted?: boolean
          method: string
          notes?: string | null
          organization_id: string
          period_number: number
        }
        Update: {
          accumulated_depreciation?: number
          asset_id?: string
          book_value?: number
          created_at?: string
          depreciation_amount?: number
          entry_date?: string
          id?: string
          is_posted?: boolean
          method?: string
          notes?: string | null
          organization_id?: string
          period_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_depreciation_entries_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_depreciation_entries_organization_id_fkey"
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
      asset_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          default_depreciation_method: string | null
          default_fields: Json
          default_useful_life_months: number | null
          id: string
          name: string
          organization_id: string
          type: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          default_depreciation_method?: string | null
          default_fields?: Json
          default_useful_life_months?: number | null
          id?: string
          name: string
          organization_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          default_depreciation_method?: string | null
          default_fields?: Json
          default_useful_life_months?: number | null
          id?: string
          name?: string
          organization_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_value_history: {
        Row: {
          asset_id: string
          change_type: string
          changed_at: string
          changed_by: string | null
          id: string
          new_value: number | null
          organization_id: string
          previous_value: number | null
          reason: string | null
        }
        Insert: {
          asset_id: string
          change_type: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value?: number | null
          organization_id: string
          previous_value?: number | null
          reason?: string | null
        }
        Update: {
          asset_id?: string
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value?: number | null
          organization_id?: string
          previous_value?: number | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_value_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_value_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          disposal_method: string | null
          disposal_proceeds: number | null
          disposal_reason: string | null
          disposed_at: string | null
          id: string
          insurance_expiry_date: string | null
          insurance_policy_number: string | null
          is_return_required: boolean
          is_reusable: boolean
          is_trackable: boolean
          last_failure_at: string | null
          material: string | null
          max_deployments: number | null
          name: string
          organization_id: string
          photo_urls: string[]
          proposal_id: string | null
          purchase_order_id: string | null
          retired_at: string | null
          serial_number: string | null
          source_addon_id: string | null
          source_deliverable_id: string | null
          status: Database["public"]["Enums"]["asset_status"]
          storage_requirements: string | null
          total_usage_hours: number | null
          type: string
          updated_at: string
          useful_life_months: number | null
          vendor_name: string | null
          warranty_end_date: string | null
          warranty_provider: string | null
          warranty_start_date: string | null
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
          disposal_method?: string | null
          disposal_proceeds?: number | null
          disposal_reason?: string | null
          disposed_at?: string | null
          id?: string
          insurance_expiry_date?: string | null
          insurance_policy_number?: string | null
          is_return_required?: boolean
          is_reusable?: boolean
          is_trackable?: boolean
          last_failure_at?: string | null
          material?: string | null
          max_deployments?: number | null
          name: string
          organization_id: string
          photo_urls?: string[]
          proposal_id?: string | null
          purchase_order_id?: string | null
          retired_at?: string | null
          serial_number?: string | null
          source_addon_id?: string | null
          source_deliverable_id?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          storage_requirements?: string | null
          total_usage_hours?: number | null
          type: string
          updated_at?: string
          useful_life_months?: number | null
          vendor_name?: string | null
          warranty_end_date?: string | null
          warranty_provider?: string | null
          warranty_start_date?: string | null
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
          disposal_method?: string | null
          disposal_proceeds?: number | null
          disposal_reason?: string | null
          disposed_at?: string | null
          id?: string
          insurance_expiry_date?: string | null
          insurance_policy_number?: string | null
          is_return_required?: boolean
          is_reusable?: boolean
          is_trackable?: boolean
          last_failure_at?: string | null
          material?: string | null
          max_deployments?: number | null
          name?: string
          organization_id?: string
          photo_urls?: string[]
          proposal_id?: string | null
          purchase_order_id?: string | null
          retired_at?: string | null
          serial_number?: string | null
          source_addon_id?: string | null
          source_deliverable_id?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          storage_requirements?: string | null
          total_usage_hours?: number | null
          type?: string
          updated_at?: string
          useful_life_months?: number | null
          vendor_name?: string | null
          warranty_end_date?: string | null
          warranty_provider?: string | null
          warranty_start_date?: string | null
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
            foreignKeyName: "assets_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
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
      atproto_oauth_sessions: {
        Row: {
          created_at: string
          expires_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          expires_at: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          expires_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      atproto_oauth_state: {
        Row: {
          created_at: string
          expires_at: string
          key: string
          value: Json
        }
        Insert: {
          created_at?: string
          expires_at: string
          key: string
          value: Json
        }
        Update: {
          created_at?: string
          expires_at?: string
          key?: string
          value?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_type: string
          changes: Json
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          impersonated_by: string | null
          ip_address: unknown
          metadata: Json | null
          organization_id: string
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_type?: string
          changes?: Json
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          impersonated_by?: string | null
          ip_address?: unknown
          metadata?: Json | null
          organization_id: string
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_type?: string
          changes?: Json
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          impersonated_by?: string | null
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_impersonated_by_fkey"
            columns: ["impersonated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          organization_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_settings: {
        Row: {
          allowed_auth_methods: string[]
          allowed_email_domains_for_signup: string[]
          created_at: string
          id: string
          max_concurrent_sessions: number
          mfa_grace_period_days: number
          organization_id: string
          password_min_length: number
          password_require_number: boolean
          password_require_symbol: boolean
          password_require_uppercase: boolean
          require_mfa: boolean
          session_idle_timeout_minutes: number
          session_max_age_hours: number
          sso_auto_provision: boolean
          sso_enforce_only: boolean
          sso_provider_id: string | null
          updated_at: string
        }
        Insert: {
          allowed_auth_methods?: string[]
          allowed_email_domains_for_signup?: string[]
          created_at?: string
          id?: string
          max_concurrent_sessions?: number
          mfa_grace_period_days?: number
          organization_id: string
          password_min_length?: number
          password_require_number?: boolean
          password_require_symbol?: boolean
          password_require_uppercase?: boolean
          require_mfa?: boolean
          session_idle_timeout_minutes?: number
          session_max_age_hours?: number
          sso_auto_provision?: boolean
          sso_enforce_only?: boolean
          sso_provider_id?: string | null
          updated_at?: string
        }
        Update: {
          allowed_auth_methods?: string[]
          allowed_email_domains_for_signup?: string[]
          created_at?: string
          id?: string
          max_concurrent_sessions?: number
          mfa_grace_period_days?: number
          organization_id?: string
          password_min_length?: number
          password_require_number?: boolean
          password_require_symbol?: boolean
          password_require_uppercase?: boolean
          require_mfa?: boolean
          session_idle_timeout_minutes?: number
          session_max_age_hours?: number
          sso_auto_provision?: boolean
          sso_enforce_only?: boolean
          sso_provider_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
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
      bluesky_accounts: {
        Row: {
          access_token_encrypted: string | null
          created_at: string
          did: string
          dpop_key: Json | null
          handle: string | null
          id: string
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string
          did: string
          dpop_key?: Json | null
          handle?: string | null
          id?: string
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string
          did?: string
          dpop_key?: Json | null
          handle?: string | null
          id?: string
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      campaign_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          client_id: string
          email: string
          id: string
          opened_at: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          client_id: string
          email: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          client_id?: string
          email?: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          body_html: string | null
          body_text: string | null
          bounce_count: number | null
          click_count: number | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          open_count: number | null
          organization_id: string
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string
          subject: string
          target_all_clients: boolean | null
          target_tags: string[] | null
          total_recipients: number | null
          updated_at: string
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          bounce_count?: number | null
          click_count?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          open_count?: number | null
          organization_id: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject: string
          target_all_clients?: boolean | null
          target_tags?: string[] | null
          total_recipients?: number | null
          updated_at?: string
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          bounce_count?: number | null
          click_count?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          open_count?: number | null
          organization_id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject?: string
          target_all_clients?: boolean | null
          target_tags?: string[] | null
          total_recipients?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      compliance_documents: {
        Row: {
          created_at: string
          created_by: string | null
          crew_profile_id: string
          description: string | null
          document_name: string
          document_type: string
          expiry_date: string | null
          file_name: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          issued_date: string | null
          organization_id: string
          rejection_reason: string | null
          status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crew_profile_id: string
          description?: string | null
          document_name: string
          document_type: string
          expiry_date?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          issued_date?: string | null
          organization_id: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crew_profile_id?: string
          description?: string | null
          document_name?: string
          document_type?: string
          expiry_date?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          issued_date?: string | null
          organization_id?: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_crew_profile_id_fkey"
            columns: ["crew_profile_id"]
            isOneToOne: false
            referencedRelation: "crew_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_rates: {
        Row: {
          created_at: string
          effective_from: string
          hourly_billable: number
          hourly_cost: number
          id: string
          organization_id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from?: string
          hourly_billable: number
          hourly_cost: number
          id?: string
          organization_id: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          hourly_billable?: number
          hourly_cost?: number
          id?: string
          organization_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_rates_organization_id_fkey"
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
          avg_rating: number | null
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
          total_ratings: number | null
          travel_rate: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability_default?: string
          avg_rating?: number | null
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
          total_ratings?: number | null
          travel_rate?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability_default?: string
          avg_rating?: number | null
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
          total_ratings?: number | null
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
      crew_ratings: {
        Row: {
          categories: Json | null
          comment: string | null
          created_at: string
          crew_profile_id: string
          id: string
          organization_id: string
          proposal_id: string | null
          rated_by: string
          rating: number
          work_order_id: string | null
        }
        Insert: {
          categories?: Json | null
          comment?: string | null
          created_at?: string
          crew_profile_id: string
          id?: string
          organization_id: string
          proposal_id?: string | null
          rated_by: string
          rating: number
          work_order_id?: string | null
        }
        Update: {
          categories?: Json | null
          comment?: string | null
          created_at?: string
          crew_profile_id?: string
          id?: string
          organization_id?: string
          proposal_id?: string | null
          rated_by?: string
          rating?: number
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_ratings_crew_profile_id_fkey"
            columns: ["crew_profile_id"]
            isOneToOne: false
            referencedRelation: "crew_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_ratings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_ratings_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_ratings_rated_by_fkey"
            columns: ["rated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_ratings_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
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
          is_favorite: boolean
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
          is_favorite?: boolean
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
          is_favorite?: boolean
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
          signer_contact_id: string | null
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
          signer_contact_id?: string | null
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
          signer_contact_id?: string | null
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
          {
            foreignKeyName: "esignature_requests_signer_contact_id_fkey"
            columns: ["signer_contact_id"]
            isOneToOne: false
            referencedRelation: "client_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      event_locations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_primary: boolean
          location_id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_primary?: boolean
          location_id: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_primary?: boolean
          location_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_locations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          daily_hours: string | null
          doors_time: string | null
          ends_at: string | null
          event_code: string | null
          general_email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          presenter: string | null
          slug: string
          starts_at: string | null
          status: string
          subtitle: string | null
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_hours?: string | null
          doors_time?: string | null
          ends_at?: string | null
          event_code?: string | null
          general_email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          presenter?: string | null
          slug: string
          starts_at?: string | null
          status?: string
          subtitle?: string | null
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_hours?: string | null
          doors_time?: string | null
          ends_at?: string | null
          event_code?: string | null
          general_email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          presenter?: string | null
          slug?: string
          starts_at?: string | null
          status?: string
          subtitle?: string | null
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          billed_invoice_id: string | null
          category: string
          created_at: string
          currency: string
          description: string | null
          expense_date: string
          id: string
          is_billable: boolean
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
          billed_invoice_id?: string | null
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string
          id?: string
          is_billable?: boolean
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
          billed_invoice_id?: string | null
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string
          id?: string
          is_billable?: boolean
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
            foreignKeyName: "expenses_billed_invoice_id_fkey"
            columns: ["billed_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
      feature_flag_overrides: {
        Row: {
          created_at: string
          enabled: boolean
          expires_at: string | null
          feature_flag_id: string
          id: string
          organization_id: string | null
          reason: string | null
          set_by: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          enabled: boolean
          expires_at?: string | null
          feature_flag_id: string
          id?: string
          organization_id?: string | null
          reason?: string | null
          set_by: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          expires_at?: string | null
          feature_flag_id?: string
          id?: string
          organization_id?: string | null
          reason?: string | null
          set_by?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flag_overrides_feature_flag_id_fkey"
            columns: ["feature_flag_id"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_flag_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_flag_overrides_set_by_fkey"
            columns: ["set_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_flag_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          default_value: boolean
          description: string | null
          display_name: string
          flag_type: string
          id: string
          is_platform_controlled: boolean
          key: string
          metadata: Json
          min_plan_tier: number | null
          rollout_percentage: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_value?: boolean
          description?: string | null
          display_name: string
          flag_type: string
          id?: string
          is_platform_controlled?: boolean
          key: string
          metadata?: Json
          min_plan_tier?: number | null
          rollout_percentage?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_value?: boolean
          description?: string | null
          display_name?: string
          flag_type?: string
          id?: string
          is_platform_controlled?: boolean
          key?: string
          metadata?: Json
          min_plan_tier?: number | null
          rollout_percentage?: number | null
          updated_at?: string
        }
        Relationships: []
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
      integration_connections: {
        Row: {
          created_at: string
          credentials_encrypted: Json | null
          error_message: string | null
          external_account_id: string | null
          id: string
          integration_id: string
          last_synced_at: string | null
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credentials_encrypted?: Json | null
          error_message?: string | null
          external_account_id?: string | null
          id?: string
          integration_id: string
          last_synced_at?: string | null
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credentials_encrypted?: Json | null
          error_message?: string | null
          external_account_id?: string | null
          id?: string
          integration_id?: string
          last_synced_at?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_connections_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_connections_organization_id_fkey"
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
      inventory_count_lines: {
        Row: {
          asset_id: string
          condition_observed: string | null
          count_id: string
          counted_quantity: number | null
          expected_quantity: number
          id: string
          notes: string | null
          variance: number | null
        }
        Insert: {
          asset_id: string
          condition_observed?: string | null
          count_id: string
          counted_quantity?: number | null
          expected_quantity?: number
          id?: string
          notes?: string | null
          variance?: number | null
        }
        Update: {
          asset_id?: string
          condition_observed?: string | null
          count_id?: string
          counted_quantity?: number | null
          expected_quantity?: number
          id?: string
          notes?: string | null
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_count_lines_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_lines_count_id_fkey"
            columns: ["count_id"]
            isOneToOne: false
            referencedRelation: "inventory_counts"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_counts: {
        Row: {
          completed_at: string | null
          count_type: string
          counted_by: string | null
          created_at: string
          id: string
          location: string | null
          notes: string | null
          organization_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          count_type: string
          counted_by?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          organization_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          count_type?: string
          counted_by?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          organization_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_counts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          declined_at: string | null
          expires_at: string
          id: string
          invited_by: string
          invited_email: string
          organization_id: string
          personal_message: string | null
          revoked_at: string | null
          revoked_by: string | null
          role_id: string
          scope_id: string
          scope_type: string
          seat_type: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          declined_at?: string | null
          expires_at: string
          id?: string
          invited_by: string
          invited_email: string
          organization_id: string
          personal_message?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_id: string
          scope_id: string
          scope_type: string
          seat_type?: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          declined_at?: string | null
          expires_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          organization_id?: string
          personal_message?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_id?: string
          scope_id?: string
          scope_type?: string
          seat_type?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_code_redemptions: {
        Row: {
          id: string
          invite_code_id: string
          membership_scope: string
          redeemed_at: string
          resulted_in_membership_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          invite_code_id: string
          membership_scope: string
          redeemed_at?: string
          resulted_in_membership_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          invite_code_id?: string
          membership_scope?: string
          redeemed_at?: string
          resulted_in_membership_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_code_redemptions_invite_code_id_fkey"
            columns: ["invite_code_id"]
            isOneToOne: false
            referencedRelation: "invite_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_code_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          current_uses: number
          expires_at: string | null
          id: string
          is_active: boolean
          label: string | null
          max_uses: number | null
          organization_id: string
          requires_approval: boolean
          restrict_to_domain: string | null
          restrict_to_emails: string[]
          role_id: string
          scope_id: string
          scope_type: string
          seat_type: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number | null
          organization_id: string
          requires_approval?: boolean
          restrict_to_domain?: string | null
          restrict_to_emails?: string[]
          role_id: string
          scope_id: string
          scope_type: string
          seat_type?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number | null
          organization_id?: string
          requires_approval?: boolean
          restrict_to_domain?: string | null
          restrict_to_emails?: string[]
          role_id?: string
          scope_id?: string
          scope_type?: string
          seat_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_codes_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
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
          tax_amount: number
          tax_rate: number
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
          tax_amount?: number
          tax_rate?: number
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
          tax_amount?: number
          tax_rate?: number
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
      job_site_photos: {
        Row: {
          caption: string | null
          created_at: string
          file_name: string | null
          file_size_bytes: number | null
          file_url: string
          id: string
          latitude: number | null
          longitude: number | null
          mime_type: string | null
          organization_id: string
          photo_type: string
          proposal_id: string | null
          taken_at: string
          task_id: string | null
          thumbnail_url: string | null
          uploaded_by: string | null
          work_order_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_name?: string | null
          file_size_bytes?: number | null
          file_url: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          mime_type?: string | null
          organization_id: string
          photo_type?: string
          proposal_id?: string | null
          taken_at?: string
          task_id?: string | null
          thumbnail_url?: string | null
          uploaded_by?: string | null
          work_order_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_name?: string | null
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          mime_type?: string | null
          organization_id?: string
          photo_type?: string
          proposal_id?: string | null
          taken_at?: string
          task_id?: string | null
          thumbnail_url?: string | null
          uploaded_by?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_site_photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_site_photos_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_site_photos_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_site_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_site_photos_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      join_requests: {
        Row: {
          auto_source: string | null
          deny_reason: string | null
          id: string
          organization_id: string
          request_message: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          scope_id: string
          scope_type: string
          status: string
          user_id: string
        }
        Insert: {
          auto_source?: string | null
          deny_reason?: string | null
          id?: string
          organization_id: string
          request_message?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope_id: string
          scope_type: string
          status?: string
          user_id: string
        }
        Update: {
          auto_source?: string | null
          deny_reason?: string | null
          id?: string
          organization_id?: string
          request_message?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope_id?: string
          scope_type?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          contact_first_name: string
          contact_last_name: string
          contact_phone: string | null
          converted_to_client_id: string | null
          converted_to_contact_id: string | null
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
          contact_first_name: string
          contact_last_name: string
          contact_phone?: string | null
          converted_to_client_id?: string | null
          converted_to_contact_id?: string | null
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
          contact_first_name?: string
          contact_last_name?: string
          contact_phone?: string | null
          converted_to_client_id?: string | null
          converted_to_contact_id?: string | null
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
            foreignKeyName: "leads_converted_to_client_id_fkey"
            columns: ["converted_to_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_to_contact_id_fkey"
            columns: ["converted_to_contact_id"]
            isOneToOne: false
            referencedRelation: "client_contacts"
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
      locations: {
        Row: {
          address: Json
          capacity: number | null
          created_at: string
          formatted_address: string | null
          google_place_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          site_map_url: string | null
          slug: string
          status: string
          timezone: string | null
          type: Database["public"]["Enums"]["location_type"]
          updated_at: string
        }
        Insert: {
          address?: Json
          capacity?: number | null
          created_at?: string
          formatted_address?: string | null
          google_place_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          site_map_url?: string | null
          slug: string
          status?: string
          timezone?: string | null
          type?: Database["public"]["Enums"]["location_type"]
          updated_at?: string
        }
        Update: {
          address?: Json
          capacity?: number | null
          created_at?: string
          formatted_address?: string | null
          google_place_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          site_map_url?: string | null
          slug?: string
          status?: string
          timezone?: string | null
          type?: Database["public"]["Enums"]["location_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
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
      maintenance_schedules: {
        Row: {
          asset_id: string
          assigned_to: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          estimated_duration_hours: number | null
          id: string
          interval_days: number | null
          interval_usage: number | null
          is_active: boolean
          last_triggered_at: string | null
          maintenance_type: string
          next_due_at: string | null
          organization_id: string
          schedule_type: string
          updated_at: string
        }
        Insert: {
          asset_id: string
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          estimated_duration_hours?: number | null
          id?: string
          interval_days?: number | null
          interval_usage?: number | null
          is_active?: boolean
          last_triggered_at?: string | null
          maintenance_type: string
          next_due_at?: string | null
          organization_id: string
          schedule_type: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          estimated_duration_hours?: number | null
          id?: string
          interval_days?: number | null
          interval_usage?: number | null
          is_active?: boolean
          last_triggered_at?: string | null
          maintenance_type?: string
          next_due_at?: string | null
          organization_id?: string
          schedule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          organization_id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      organization_memberships: {
        Row: {
          approved_by: string | null
          created_at: string
          id: string
          invited_by: string | null
          joined_via: string
          last_active_in_org_at: string | null
          organization_id: string
          role_id: string
          seat_type: string
          status: string
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_via: string
          last_active_in_org_at?: string | null
          organization_id: string
          role_id: string
          seat_type?: string
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_via?: string
          last_active_in_org_at?: string | null
          organization_id?: string
          role_id?: string
          seat_type?: string
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          allowed_email_domains: string[]
          billing_email: string | null
          brand_config: Json
          created_at: string
          currency: string
          date_format: string
          default_member_role_id: string | null
          default_payment_terms: Json
          default_phase_template_id: string | null
          default_tax_rate: number
          facilities: Json
          favicon_url: string | null
          first_day_of_week: number
          id: string
          industry: string | null
          invite_code_enabled: boolean
          invite_expiry_hours: number
          invoice_prefix: string
          language: string
          logo_url: string | null
          max_members: number | null
          metadata: Json
          name: string
          number_format: string
          owner_id: string | null
          payment_instructions: string | null
          proposal_prefix: string
          require_admin_approval: boolean
          require_domain_match: boolean
          require_sso: boolean
          review_request_config: Json | null
          size_tier: string | null
          slug: string
          status: string
          stripe_connect_account_id: string | null
          stripe_connect_onboarding_complete: boolean
          stripe_customer_id: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          suspended_at: string | null
          suspension_reason: string | null
          tax_label: string
          time_format: string
          timezone: string
          updated_at: string
          website: string | null
        }
        Insert: {
          allowed_email_domains?: string[]
          billing_email?: string | null
          brand_config?: Json
          created_at?: string
          currency?: string
          date_format?: string
          default_member_role_id?: string | null
          default_payment_terms?: Json
          default_phase_template_id?: string | null
          default_tax_rate?: number
          facilities?: Json
          favicon_url?: string | null
          first_day_of_week?: number
          id?: string
          industry?: string | null
          invite_code_enabled?: boolean
          invite_expiry_hours?: number
          invoice_prefix?: string
          language?: string
          logo_url?: string | null
          max_members?: number | null
          metadata?: Json
          name: string
          number_format?: string
          owner_id?: string | null
          payment_instructions?: string | null
          proposal_prefix?: string
          require_admin_approval?: boolean
          require_domain_match?: boolean
          require_sso?: boolean
          review_request_config?: Json | null
          size_tier?: string | null
          slug: string
          status?: string
          stripe_connect_account_id?: string | null
          stripe_connect_onboarding_complete?: boolean
          stripe_customer_id?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          suspended_at?: string | null
          suspension_reason?: string | null
          tax_label?: string
          time_format?: string
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          allowed_email_domains?: string[]
          billing_email?: string | null
          brand_config?: Json
          created_at?: string
          currency?: string
          date_format?: string
          default_member_role_id?: string | null
          default_payment_terms?: Json
          default_phase_template_id?: string | null
          default_tax_rate?: number
          facilities?: Json
          favicon_url?: string | null
          first_day_of_week?: number
          id?: string
          industry?: string | null
          invite_code_enabled?: boolean
          invite_expiry_hours?: number
          invoice_prefix?: string
          language?: string
          logo_url?: string | null
          max_members?: number | null
          metadata?: Json
          name?: string
          number_format?: string
          owner_id?: string | null
          payment_instructions?: string | null
          proposal_prefix?: string
          require_admin_approval?: boolean
          require_domain_match?: boolean
          require_sso?: boolean
          review_request_config?: Json | null
          size_tier?: string | null
          slug?: string
          status?: string
          stripe_connect_account_id?: string | null
          stripe_connect_onboarding_complete?: boolean
          stripe_customer_id?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          suspended_at?: string | null
          suspension_reason?: string | null
          tax_label?: string
          time_format?: string
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_org_default_template"
            columns: ["default_phase_template_id"]
            isOneToOne: false
            referencedRelation: "phase_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_default_member_role_id_fkey"
            columns: ["default_member_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      permission_catalog: {
        Row: {
          action: string
          description: string | null
          id: string
          is_sensitive: boolean
          resource: string
          scope: string
        }
        Insert: {
          action: string
          description?: string | null
          id?: string
          is_sensitive?: boolean
          resource: string
          scope: string
        }
        Update: {
          action?: string
          description?: string | null
          id?: string
          is_sensitive?: boolean
          resource?: string
          scope?: string
        }
        Relationships: []
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
      production_advances: {
        Row: {
          advance_mode: Database["public"]["Enums"]["advance_mode"]
          advance_number: string
          advance_type: Database["public"]["Enums"]["advance_type"]
          allow_ad_hoc_items: boolean | null
          allowed_advance_types:
            | Database["public"]["Enums"]["advance_type"][]
            | null
          allowed_category_groups: string[] | null
          changes_requested_note: string | null
          company_name: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          currency_code: string | null
          discount_total_cents: number | null
          event_name: string | null
          expires_at: string | null
          fulfillment_location_id: string | null
          fulfillment_type:
            | Database["public"]["Enums"]["fulfillment_type"]
            | null
          id: string
          idempotency_key: string | null
          internal_notes: string | null
          is_catalog_shared: boolean | null
          line_item_count: number | null
          load_in_date: string | null
          max_submissions: number | null
          metadata: Json | null
          notes: string | null
          organization_id: string
          priority: Database["public"]["Enums"]["advance_priority"] | null
          project_id: string | null
          purpose: string | null
          rejection_reason: string | null
          require_approval_per_contributor: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_end_date: string | null
          service_start_date: string | null
          source: string | null
          source_reference: string | null
          special_considerations: string | null
          status: Database["public"]["Enums"]["advance_status"]
          strike_date: string | null
          submission_count: number | null
          submission_deadline: string | null
          submission_instructions: string | null
          submitted_by: string | null
          subtotal_cents: number | null
          tax_total_cents: number | null
          total_cents: number | null
          updated_at: string | null
          venue_address: Json | null
          venue_name: string | null
          version: number | null
        }
        Insert: {
          advance_mode?: Database["public"]["Enums"]["advance_mode"]
          advance_number: string
          advance_type?: Database["public"]["Enums"]["advance_type"]
          allow_ad_hoc_items?: boolean | null
          allowed_advance_types?:
            | Database["public"]["Enums"]["advance_type"][]
            | null
          allowed_category_groups?: string[] | null
          changes_requested_note?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          currency_code?: string | null
          discount_total_cents?: number | null
          event_name?: string | null
          expires_at?: string | null
          fulfillment_location_id?: string | null
          fulfillment_type?:
            | Database["public"]["Enums"]["fulfillment_type"]
            | null
          id?: string
          idempotency_key?: string | null
          internal_notes?: string | null
          is_catalog_shared?: boolean | null
          line_item_count?: number | null
          load_in_date?: string | null
          max_submissions?: number | null
          metadata?: Json | null
          notes?: string | null
          organization_id: string
          priority?: Database["public"]["Enums"]["advance_priority"] | null
          project_id?: string | null
          purpose?: string | null
          rejection_reason?: string | null
          require_approval_per_contributor?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_end_date?: string | null
          service_start_date?: string | null
          source?: string | null
          source_reference?: string | null
          special_considerations?: string | null
          status?: Database["public"]["Enums"]["advance_status"]
          strike_date?: string | null
          submission_count?: number | null
          submission_deadline?: string | null
          submission_instructions?: string | null
          submitted_by?: string | null
          subtotal_cents?: number | null
          tax_total_cents?: number | null
          total_cents?: number | null
          updated_at?: string | null
          venue_address?: Json | null
          venue_name?: string | null
          version?: number | null
        }
        Update: {
          advance_mode?: Database["public"]["Enums"]["advance_mode"]
          advance_number?: string
          advance_type?: Database["public"]["Enums"]["advance_type"]
          allow_ad_hoc_items?: boolean | null
          allowed_advance_types?:
            | Database["public"]["Enums"]["advance_type"][]
            | null
          allowed_category_groups?: string[] | null
          changes_requested_note?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          currency_code?: string | null
          discount_total_cents?: number | null
          event_name?: string | null
          expires_at?: string | null
          fulfillment_location_id?: string | null
          fulfillment_type?:
            | Database["public"]["Enums"]["fulfillment_type"]
            | null
          id?: string
          idempotency_key?: string | null
          internal_notes?: string | null
          is_catalog_shared?: boolean | null
          line_item_count?: number | null
          load_in_date?: string | null
          max_submissions?: number | null
          metadata?: Json | null
          notes?: string | null
          organization_id?: string
          priority?: Database["public"]["Enums"]["advance_priority"] | null
          project_id?: string | null
          purpose?: string | null
          rejection_reason?: string | null
          require_approval_per_contributor?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_end_date?: string | null
          service_start_date?: string | null
          source?: string | null
          source_reference?: string | null
          special_considerations?: string | null
          status?: Database["public"]["Enums"]["advance_status"]
          strike_date?: string | null
          submission_count?: number | null
          submission_deadline?: string | null
          submission_instructions?: string | null
          submitted_by?: string | null
          subtotal_cents?: number | null
          tax_total_cents?: number | null
          total_cents?: number | null
          updated_at?: string | null
          venue_address?: Json | null
          venue_name?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_advances_fulfillment_location_id_fkey"
            columns: ["fulfillment_location_id"]
            isOneToOne: false
            referencedRelation: "advance_inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_advances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_advances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_advances_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_advances_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
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
      project_events: {
        Row: {
          created_at: string
          event_id: string
          id: string
          project_id: string
          role: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          project_id: string
          role?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          project_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_locations: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          location_id: string
          notes: string | null
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          location_id: string
          notes?: string | null
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          location_id?: string
          notes?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_memberships: {
        Row: {
          access_expires_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          invited_by: string | null
          joined_via: string
          organization_id: string
          project_id: string
          role_id: string
          seat_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_via: string
          organization_id: string
          project_id: string
          role_id: string
          seat_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_expires_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_via?: string
          organization_id?: string
          project_id?: string
          role_id?: string
          seat_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_memberships_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_memberships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_memberships_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_portals: {
        Row: {
          amenities: Json | null
          call_time: string | null
          check_in_instructions: string | null
          created_at: string
          faqs: Json | null
          id: string
          is_published: boolean
          organization_id: string
          parking_instructions: string | null
          portal_type: Database["public"]["Enums"]["portal_type"]
          pre_arrival_checklist: Json | null
          project_id: string
          rideshare_instructions: string | null
          transit_instructions: string | null
          updated_at: string
        }
        Insert: {
          amenities?: Json | null
          call_time?: string | null
          check_in_instructions?: string | null
          created_at?: string
          faqs?: Json | null
          id?: string
          is_published?: boolean
          organization_id: string
          parking_instructions?: string | null
          portal_type: Database["public"]["Enums"]["portal_type"]
          pre_arrival_checklist?: Json | null
          project_id: string
          rideshare_instructions?: string | null
          transit_instructions?: string | null
          updated_at?: string
        }
        Update: {
          amenities?: Json | null
          call_time?: string | null
          check_in_instructions?: string | null
          created_at?: string
          faqs?: Json | null
          id?: string
          is_published?: boolean
          organization_id?: string
          parking_instructions?: string | null
          portal_type?: Database["public"]["Enums"]["portal_type"]
          pre_arrival_checklist?: Json | null
          project_id?: string
          rideshare_instructions?: string | null
          transit_instructions?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_portals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_portals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          allow_external_members: boolean
          capacity: number | null
          created_at: string
          created_by: string | null
          daily_hours: string | null
          default_member_role_id: string | null
          description: string | null
          doors_time: string | null
          ends_at: string | null
          general_email: string | null
          id: string
          invite_code_enabled: boolean
          max_members: number | null
          name: string
          organization_id: string
          presenter: string | null
          project_code: string | null
          require_admin_approval: boolean
          site_map_url: string | null
          slug: string
          starts_at: string | null
          status: string
          subtitle: string | null
          updated_at: string
          venue_address: Json | null
          venue_name: string | null
          venue_phone: string | null
          visibility: string
        }
        Insert: {
          allow_external_members?: boolean
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          daily_hours?: string | null
          default_member_role_id?: string | null
          description?: string | null
          doors_time?: string | null
          ends_at?: string | null
          general_email?: string | null
          id?: string
          invite_code_enabled?: boolean
          max_members?: number | null
          name: string
          organization_id: string
          presenter?: string | null
          project_code?: string | null
          require_admin_approval?: boolean
          site_map_url?: string | null
          slug: string
          starts_at?: string | null
          status?: string
          subtitle?: string | null
          updated_at?: string
          venue_address?: Json | null
          venue_name?: string | null
          venue_phone?: string | null
          visibility?: string
        }
        Update: {
          allow_external_members?: boolean
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          daily_hours?: string | null
          default_member_role_id?: string | null
          description?: string | null
          doors_time?: string | null
          ends_at?: string | null
          general_email?: string | null
          id?: string
          invite_code_enabled?: boolean
          max_members?: number | null
          name?: string
          organization_id?: string
          presenter?: string | null
          project_code?: string | null
          require_admin_approval?: boolean
          site_map_url?: string | null
          slug?: string
          starts_at?: string | null
          status?: string
          subtitle?: string | null
          updated_at?: string
          venue_address?: Json | null
          venue_name?: string | null
          venue_phone?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_default_member_role_id_fkey"
            columns: ["default_member_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          deposit_amount: number | null
          deposit_invoice_id: string | null
          deposit_paid: boolean | null
          deposit_paid_at: string | null
          deposit_percent: number | null
          deposit_required: boolean | null
          follow_up_count: number | null
          id: string
          name: string
          narrative_context: Json | null
          organization_id: string
          parent_proposal_id: string | null
          payment_terms: Json | null
          phase_template_id: string | null
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
          deposit_amount?: number | null
          deposit_invoice_id?: string | null
          deposit_paid?: boolean | null
          deposit_paid_at?: string | null
          deposit_percent?: number | null
          deposit_required?: boolean | null
          follow_up_count?: number | null
          id?: string
          name: string
          narrative_context?: Json | null
          organization_id: string
          parent_proposal_id?: string | null
          payment_terms?: Json | null
          phase_template_id?: string | null
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
          deposit_amount?: number | null
          deposit_invoice_id?: string | null
          deposit_paid?: boolean | null
          deposit_paid_at?: string | null
          deposit_percent?: number | null
          deposit_required?: boolean | null
          follow_up_count?: number | null
          id?: string
          name?: string
          narrative_context?: Json | null
          organization_id?: string
          parent_proposal_id?: string | null
          payment_terms?: Json | null
          phase_template_id?: string | null
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
            foreignKeyName: "proposals_deposit_invoice_id_fkey"
            columns: ["deposit_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
          vendor_id: string | null
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
          vendor_id?: string | null
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
          vendor_id?: string | null
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
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
      referral_programs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          min_invoice_value: number | null
          name: string
          organization_id: string
          require_paid_invoice: boolean
          reward_amount: number
          reward_currency: string
          reward_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          min_invoice_value?: number | null
          name?: string
          organization_id: string
          require_paid_invoice?: boolean
          reward_amount?: number
          reward_currency?: string
          reward_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          min_invoice_value?: number | null
          name?: string
          organization_id?: string
          require_paid_invoice?: boolean
          reward_amount?: number
          reward_currency?: string
          reward_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          clicked_at: string | null
          converted_at: string | null
          created_at: string
          id: string
          organization_id: string
          program_id: string
          referral_code: string
          referred_client_id: string | null
          referred_email: string | null
          referred_name: string | null
          referrer_client_id: string
          reward_amount: number | null
          reward_credited_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          organization_id: string
          program_id: string
          referral_code: string
          referred_client_id?: string | null
          referred_email?: string | null
          referred_name?: string | null
          referrer_client_id: string
          reward_amount?: number | null
          reward_credited_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          program_id?: string
          referral_code?: string
          referred_client_id?: string | null
          referred_email?: string | null
          referred_name?: string | null
          referrer_client_id?: string
          reward_amount?: number | null
          reward_credited_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "referral_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_client_id_fkey"
            columns: ["referred_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_client_id_fkey"
            columns: ["referrer_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      role_permissions: {
        Row: {
          conditions: Json
          granted_at: string
          granted_by: string | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          conditions?: Json
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          conditions?: Json
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permission_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          hierarchy_level: number
          id: string
          is_default: boolean
          is_system: boolean
          name: string
          organization_id: string | null
          scope: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          hierarchy_level: number
          id?: string
          is_default?: boolean
          is_system?: boolean
          name: string
          organization_id?: string | null
          scope: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          hierarchy_level?: number
          id?: string
          is_default?: boolean
          is_system?: boolean
          name?: string
          organization_id?: string | null
          scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      saved_views: {
        Row: {
          collaboration_type: Database["public"]["Enums"]["view_collaboration_type"]
          config: Json
          created_at: string
          creator_id: string
          description: string | null
          display_type: Database["public"]["Enums"]["view_display_type"]
          entity_type: Database["public"]["Enums"]["view_entity_type"]
          icon: string | null
          id: string
          is_default: boolean
          is_favorite: boolean
          name: string
          organization_id: string
          section_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          collaboration_type?: Database["public"]["Enums"]["view_collaboration_type"]
          config?: Json
          created_at?: string
          creator_id: string
          description?: string | null
          display_type?: Database["public"]["Enums"]["view_display_type"]
          entity_type: Database["public"]["Enums"]["view_entity_type"]
          icon?: string | null
          id?: string
          is_default?: boolean
          is_favorite?: boolean
          name: string
          organization_id: string
          section_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          collaboration_type?: Database["public"]["Enums"]["view_collaboration_type"]
          config?: Json
          created_at?: string
          creator_id?: string
          description?: string | null
          display_type?: Database["public"]["Enums"]["view_display_type"]
          entity_type?: Database["public"]["Enums"]["view_entity_type"]
          icon?: string | null
          id?: string
          is_default?: boolean
          is_favorite?: boolean
          name?: string
          organization_id?: string
          section_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_views_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_views_section_fk"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "view_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      seat_allocations: {
        Row: {
          external_seats_included: number
          external_seats_purchased: number
          external_seats_used: number
          id: string
          internal_seats_included: number
          internal_seats_purchased: number
          internal_seats_used: number
          last_reconciled_at: string
          organization_id: string
          overage_allowed: boolean
          overage_rate_external_cents: number | null
          overage_rate_internal_cents: number | null
          plan_id: string
          updated_at: string
        }
        Insert: {
          external_seats_included: number
          external_seats_purchased?: number
          external_seats_used?: number
          id?: string
          internal_seats_included: number
          internal_seats_purchased?: number
          internal_seats_used?: number
          last_reconciled_at?: string
          organization_id: string
          overage_allowed?: boolean
          overage_rate_external_cents?: number | null
          overage_rate_internal_cents?: number | null
          plan_id: string
          updated_at?: string
        }
        Update: {
          external_seats_included?: number
          external_seats_purchased?: number
          external_seats_used?: number
          id?: string
          internal_seats_included?: number
          internal_seats_purchased?: number
          internal_seats_used?: number
          last_reconciled_at?: string
          organization_id?: string
          overage_allowed?: boolean
          overage_rate_external_cents?: number | null
          overage_rate_internal_cents?: number | null
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_allocations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          auth_method: string
          created_at: string
          device_fingerprint: string | null
          expires_at: string
          geo_city: string | null
          geo_country: string | null
          id: string
          ip_address: unknown
          is_active: boolean
          last_active_at: string
          mfa_verified: boolean
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          session_token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_method: string
          created_at?: string
          device_fingerprint?: string | null
          expires_at: string
          geo_city?: string | null
          geo_country?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_active_at?: string
          mfa_verified?: boolean
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          session_token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_method?: string
          created_at?: string
          device_fingerprint?: string | null
          expires_at?: string
          geo_city?: string | null
          geo_country?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_active_at?: string
          mfa_verified?: boolean
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          session_token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      subscription_plans: {
        Row: {
          audit_log_retention_days: number
          created_at: string
          external_seats_included: number
          features: Json
          id: string
          internal_seats_included: number
          is_active: boolean
          max_api_keys: number
          max_custom_roles: number
          max_invite_codes_per_month: number | null
          max_organizations: number
          max_projects_per_org: number | null
          max_teams_per_org: number | null
          name: string
          price_monthly_cents: number
          price_yearly_cents: number
          tier: number
        }
        Insert: {
          audit_log_retention_days?: number
          created_at?: string
          external_seats_included: number
          features?: Json
          id?: string
          internal_seats_included: number
          is_active?: boolean
          max_api_keys?: number
          max_custom_roles?: number
          max_invite_codes_per_month?: number | null
          max_organizations?: number
          max_projects_per_org?: number | null
          max_teams_per_org?: number | null
          name: string
          price_monthly_cents: number
          price_yearly_cents: number
          tier: number
        }
        Update: {
          audit_log_retention_days?: number
          created_at?: string
          external_seats_included?: number
          features?: Json
          id?: string
          internal_seats_included?: number
          is_active?: boolean
          max_api_keys?: number
          max_custom_roles?: number
          max_invite_codes_per_month?: number | null
          max_organizations?: number
          max_projects_per_org?: number | null
          max_teams_per_org?: number | null
          name?: string
          price_monthly_cents?: number
          price_yearly_cents?: number
          tier?: number
        }
        Relationships: []
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
      team_memberships: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_via: string
          organization_id: string
          role_id: string
          status: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_via: string
          organization_id: string
          role_id: string
          status?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_via?: string
          organization_id?: string
          role_id?: string
          status?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          invite_code_enabled: boolean
          is_default: boolean
          max_members: number | null
          name: string
          organization_id: string
          require_approval: boolean
          slug: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code_enabled?: boolean
          is_default?: boolean
          max_members?: number | null
          name: string
          organization_id: string
          require_approval?: boolean
          slug: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code_enabled?: boolean
          is_default?: boolean
          max_members?: number | null
          name?: string
          organization_id?: string
          require_approval?: boolean
          slug?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          density: string
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
          density?: string
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
          density?: string
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
          deactivated_at: string | null
          deletion_requested_at: string | null
          deletion_scheduled_for: string | null
          department: string | null
          email: string
          employment_type: string | null
          facility_id: string | null
          first_name: string
          full_name: string
          hourly_cost: number | null
          id: string
          last_active_at: string | null
          last_login_at: string | null
          last_name: string
          locale: string
          login_count: number
          metadata: Json
          mfa_enabled: boolean
          onboarding_completed_at: string | null
          phone: string | null
          rate_card: string | null
          start_date: string | null
          status: string
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          timezone: string
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          department?: string | null
          email: string
          employment_type?: string | null
          facility_id?: string | null
          first_name: string
          full_name: string
          hourly_cost?: number | null
          id: string
          last_active_at?: string | null
          last_login_at?: string | null
          last_name: string
          locale?: string
          login_count?: number
          metadata?: Json
          mfa_enabled?: boolean
          onboarding_completed_at?: string | null
          phone?: string | null
          rate_card?: string | null
          start_date?: string | null
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          timezone?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          department?: string | null
          email?: string
          employment_type?: string | null
          facility_id?: string | null
          first_name?: string
          full_name?: string
          hourly_cost?: number | null
          id?: string
          last_active_at?: string | null
          last_login_at?: string | null
          last_name?: string
          locale?: string
          login_count?: number
          metadata?: Json
          mfa_enabled?: boolean
          onboarding_completed_at?: string | null
          phone?: string | null
          rate_card?: string | null
          start_date?: string | null
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          timezone?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: Json | null
          category: string | null
          created_at: string
          currency: string
          display_name: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          payment_terms: string | null
          phone: string | null
          status: string
          tags: string[]
          tax_id: string | null
          updated_at: string
          w9_on_file: boolean
          w9_received_date: string | null
          website: string | null
        }
        Insert: {
          address?: Json | null
          category?: string | null
          created_at?: string
          currency?: string
          display_name?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          payment_terms?: string | null
          phone?: string | null
          status?: string
          tags?: string[]
          tax_id?: string | null
          updated_at?: string
          w9_on_file?: boolean
          w9_received_date?: string | null
          website?: string | null
        }
        Update: {
          address?: Json | null
          category?: string | null
          created_at?: string
          currency?: string
          display_name?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          payment_terms?: string | null
          phone?: string | null
          status?: string
          tags?: string[]
          tax_id?: string | null
          updated_at?: string
          w9_on_file?: boolean
          w9_received_date?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_organization_id_fkey"
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
          location_id: string | null
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
          location_id?: string | null
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
          location_id?: string | null
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
            foreignKeyName: "venues_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      view_sections: {
        Row: {
          created_at: string
          entity_type: Database["public"]["Enums"]["view_entity_type"]
          id: string
          is_collapsed: boolean
          name: string
          organization_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          entity_type: Database["public"]["Enums"]["view_entity_type"]
          id?: string
          is_collapsed?: boolean
          name: string
          organization_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          entity_type?: Database["public"]["Enums"]["view_entity_type"]
          id?: string
          is_collapsed?: boolean
          name?: string
          organization_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "view_sections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_transfer_items: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          notes: string | null
          quantity: number
          transfer_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number
          transfer_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_transfer_items_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "warehouse_transfers"
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
      work_order_assignments: {
        Row: {
          assigned_at: string
          crew_profile_id: string
          id: string
          responded_at: string | null
          role: string | null
          status: string
          work_order_id: string
        }
        Insert: {
          assigned_at?: string
          crew_profile_id: string
          id?: string
          responded_at?: string | null
          role?: string | null
          status?: string
          work_order_id: string
        }
        Update: {
          assigned_at?: string
          crew_profile_id?: string
          id?: string
          responded_at?: string | null
          role?: string | null
          status?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_assignments_crew_profile_id_fkey"
            columns: ["crew_profile_id"]
            isOneToOne: false
            referencedRelation: "crew_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_assignments_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          checklist: Json | null
          completed_at: string | null
          completed_by: string | null
          completion_notes: string | null
          created_at: string
          description: string | null
          dispatched_at: string | null
          dispatched_by: string | null
          id: string
          location_address: string | null
          location_name: string | null
          organization_id: string
          priority: string
          proposal_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: string
          task_id: string | null
          title: string
          updated_at: string
          wo_number: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          checklist?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          dispatched_at?: string | null
          dispatched_by?: string | null
          id?: string
          location_address?: string | null
          location_name?: string | null
          organization_id: string
          priority?: string
          proposal_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          task_id?: string | null
          title: string
          updated_at?: string
          wo_number: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          checklist?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          dispatched_at?: string | null
          dispatched_by?: string | null
          id?: string
          location_address?: string | null
          location_name?: string | null
          organization_id?: string
          priority?: string
          proposal_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          task_id?: string | null
          title?: string
          updated_at?: string
          wo_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_dispatched_by_fkey"
            columns: ["dispatched_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
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
      check_permission: {
        Args: {
          p_action: string
          p_resource: string
          p_scope: string
          p_scope_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      evaluate_feature_flag: {
        Args: { p_key: string; p_org_id: string; p_user_id: string }
        Returns: boolean
      }
      generate_advance_number: { Args: { org_id: string }; Returns: string }
      is_org_admin_or_above: { Args: never; Returns: boolean }
      is_producer_role: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      seed_advance_categories: {
        Args: { p_org_id: string }
        Returns: undefined
      }
      tier_has_access: {
        Args: { required: Database["public"]["Enums"]["subscription_tier"] }
        Returns: boolean
      }
      user_org_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      access_code_type: "single_use" | "multi_use" | "unlimited"
      activation_type:
        | "stage"
        | "booth"
        | "hospitality"
        | "installation"
        | "catering"
        | "vip_area"
        | "green_room"
        | "backstage"
        | "merchandise"
        | "experiential"
        | "broadcast"
        | "signage"
        | "general"
        | "other"
      actor_type: "admin" | "client" | "system"
      advance_mode: "internal" | "collection"
      advance_priority: "critical" | "high" | "medium" | "low"
      advance_status:
        | "draft"
        | "open_for_submissions"
        | "submitted"
        | "under_review"
        | "changes_requested"
        | "approved"
        | "partially_fulfilled"
        | "fulfilled"
        | "completed"
        | "rejected"
        | "cancelled"
        | "on_hold"
        | "expired"
      advance_type:
        | "access"
        | "production"
        | "technical"
        | "hospitality"
        | "travel"
        | "labor"
        | "custom"
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
      collaborator_role:
        | "owner"
        | "manager"
        | "contributor"
        | "viewer"
        | "vendor"
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
      event_type:
        | "festival"
        | "conference"
        | "corporate"
        | "concert"
        | "sports"
        | "ceremony"
        | "broadcast"
        | "exhibition"
        | "tour"
        | "gala"
        | "wedding"
        | "production"
        | "other"
      expense_status: "pending" | "approved" | "rejected" | "reimbursed"
      fulfillment_status:
        | "pending"
        | "sourcing"
        | "quoted"
        | "confirmed"
        | "reserved"
        | "in_transit"
        | "delivered"
        | "inspected"
        | "setup_complete"
        | "active"
        | "struck"
        | "returned"
        | "damaged"
        | "cancelled"
      fulfillment_type:
        | "pickup"
        | "delivery"
        | "on_site"
        | "drop_ship"
        | "will_call"
        | "digital"
      integration_status:
        | "disconnected"
        | "connecting"
        | "connected"
        | "error"
        | "suspended"
      invite_status: "pending" | "accepted" | "declined" | "expired" | "revoked"
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
      location_type:
        | "venue"
        | "arena"
        | "stadium"
        | "convention_center"
        | "hotel"
        | "outdoor"
        | "warehouse"
        | "office"
        | "studio"
        | "restaurant"
        | "virtual"
        | "other"
      maintenance_status: "scheduled" | "in_progress" | "complete" | "cancelled"
      maintenance_type: "repair" | "inspection" | "cleaning" | "calibration"
      milestone_status: "pending" | "in_progress" | "complete"
      modifier_selection_type:
        | "list"
        | "text"
        | "quantity"
        | "boolean"
        | "date"
        | "date_range"
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
      portal_type:
        | "production"
        | "operations"
        | "food_beverage"
        | "talent"
        | "guest"
        | "temporary"
      pricing_strategy: "fixed" | "open" | "tiered" | "market" | "computed"
      procurement_method:
        | "rent"
        | "buy"
        | "internal"
        | "subcontract"
        | "consignment"
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
      unit_of_measure:
        | "each"
        | "pair"
        | "set"
        | "case"
        | "pallet"
        | "linear_ft"
        | "sq_ft"
        | "cubic_ft"
        | "hour"
        | "half_day"
        | "day"
        | "week"
        | "month"
        | "lb"
        | "ton"
        | "gallon"
        | "liter"
        | "person"
        | "crew"
        | "flat_rate"
      view_collaboration_type: "collaborative" | "personal" | "locked"
      view_display_type:
        | "table"
        | "board"
        | "calendar"
        | "gantt"
        | "list"
        | "gallery"
        | "timeline"
        | "form"
      view_entity_type:
        | "tasks"
        | "clients"
        | "deals"
        | "proposals"
        | "invoices"
        | "leads"
        | "crew"
        | "people"
        | "assets"
        | "equipment"
        | "expenses"
        | "time_entries"
        | "budgets"
        | "resources"
        | "warehouse"
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
      access_code_type: ["single_use", "multi_use", "unlimited"],
      activation_type: [
        "stage",
        "booth",
        "hospitality",
        "installation",
        "catering",
        "vip_area",
        "green_room",
        "backstage",
        "merchandise",
        "experiential",
        "broadcast",
        "signage",
        "general",
        "other",
      ],
      actor_type: ["admin", "client", "system"],
      advance_mode: ["internal", "collection"],
      advance_priority: ["critical", "high", "medium", "low"],
      advance_status: [
        "draft",
        "open_for_submissions",
        "submitted",
        "under_review",
        "changes_requested",
        "approved",
        "partially_fulfilled",
        "fulfilled",
        "completed",
        "rejected",
        "cancelled",
        "on_hold",
        "expired",
      ],
      advance_type: [
        "access",
        "production",
        "technical",
        "hospitality",
        "travel",
        "labor",
        "custom",
      ],
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
      collaborator_role: [
        "owner",
        "manager",
        "contributor",
        "viewer",
        "vendor",
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
      event_type: [
        "festival",
        "conference",
        "corporate",
        "concert",
        "sports",
        "ceremony",
        "broadcast",
        "exhibition",
        "tour",
        "gala",
        "wedding",
        "production",
        "other",
      ],
      expense_status: ["pending", "approved", "rejected", "reimbursed"],
      fulfillment_status: [
        "pending",
        "sourcing",
        "quoted",
        "confirmed",
        "reserved",
        "in_transit",
        "delivered",
        "inspected",
        "setup_complete",
        "active",
        "struck",
        "returned",
        "damaged",
        "cancelled",
      ],
      fulfillment_type: [
        "pickup",
        "delivery",
        "on_site",
        "drop_ship",
        "will_call",
        "digital",
      ],
      integration_status: [
        "disconnected",
        "connecting",
        "connected",
        "error",
        "suspended",
      ],
      invite_status: ["pending", "accepted", "declined", "expired", "revoked"],
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
      location_type: [
        "venue",
        "arena",
        "stadium",
        "convention_center",
        "hotel",
        "outdoor",
        "warehouse",
        "office",
        "studio",
        "restaurant",
        "virtual",
        "other",
      ],
      maintenance_status: ["scheduled", "in_progress", "complete", "cancelled"],
      maintenance_type: ["repair", "inspection", "cleaning", "calibration"],
      milestone_status: ["pending", "in_progress", "complete"],
      modifier_selection_type: [
        "list",
        "text",
        "quantity",
        "boolean",
        "date",
        "date_range",
      ],
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
      portal_type: [
        "production",
        "operations",
        "food_beverage",
        "talent",
        "guest",
        "temporary",
      ],
      pricing_strategy: ["fixed", "open", "tiered", "market", "computed"],
      procurement_method: [
        "rent",
        "buy",
        "internal",
        "subcontract",
        "consignment",
      ],
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
      unit_of_measure: [
        "each",
        "pair",
        "set",
        "case",
        "pallet",
        "linear_ft",
        "sq_ft",
        "cubic_ft",
        "hour",
        "half_day",
        "day",
        "week",
        "month",
        "lb",
        "ton",
        "gallon",
        "liter",
        "person",
        "crew",
        "flat_rate",
      ],
      view_collaboration_type: ["collaborative", "personal", "locked"],
      view_display_type: [
        "table",
        "board",
        "calendar",
        "gantt",
        "list",
        "gallery",
        "timeline",
        "form",
      ],
      view_entity_type: [
        "tasks",
        "clients",
        "deals",
        "proposals",
        "invoices",
        "leads",
        "crew",
        "people",
        "assets",
        "equipment",
        "expenses",
        "time_entries",
        "budgets",
        "resources",
        "warehouse",
      ],
    },
  },
} as const

