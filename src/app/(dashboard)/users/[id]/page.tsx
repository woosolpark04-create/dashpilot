export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900">User {id}</h1>
      <p className="mt-2 text-sm text-gray-500">
        User detail/edit view is planned for Phase 4.
      </p>
    </div>
  );
}
