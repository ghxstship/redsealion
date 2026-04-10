import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PublicFormClient from './PublicFormClient';

interface LeadForm {
  id: string;
  name: string;
  description: string | null;
  fields: Record<string, unknown>[];
  embed_token: string;
  organization_id: string;
  brand_config?: {
    primaryColor?: string;
    backgroundColor?: string;
    fontHeading?: string;
    fontBody?: string;
  };
  logo_url?: string | null;
}

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from('lead_forms')
    .select('id, name, description, fields, embed_token, organization_id, organizations(brand_config, logo_url)')
    .eq('embed_token', token)
    .eq('is_active', true)
    .single();

  if (!form) {
    notFound();
  }

  const org = (form as Record<string, unknown>).organizations as Record<string, unknown> | null;

  const formData: LeadForm = {
    id: form.id,
    name: form.name,
    description: form.description,
    fields: form.fields as Record<string, unknown>[],
    embed_token: form.embed_token,
    organization_id: form.organization_id,
    brand_config: org?.brand_config as LeadForm['brand_config'],
    logo_url: org?.logo_url as string | undefined,
  };

  return (
    <div 
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
      style={{ backgroundColor: formData.brand_config?.backgroundColor || '#f9fafb' }}
    >
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 p-8">
        {formData.logo_url && (
          <div className="mb-6 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={formData.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
          </div>
        )}
        <div className="mb-8 text-center">
          <h1 
            className="text-2xl font-bold text-gray-900"
            style={{ 
              fontFamily: formData.brand_config?.fontHeading || 'inherit',
              color: formData.brand_config?.primaryColor || 'inherit'
            }}
          >
            {formData.name}
          </h1>
          {formData.description && (
            <p className="mt-2 text-sm text-gray-600">{formData.description}</p>
          )}
        </div>

        <PublicFormClient form={formData} />
      </div>
    </div>
  );
}
