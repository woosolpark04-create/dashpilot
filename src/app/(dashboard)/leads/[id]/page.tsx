export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900">Lead {id}</h1>
      <p className="mt-2 text-sm text-gray-500">
        Lead detail/edit view is planned for Phase 5.
      </p>
    </div>
  );
}
