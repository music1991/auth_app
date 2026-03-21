/* import { getSession } from "@/lib/auth";
import {
  Mail,
  ShieldCheck,
  Lock,
  Database,
  Rocket,
  CheckCircle,
  Code as CodeIcon,
  Timer,
  Bell,
  RefreshCcw,
  Cookie,
  Layers,
} from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function CodeInline({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1 rounded bg-gray-100 font-mono text-[0.9em] whitespace-nowrap">
      {children}
    </code>
  );
}

export default async function HomePage() {
  const cs = await cookies();
  const name = cs.get("name")?.value ?? "";
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Welcome {name ? `${name}` : ""}
        </h1>

        <p className="text-gray-700 mt-6">
          This project is a modern authentication demo.
        </p>
        <p className="text-gray-700">
          It includes <strong>user registration and login</strong> built with{" "}
          <strong>Next.js, React, and TailwindCSS</strong>. 🚀
        </p>
        <p className="text-gray-700">
          Deployed on <strong>Vercel</strong> and uses{" "}
          <strong>Resend</strong> for free verification email delivery.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Rocket className="w-6 h-6 text-blue-600" />
          Core features
        </h2>

        <ul className="mt-4 space-y-3">
          <li className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-500 mt-1 shrink-0" />
            <p className="m-0 flex-1 leading-relaxed text-gray-700 break-words">
              User registration with verification code sent and resend{" "}
              (expires in 2 minutes).
            </p>
          </li>

          <li className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-purple-500 mt-1 shrink-0" />
            <p className="m-0 flex-1 leading-relaxed text-gray-700 break-words">
              Secure login with passwords hashed using{" "}
              <CodeInline>bcryptjs</CodeInline>.
            </p>
          </li>

          <li className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-500 mt-1 shrink-0" />
            <p className="m-0 flex-1 leading-relaxed text-gray-700 break-words">
              Sessions managed with JWT stored in <em>httpOnly</em> cookies.
            </p>
          </li>

          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 mt-1 shrink-0" />
            <p className="m-0 flex-1 leading-relaxed text-gray-700 break-words">
              Logout and middleware protect routes and prevent back navigation
              from showing protected pages.
            </p>
          </li>
        </ul>
      </div>

      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <CodeIcon className="w-6 h-6 text-orange-600" />
          Best practices applied
        </h2>

        <ul className="mt-4 space-y-3">
          <li className="flex items-start gap-3">
            <Layers className="w-5 h-5 text-blue-500 mt-1 shrink-0" />
            <p className="m-0 flex-1 leading-relaxed text-gray-700 break-words">
              Clear separation of concerns between API and UI.
            </p>
          </li>

          <li className="flex items-start gap-3">
            <Cookie className="w-5 h-5 text-purple-500 mt-1 shrink-0" />
            <p className="m-0 flex-1 leading-relaxed text-gray-700 break-words">
              Secure cookies (
              <CodeInline>httpOnly</CodeInline>,{" "}
              <CodeInline>sameSite=lax</CodeInline>).
            </p>
          </li>

          <li className="flex items-start gap-3">
            <RefreshCcw className="w-5 h-5 text-green-500 mt-1 shrink-0" />
            <p className="m-0 flex-1 leading-relaxed text-gray-700 break-words">
              Cache prevention using <CodeInline>force-dynamic</CodeInline> and{" "}
              <CodeInline>no-store</CodeInline>.
            </p>
          </li>

          <li className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-500 mt-1 shrink-0" />
            <p className="m-0 flex-1 leading-relaxed text-gray-700 break-words">
              Clear user feedback with <strong>toasts</strong> and visible
              timers.
            </p>
          </li>

          <li className="flex items-start gap-3">
            <Timer className="w-5 h-5 text-red-500 mt-1 shrink-0" />
            <p className="m-0 flex-1 leading-relaxed text-gray-700 break-words">
              Reusable components like <CodeInline>Countdown</CodeInline>.
            </p>
          </li>
        </ul>
      </div>

      <div className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50 sm:flex-row flex-col">
        <Database className="w-6 h-6 text-orange-600 shrink-0" />
        <div className="flex-1 space-y-2">
          <p className="text-gray-700 leading-relaxed break-words">
            For this project, the database is hosted on{" "}
            <strong>Neon PostgreSQL</strong>, integrated through{" "}
            <strong>Vercel Postgres Storage</strong>.
          </p>
          <p className="text-gray-700 leading-relaxed break-words">
            Each deployment environment connects to a different branch:{" "}
            <CodeInline>dev</CodeInline> for development and{" "}
            <CodeInline>main</CodeInline> for production.
          </p>
          <p className="text-gray-700 leading-relaxed break-words">
            This setup allows safe testing and development without affecting production
            data, while maintaining the same schema and migrations across environments.
          </p>
        </div>
      </div>
    </section>
  );
}
 */