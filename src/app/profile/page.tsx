import { PageLayout } from "@/components/PageLayout";
import { User, Mail, Shield, Key } from "lucide-react";

export default function ProfilePage() {
  return (
    <PageLayout title="User Profile">
      <div className="max-w-2xl space-y-8">
        <section className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-[var(--color-primary)]" /> Personal Information
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 py-3 border-b border-[var(--color-border-muted)]">
              <span className="text-sm text-[var(--color-text-muted)]">Full Name</span>
              <span className="text-sm font-medium col-span-2">Yuri Admin</span>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3 border-b border-[var(--color-border-muted)]">
              <span className="text-sm text-[var(--color-text-muted)]">Email Address</span>
              <span className="text-sm font-medium col-span-2">yuri@ledgerful.com</span>
            </div>
            <div className="grid grid-cols-3 gap-4 py-3">
              <span className="text-sm text-[var(--color-text-muted)]">Role</span>
              <span className="text-sm font-medium col-span-2 flex items-center gap-2">
                Administrator
                <span className="px-1.5 py-0.5 rounded bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-wider">
                  Verified
                </span>
              </span>
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6 opacity-50 cursor-not-allowed">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--color-text-muted)]" /> Security Settings
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] italic">
            Security settings are managed by the Ledgerful daemon.
          </p>
        </section>
      </div>
    </PageLayout>
  );
}
