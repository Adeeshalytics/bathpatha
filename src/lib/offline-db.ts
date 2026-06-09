import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { PendingMeal } from "./types";

interface BathpathaDB extends DBSchema {
  pendingMeals: {
    key: string; // localId
    value: PendingMeal;
  };
}

let dbPromise: Promise<IDBPDatabase<BathpathaDB>> | null = null;

function getDB() {
  if (typeof window === "undefined") {
    throw new Error("offline-db is browser-only");
  }
  if (!dbPromise) {
    dbPromise = openDB<BathpathaDB>("bathpatha", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("pendingMeals")) {
          db.createObjectStore("pendingMeals", { keyPath: "localId" });
        }
      },
    });
  }
  return dbPromise;
}

export async function queuePendingMeal(meal: PendingMeal): Promise<void> {
  const db = await getDB();
  await db.put("pendingMeals", meal);
}

export async function getPendingMeals(): Promise<PendingMeal[]> {
  const db = await getDB();
  return db.getAll("pendingMeals");
}

export async function removePendingMeal(localId: string): Promise<void> {
  const db = await getDB();
  await db.delete("pendingMeals", localId);
}

export async function countPendingMeals(): Promise<number> {
  const db = await getDB();
  return db.count("pendingMeals");
}
