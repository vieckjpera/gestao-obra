export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]
export type ItemType = 'material' | 'labor' | 'permit' | 'other'
export type EstimateStatus = 'draft' | 'ready' | 'sent' | 'approved' | 'rejected' | 'expired'
export type UserRole = 'super_admin' | 'owner' | 'pm' | 'sub' | 'homeowner'

export interface Organization {
  id: string; name: string; slug: string
  plan: 'mvp' | 'starter' | 'pro' | 'enterprise'
  active: boolean; created_at: string; updated_at: string
}
export interface Client {
  id: string; org_id: string; name: string
  email: string | null; phone: string | null; address: string | null
  city: string | null; state: string | null; zip: string | null
  notes: string | null; created_at: string; updated_at: string
}
export interface ServiceType {
  id: string; org_id: string | null; name: string
  parent_id: string | null; default_margin_pct: number
  active: boolean; sort_order: number; created_at: string
}
export interface Estimate {
  id: string; org_id: string; client_id: string
  service_type_id: string | null; estimate_number: string
  scope: string | null; status: EstimateStatus
  profit_margin_pct: number; valid_until: string | null
  subtotal_materials: number; subtotal_labor: number
  subtotal_other: number; grand_total: number; total_with_margin: number
  check_client_complete: boolean; check_has_sections: boolean
  check_items_complete: boolean; check_margin_defined: boolean
  check_no_zero_items: boolean; pdf_url: string | null
  created_by: string | null; created_at: string; updated_at: string
  client?: Client; service_type?: ServiceType; sections?: EstimateSection[]
}
export interface EstimateSection {
  id: string; estimate_id: string; org_id: string
  name: string; sort_order: number; created_at: string
  items?: EstimateItem[]
}
export interface EstimateItem {
  id: string; section_id: string; estimate_id: string; org_id: string
  description: string; vendor_notes: string | null
  qty: number; unit: string | null; unit_price: number
  labor_hours: number; labor_rate: number; item_type: ItemType
  line_total: number; sort_order: number
  created_at: string; updated_at: string
}
export interface EstimateTemplate {
  id: string; org_id: string | null; service_type_id: string | null
  name: string; is_default: boolean; created_at: string
  sections?: EstimateTemplateSection[]
}
export interface EstimateTemplateSection {
  id: string; template_id: string; name: string; sort_order: number
  items?: EstimateTemplateItem[]
}
export interface EstimateTemplateItem {
  id: string; template_section_id: string; description: string
  vendor_notes: string | null; unit: string | null
  unit_price: number; labor_hours: number; labor_rate: number
  item_type: ItemType; sort_order: number
}
