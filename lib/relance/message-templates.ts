import type { PipelineStage } from "@/lib/contacts/schema";

/** Modèles courts à copier-coller — à adapter avant envoi. */
export const RELANCE_TEMPLATES: Record<PipelineStage, string[]> = {
  premier_contact: [
    "Bonjour, je fais suite à notre échange. Avez-vous pu avancer sur vos critères de recherche ? Je reste disponible pour un court appel.",
    "Bonjour, merci pour votre intérêt. Souhaitez-vous que je vous propose une sélection de biens cette semaine ?",
  ],
  qualifie: [
    "Bonjour, j’ai identifié quelques biens qui pourraient vous correspondre. Quand seriez-vous disponible pour en discuter ?",
    "Bonjour, pour affiner votre dossier : budget confirmé et secteurs prioritaires — un créneau téléphonique vous conviendrait ?",
  ],
  visite: [
    "Bonjour, suite à la visite, qu’en avez-vous pensé ? Je peux organiser une seconde visite ou élargir la recherche si besoin.",
    "Bonjour, avez-vous des questions après la visite ? Je vous envoie les prochaines étapes possibles.",
  ],
  offre: [
    "Bonjour, je vous fais un point sur l’offre / la négociation. N’hésitez pas si vous avez besoin de précisions.",
    "Bonjour, où en êtes-vous sur votre décision ? Je reste à votre écoute pour la suite du dossier.",
  ],
  signature: [
    "Bonjour, je vous confirme les prochaines étapes jusqu’à la signature. N’hésitez pas pour les documents manquants.",
  ],
  fidelisation: [
    "Bonjour, un petit point après votre installation : tout se passe bien ? Je reste votre interlocuteur pour la suite.",
  ],
};
