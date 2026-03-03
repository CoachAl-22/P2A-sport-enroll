// Google Sheets integration via Replit connector
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X-Replit-Token not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
export async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

const SPREADSHEET_ID = '1tCdAdrNsCgWWIh0x44ge87Dlj5mD6kUd8CEDWlzh1P0';

export async function appendSurveyToSheet(data: {
  studentName: string | null;
  studentClass: string;
  athleteLevel: string;
  outsideSports: string[];
  otherSports: string | null;
  daysActive: string;
  runningEnjoyed: string[];
  runningEnjoymentScale: number;
  fieldEventsInterested: string[];
  hardestPart: string;
  funFactors: string[];
  competingFeel: string;
  engagementScale: number;
  goals: string[];
  specificEvent: string | null;
  awesomeFactor: string | null;
  injuryInfo: string | null;
  excitementLevel: number;
}) {
  const sheets = await getUncachableGoogleSheetClient();

  const row = [
    new Date().toISOString(),
    data.studentName || 'Anonymous',
    data.studentClass,
    data.athleteLevel,
    data.outsideSports.join(', '),
    data.otherSports || '',
    data.daysActive,
    data.runningEnjoyed.join(', '),
    data.runningEnjoymentScale.toString(),
    data.fieldEventsInterested.join(', '),
    data.hardestPart,
    data.funFactors.join(', '),
    data.competingFeel,
    data.engagementScale.toString(),
    data.goals.join(', '),
    data.specificEvent || '',
    data.awesomeFactor || '',
    data.injuryInfo || '',
    data.excitementLevel.toString(),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!A:S',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [row],
    },
  });
}

export async function ensureSheetHeaders() {
  try {
    const sheets = await getUncachableGoogleSheetClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1:S1',
    });

    if (!response.data.values || response.data.values.length === 0) {
      const headers = [
        'Timestamp',
        'Student Name',
        'Class/Group',
        'Athlete Level',
        'Outside Sports',
        'Other Sports',
        'Days Active',
        'Running Enjoyed',
        'Running Enjoyment (1-10)',
        'Field Events Interested',
        'Hardest Part',
        'Fun Factors',
        'Competing Feel',
        'Engagement (1-10)',
        'Goals',
        'Specific Event/Skill',
        'What Would Make It Awesome',
        'Injury Info',
        'Excitement Level (1-5)',
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A1:S1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });
      console.log('Google Sheet headers created successfully');
    }
  } catch (error) {
    console.error('Failed to set up Google Sheet headers:', error);
  }
}
