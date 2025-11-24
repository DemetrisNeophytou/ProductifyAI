import type { User } from "@shared/schema";

export const splitName = (raw?: string) => {
  if (!raw) {
    return { firstName: undefined, lastName: undefined };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { firstName: undefined, lastName: undefined };
  }

  const [first, ...rest] = trimmed.split(/\s+/);
  return {
    firstName: first || undefined,
    lastName: rest.length ? rest.join(" ") : undefined,
  };
};

export const fallbackNameFromEmail = (email?: string | null) => {
  if (!email) return "User";
  const [localPart] = email.split("@");
  return localPart || "User";
};

export const planFieldsFromIsPro = (isPro: boolean) => ({
  plan: isPro ? "pro" : "free",
  subscriptionTier: isPro ? "pro" : "free",
  subscriptionStatus: isPro ? "active" : "trialing",
  isPro,
});

export const mapUserToApi = (user: User) => {
  const nameParts = [user.firstName, user.lastName].filter(Boolean);
  const derivedName =
    nameParts.length > 0
      ? nameParts.join(" ")
      : user.name || fallbackNameFromEmail(user.email);

  const plan = user.plan?.toLowerCase();
  const tier = user.subscriptionTier?.toLowerCase();
  const isPro = user.isPro ?? plan === "pro" || tier === "pro";

  return {
    id: user.id,
    email: user.email,
    name: derivedName,
    isPro,
  };
};

