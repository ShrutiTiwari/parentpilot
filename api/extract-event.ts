import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const IMAGE_EXTRACTION_PROMPT = `
You are a helpful assistant that extracts structured event data from school notices or invitations shown in images.

Your task:
- Extract ALL events listed in the image. Do not miss any.
- If the image contains multiple events, extract every single one.
- Interpret dates precisely as written, without adjusting or assuming a day earlier.
- YEAR HANDLING:
  * If a year is explicitly shown, use that year exactly.
  * If NO year is specified, use 2026 for dates that haven't passed yet this year.
  * If NO year is specified and the date has already passed this year, use 2027.
- Output a valid JSON array, one object per event.
- ALWAYS include todos for each event based on its category.
- Only return data in the structure shown below, and nothing else.

Required format:
[
  {
    "title": "string",
    "date": "Month DD, YYYY",
    "time": "HH:MM - HH:MM",
    "venue": "string",
    "yearGroup": "Year 1" | "Year 2" | "Year 3" | "Year 4" | "Year 5" | "Year 6" | "All",
    "category": "holiday" | "birthday" | "sports" | "swimming" | "music" | "parent" | "report" | "exam" | "general",
    "source": "string",
    "todos": [
      {
        "id": "string",
        "text": "string",
        "completed": false
      }
    ]
  }
]

Rules:
- Use "00:00 - 00:00" for all-day events or if time is not specified.
- Always include appropriate todos:
  - holidays: "Plan child care for holiday"
  - birthdays: "Buy gift for birthday"
  - sports: "Prepare sports equipment"
  - swimming: "Pack swimming gear"
  - music: "Prepare musical instruments"
  - parent: "Arrange childcare"
  - report: "Review report with child"
  - exam: "Help with exam preparation"
  - general: "Prepare for event"
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
    const [, files] = await form.parse(req);

    const fileField = files.image;
    const file = Array.isArray(fileField) ? fileField[0] : fileField;

    if (!file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const mimeType = file.mimetype || 'image/jpeg';
    if (!mimeType.startsWith('image/') && mimeType !== 'application/pdf') {
      return res.status(415).json({ error: 'File must be an image or PDF' });
    }

    const fileBuffer = fs.readFileSync(file.filepath);
    const base64Data = fileBuffer.toString('base64');

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: IMAGE_EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return res.status(500).json({ error: 'Unexpected response from AI' });
    }

    // Strip markdown code fences if present
    const raw = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');

    let events;
    try {
      events = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'Failed to parse AI response as JSON', raw: content.text });
    }

    if (!Array.isArray(events)) {
      events = [events];
    }

    return res.status(200).json({ events });
  } catch (error: any) {
    console.error('extract-event error:', error);
    return res.status(500).json({ error: error.message || 'Extraction failed' });
  }
}
