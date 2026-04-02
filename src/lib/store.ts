import { Redis } from "@upstash/redis";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export interface StoredCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface StoredShow {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  overview: string;
  genres: string[];
  vote_average: number;
  cast: StoredCastMember[];
}

interface StoreData {
  shows: StoredShow[];
}

const REDIS_KEY = "actor-crossref:shows";

// Use Redis in production, local JSON in dev
function useRedis(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function getRedis(): Redis {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

const DATA_PATH = path.join(process.cwd(), "data", "shows.json");

async function readLocal(): Promise<StoreData> {
  const raw = await readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

async function writeLocal(data: StoreData): Promise<void> {
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

async function readStore(): Promise<StoreData> {
  if (useRedis()) {
    const data = await getRedis().get<StoreData>(REDIS_KEY);
    return data ?? { shows: [] };
  }
  return readLocal();
}

async function writeStore(data: StoreData): Promise<void> {
  if (useRedis()) {
    await getRedis().set(REDIS_KEY, data);
    return;
  }
  await writeLocal(data);
}

export async function getShows(): Promise<StoredShow[]> {
  const data = await readStore();
  return data.shows;
}

export async function addShow(show: StoredShow): Promise<StoredShow> {
  const data = await readStore();
  const exists = data.shows.find((s) => s.id === show.id);
  if (exists) return exists;
  data.shows.push(show);
  await writeStore(data);
  return show;
}

export async function removeShow(showId: number): Promise<boolean> {
  const data = await readStore();
  const before = data.shows.length;
  data.shows = data.shows.filter((s) => s.id !== showId);
  if (data.shows.length === before) return false;
  await writeStore(data);
  return true;
}

export interface CrossReference {
  actor: StoredCastMember;
  shows: { showId: number; showName: string; character: string }[];
}

export async function getCrossReferences(minShows = 2): Promise<CrossReference[]> {
  const data = await readStore();
  const actorMap = new Map<number, CrossReference>();

  for (const show of data.shows) {
    for (const member of show.cast) {
      if (!actorMap.has(member.id)) {
        actorMap.set(member.id, { actor: member, shows: [] });
      }
      actorMap.get(member.id)!.shows.push({
        showId: show.id,
        showName: show.name,
        character: member.character,
      });
    }
  }

  return Array.from(actorMap.values())
    .filter((ref) => ref.shows.length >= minShows)
    .sort((a, b) => b.shows.length - a.shows.length);
}
