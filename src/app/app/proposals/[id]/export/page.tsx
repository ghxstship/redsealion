import { getExportData } from './_data';
import ExportHubContent from './_ExportHubContent';

export default async function ExportHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exportData = await getExportData(id);

  return <ExportHubContent id={id} data={exportData} />;
}
