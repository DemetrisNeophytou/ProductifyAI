import { AuthForm } from "@/components/AuthForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "wouter";

export default function Signup() {
  return (
    <div className="min-h-screen relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="absolute top-6 left-6">
        <Link href="/">
          <a className="text-xl font-bold">AI Product Creator</a>
        </Link>
      </div>
      <AuthForm mode="signup" />
    </div>
  );
}
