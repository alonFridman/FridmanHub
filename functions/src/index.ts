import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import admin from "firebase-admin";
import { google } from "googleapis";

admin.initializeApp();

const db = admin.firestore();
const FIVE_MINUTES = 5 * 60 * 1000;
const familyConfigDoc = process.env.FAMILY_CONFIG_DOC || "default";

type CalendarOwner = "dad" | "mom";

type UnifiedEvent = {
  id: string;
  source: "google" | "school";
  owner: "dad" | "mom" | `kid:${string}`;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
};

type SchoolTemplate = {
  id: string;
  childId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  title: string;
};

type Kid = {
  id: string;
  name: string;
  color: string;
};

const eventsCache = new Map<string, { timestamp: number; data: UnifiedEvent[] }>();

const buildOAuthClient = async (owner: CalendarOwner) => {
  const tokenDoc = await db.collection("calendarTokens").doc(owner).get();
  if (!tokenDoc.exists) {
    throw new Error(`Missing OAuth token for ${owner}`);
  }

  const { refreshToken } = tokenDoc.data() as { refreshToken: string };

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.OAUTH_REDIRECT_URI
  );
  client.setCredentials({ refresh_token: refreshToken });
  return client;
};

const verifyAuth = async (req: any) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    throw new Error("Unauthorized");
  }
  return admin.auth().verifyIdToken(token);
};

const setCors = (req: any, res: any) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
};

const listCalendars = async (owner: CalendarOwner) => {
  const auth = await buildOAuthClient(owner);
  const calendar = google.calendar({ version: "v3", auth });
  const response = await calendar.calendarList.list();
  return (
    response.data.items?.map((item) => ({
      id: item.id,
      summary: item.summary,
      primary: item.primary,
      owner,
    })) || []
  );
};

const normalizeGoogleEvent = (event: any, owner: CalendarOwner): UnifiedEvent => {
  const start = event.start?.dateTime || event.start?.date;
  const end = event.end?.dateTime || event.end?.date;
  return {
    id: event.id || `${owner}-${event.start?.date}-${event.summary}`,
    source: "google",
    owner,
    title: event.summary || "(No title)",
    start,
    end,
    allDay: Boolean(event.start?.date),
  };
};

const fetchGoogleEvents = async (owner: CalendarOwner, timeMin: string, timeMax: string) => {
  const auth = await buildOAuthClient(owner);
  const calendar = google.calendar({ version: "v3", auth });
  const configDoc = await db.collection("familyConfig").doc(familyConfigDoc).get();
  const { dadCalendarId, momCalendarId, timezone } = configDoc.data() || {};
  const calendarId = owner === "dad" ? dadCalendarId : momCalendarId;
  if (!calendarId) {
    return [] as UnifiedEvent[];
  }
  const response = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    timeZone: timezone || "UTC",
  });
  return response.data.items?.map((ev) => normalizeGoogleEvent(ev, owner)) || [];
};

const fetchKids = async (): Promise<Kid[]> => {
  const snapshot = await db.collection("kids").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Kid, "id">) }));
};

const fetchSchoolTemplates = async (): Promise<SchoolTemplate[]> => {
  const snapshot = await db.collection("schoolSchedules").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<SchoolTemplate, "id">) }));
};

const buildSchoolEvents = (templates: SchoolTemplate[], kids: Kid[], start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const events: UnifiedEvent[] = [];

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const isoDate = date.toISOString().split("T")[0];
    templates
      .filter((tpl) => tpl.dayOfWeek === dayOfWeek)
      .forEach((tpl) => {
        const kid = kids.find((k) => k.id === tpl.childId);
        const startDateTime = `${isoDate}T${tpl.startTime}`;
        const endDateTime = `${isoDate}T${tpl.endTime}`;
        events.push({
          id: `school-${tpl.childId}-${isoDate}-${tpl.startTime}`,
          source: "school",
          owner: `kid:${tpl.childId}`,
          title: tpl.title || `School - ${kid?.name ?? "Child"}`,
          start: startDateTime,
          end: endDateTime,
          allDay: false,
        });
      });
  }

  return events;
};

const getEvents = async (timeMin: string, timeMax: string) => {
  const cacheKey = `${timeMin}_${timeMax}`;
  const cached = eventsCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < FIVE_MINUTES) {
    return cached.data;
  }

  const [dadEvents, momEvents, kids, templates] = await Promise.all([
    fetchGoogleEvents("dad", timeMin, timeMax),
    fetchGoogleEvents("mom", timeMin, timeMax),
    fetchKids(),
    fetchSchoolTemplates(),
  ]);

  const schoolEvents = buildSchoolEvents(templates, kids, timeMin, timeMax);
  const merged = [...dadEvents, ...momEvents, ...schoolEvents];
  eventsCache.set(cacheKey, { timestamp: now, data: merged });
  return merged;
};

export const calendarList = onRequest({ region: "us-central1" }, async (req, res) => {
  if (setCors(req, res)) return;
  try {
    await verifyAuth(req);
    const [dadCalendars, momCalendars] = await Promise.all([
      listCalendars("dad"),
      listCalendars("mom"),
    ]);
    res.json({ calendars: [...dadCalendars, ...momCalendars] });
  } catch (error: any) {
    logger.error(error);
    res.status(401).json({ error: error.message || "Unauthorized" });
  }
});

export const eventsRange = onRequest({ region: "us-central1" }, async (req, res) => {
  if (setCors(req, res)) return;
  try {
    await verifyAuth(req);
    const { start, end } = req.query as { start?: string; end?: string };
    if (!start || !end) {
      res.status(400).json({ error: "start and end query params are required" });
      return;
    }
    const events = await getEvents(start, end);
    res.json({ events });
  } catch (error: any) {
    logger.error(error);
    res.status(400).json({ error: error.message || "Failed to fetch events" });
  }
});

export const configApi = onRequest({ region: "us-central1" }, async (req, res) => {
  if (setCors(req, res)) return;
  try {
    await verifyAuth(req);
    if (req.method === "GET") {
      const [configDoc, kidsSnapshot, schedulesSnapshot] = await Promise.all([
        db.collection("familyConfig").doc(familyConfigDoc).get(),
        db.collection("kids").get(),
        db.collection("schoolSchedules").get(),
      ]);
      const config = configDoc.exists ? configDoc.data() : {};
      const kids = kidsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const schoolSchedules = schedulesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.json({ config, kids, schoolSchedules });
      return;
    }

    if (req.method === "POST") {
      const parsedBody =
        typeof req.body === "string" && req.body.length > 0 ? JSON.parse(req.body) : req.body;

      const { config, kids, schoolSchedules, calendarTokens } = parsedBody as {
        config?: Record<string, unknown>;
        kids?: Kid[];
        schoolSchedules?: SchoolTemplate[];
        calendarTokens?: { [key in CalendarOwner]?: { refreshToken: string; ownerEmail?: string } };
      };

      const batch = db.batch();
      if (config) {
        const configRef = db.collection("familyConfig").doc(familyConfigDoc);
        batch.set(configRef, config, { merge: true });
      }

      if (kids) {
        kids.forEach((kid) => {
          const kidRef = db.collection("kids").doc(kid.id || db.collection("kids").doc().id);
          batch.set(kidRef, { name: kid.name, color: kid.color });
        });
      }

      if (schoolSchedules) {
        schoolSchedules.forEach((schedule) => {
          const scheduleRef = db.collection("schoolSchedules").doc(schedule.id || db.collection("schoolSchedules").doc().id);
          batch.set(scheduleRef, {
            childId: schedule.childId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            title: schedule.title || "School",
          });
        });
      }

      if (calendarTokens) {
        (Object.keys(calendarTokens) as CalendarOwner[]).forEach((owner) => {
          const token = calendarTokens[owner];
          if (token?.refreshToken) {
            const tokenRef = db.collection("calendarTokens").doc(owner);
            batch.set(tokenRef, {
              refreshToken: token.refreshToken,
              ownerEmail: token.ownerEmail || null,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        });
      }

      await batch.commit();
      eventsCache.clear();
      res.json({ status: "ok" });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    logger.error(error);
    res.status(400).json({ error: error.message || "Config error" });
  }
});
