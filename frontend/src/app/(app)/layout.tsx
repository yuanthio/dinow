import Navigation from "@/components/global/Navigation";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Navigation />
      <main>{children}</main>
    </div>
  );
}
