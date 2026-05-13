const IMAGE_EXTRACTION_PROMPT = `
You are a helpful assistant that extracts structured event data from school notices or invitations shown in images.


# EXAMPLE 1

Image contains this text:
"""
Stage 2 - 09:15 - July 7th - 8th 2026
Class
Active
Mon
Tue
13:30PM - 14:00PM
13:30PM - 14:00PM
13:30PM - 14:00PM
13:30PM - 14:00PM
13:30PM - 14:00PM
Program:
Start Date:
Drop Date:
Intensive Group Swimming Lessons (45 minute lessons)
7 Jul 2026
8 Jul 2026
"""

Expected output:
[
  {
    "title": "Intensive Private Lessons",
    "date": "July 7, 2026",
    "time": "13:30 - 14:00",
    "venue": "",
    "yearGroup": "All",
    "category": "music",
    "source": "example1.png",
    "todos": [
      {
        "id": "music-1",
        "text": "Prepare musical instruments",
        "completed": false
      }
    ]
  },
  {
    "title": "Intensive Private Lessons",
    "date": "July 8, 2026",
    "time": "13:30 - 14:00",
    "venue": "",
    "yearGroup": "All",
    "category": "music",
    "source": "example1.png",
    "todos": [
      {
        "id": "music-2",
        "text": "Prepare musical instruments",
        "completed": false
      }
    ]
  }
]

# END OF EXAMPLE

Your task:
- **CRITICAL**: Extract **ALL future events** listed in the image. Do not miss any events.
- **MANDATORY**: If the image contains multiple events, you MUST extract every single one.
- **VERIFICATION**: Count the events in the image and ensure your response matches that count.
- If there is only one event, return a JSON array with one object.
- Interpret dates **precisely as written**, without adjusting or assuming a day earlier.
- **YEAR HANDLING**:
  * If a year is explicitly shown in the image, use that year exactly
  * If NO year is specified, use the current year (2026) for dates that haven't passed yet this year
  * If NO year is specified and the date has already passed this year, use next year (2027)
  * Context example: Today is February 2026, if event says "June 8-19", use "June 8, 2026" since June hasn't occurred yet this year
- If a day name is used (e.g., "next Friday"), interpret it **accurately as the next upcoming** instance of that day **after today's date**.
- Use date and time information exactly as shown, unless missing or ambiguous.
- Output a **valid JSON array**, one object per event.
- **Do NOT skip** any events. Go line by line if needed.
- **ALWAYS include todos** for each event based on its category.
- Only return data in the structure shown below, and **nothing else**.

Required format:
[
  {
    "title": "string",
    "date": "Month DD, YYYY",   // e.g. June 3, 2026
    "time": "HH:MM - HH:MM",    // Use 24-hr format, e.g. 14:00 - 17:30
    "venue": "string", // The event venue (if available)
    "yearGroup": "Year 1" | "Year 2" | "Year 3" | "Year 4" | "Year 5" | "Year 6" | "All",
    "category": "holiday" | "birthday" | "sports" | "swimming" | "music" | "parent" | "report" | "exam" | "general",
    "source": "string",  // Use the filename or source image label
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
- **ALWAYS include the appropriate todos** for each event:
  - For holidays: Add todo "Plan child care for holiday"
  - For birthdays: Add todo "Buy gift for birthday"
  - For sports events: Add todo "Prepare sports equipment"
  - For swimming events: Add todo "Pack swimming gear"
  - For music events: Add todo "Prepare musical instruments"
  - For parent events: Add todo "Arrange childcare"
  - For reports: Add todo "Review report with child"
  - For exams: Add todo "Help with exam preparation"
  - For general events: Add todo "Prepare for event"
  - Match the JSON schema exactly — do not include markdown, bullets, commentary, or any explanation.

  
`;

module.exports = {
  IMAGE_EXTRACTION_PROMPT
};
