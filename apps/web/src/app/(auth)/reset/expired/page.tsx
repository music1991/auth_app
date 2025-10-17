import Link from "next/link";

export default function ResetExpiredPage() {
  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Reset Password</h1>
      <div className="rounded-lg border bg-red-50 p-4 text-red-700">
        <p className="font-medium">This reset link is invalid or has expired.</p>
        <p className="text-sm mt-1">
          Please request a new link from{" "}
          <Link href="/forgot" className="underline">
            Forgot Password
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
