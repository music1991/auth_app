export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="mx-auto max-w-md px-4 py-8">
        {children}
      </section>
    </div>
  );
}