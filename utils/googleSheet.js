import { google } from "googleapis";

export const appendToGoogleSheet = async (booking) => {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const auth = new google.auth.GoogleAuth({
    credentials: process.env.GOOGLE_SERVICE_ACCOUNT_JSON
      ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
      : undefined,
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_JSON
      ? undefined
      : "service_account.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const values = [
    [
      booking.concerns,
      booking.selectedDate,
      booking.selectedTime,
      new Date().toISOString(),
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Counselling!A4:D4", // A to D columns
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
};

export const appendMentorshipToGoogleSheet = async (mentorship) => {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;

  const auth = new google.auth.GoogleAuth({
    keyFile: "service_account.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const values = [
    [
      mentorship.concerns,
      mentorship.selectedDate,
      `'${mentorship.selectedTime}`, // ✅ keep AM/PM text
      mentorship.createdAt?.toISOString() || new Date().toISOString(),
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Mentorship!A4:D4",
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
};
