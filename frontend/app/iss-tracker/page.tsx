export default function IssTrackerPage() {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const iframeSrc = mapsApiKey
    ? `/iss-tracker.html?gmapsKey=${encodeURIComponent(mapsApiKey)}`
    : "/iss-tracker.html";

  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <iframe
        src={iframeSrc}
        title="ISS Orbital Tracker"
        className="h-full w-full border-0"
        loading="eager"
      />
    </main>
  );
}
