interface LocationPageProps {
  params: Promise<{
    locationId: string;
  }>;
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { locationId } = await params;

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Location Details</h1>
      <p className="text-gray-500 dark:text-gray-400">
        Structural placeholder for building, room, or landmark info: <span className="font-mono text-sm font-semibold">{locationId}</span>
      </p>
    </main>
  );
}
