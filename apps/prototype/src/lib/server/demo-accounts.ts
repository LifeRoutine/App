import { createDefaultState } from "@/lib/mock-data";
import type { AppState } from "@/lib/types";

export type DemoAccount = {
  username: string;
  password: string;
  householdId: string;
  displayName: string;
};

/** Demo-Zugänge — Passwörter per Env überschreibbar. */
export function getDemoAccounts(): DemoAccount[] {
  return [
    {
      username: (process.env.DEMO_USER_A || "irena").toLowerCase(),
      password: process.env.DEMO_PASS_A || "IrenaDemo26",
      householdId: "hh-irena",
      displayName: "Irena",
    },
    {
      username: (process.env.DEMO_USER_B || "saskia").toLowerCase(),
      password: process.env.DEMO_PASS_B || "SaskiaDemo26",
      householdId: "hh-saskia",
      displayName: "Saskia",
    },
  ];
}

export function findDemoAccount(
  username: string,
  password: string,
): DemoAccount | null {
  const u = username.trim().toLowerCase();
  const p = password;
  return (
    getDemoAccounts().find((a) => a.username === u && a.password === p) ?? null
  );
}

/** Frischer Demo-Stand: Hechingen + Müll, Onboarding fertig, Name gesetzt. */
export function seedDemoHouseholdState(displayName: string): AppState {
  const base = createDefaultState();
  return {
    ...base,
    profile: {
      ...base.profile,
      onboardingDone: true,
      displayName,
      householdType: "paar",
      location: "Hechingen",
    },
    members: [
      {
        id: "m1",
        name: displayName,
        role: "owner",
        color: "#4a6f8c",
      },
    ],
  };
}
