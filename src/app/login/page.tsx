import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="text-center text-sm font-medium text-[#14293D]">
          Atlas Capture
        </p>
        <h1 className="mt-1 text-center text-2xl font-semibold text-zinc-900">
          Logistics Tracker
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Enter your name and the admin PIN to view and manage requests. Your
          name is recorded against any status change you make.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
