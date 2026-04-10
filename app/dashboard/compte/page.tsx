import { NotificationSettings } from "./notification-settings";

export default function ComptePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Compte</h1>
        <p className="mt-2 text-sm text-slate-600">
          Préférences liées aux notifications et au digest push.
        </p>
      </div>
      <NotificationSettings />
    </div>
  );
}
