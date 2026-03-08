import dynamic from "next/dynamic";

const PrimaryAppClient = dynamic(
  () => import("../components/PrimaryAppClient"),
  {ssr: false}
);

export default function Home() {
  return <PrimaryAppClient />;
}
