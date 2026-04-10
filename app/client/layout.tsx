import type { ReactNode } from "react";
import "../globals.css";

export default function ClientPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f1eb] text-stone-900 antialiased">
      {children}
      <footer className="border-t border-stone-200/80 bg-white/60 px-4 py-6 text-center text-xs text-stone-500">
        <p>
          Espace sécurisé. Les données affichées concernent votre dossier chez
          l’agence. Pour toute demande d’accès ou de rectification (RGPD),
          contactez directement votre conseiller.
        </p>
      </footer>
    </div>
  );
}
