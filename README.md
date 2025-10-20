# String Analysis API

A NestJS REST API for uploading, analyzing, and filtering strings with advanced properties like palindrome detection, character frequency analysis, and SHA256 hashing.

## Features

- **Upload Strings** - Submit strings for analysis and storage
- **Analyze Properties** - Automatic calculation of string properties including:
  - Length and word count
  - Palindrome detection
  - Unique character count
  - SHA256 hash
  - Character frequency mapping
- **Search & Filter** - Query strings by value or multiple filter criteria
- **Natural Language Queries** - Pre-defined natural language filters for common searches
- **Delete Strings** - Remove strings from storage

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Storage**: JSON file (local)
- **HTTP Client**: Axios

## Installation

```bash
npm install
# or
pnpm install
```

## Running the Application

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### 1. Upload a String

**Request:**
```
POST /strings
Content-Type: application/json

{
  "value": "your string here"
}
```

**Response (201 Created):**
```json
{
  "id": "abc123...",
  "value": "your string here",
  "properties": {
    "length": 16,
    "is_palindrome": false,
    "unique_characters": 12,
    "word_count": 3,
    "sha256_hash": "...",
    "character_frequency_map": {
      "y": 1,
      "o": 2,
      ...
    }
  },
  "created_at": "2025-10-20T14:30:00.000Z"
}
```

### 2. Get String by Value

**Request:**
```
GET /strings/search?value=hello
```

**Response (200 OK):**
```json
{
  "id": "...",
  "value": "hello",
  "properties": {...},
  "created_at": "..."
}
```

**Response (empty if not found):**
```
null
```

### 3. Get All Strings

**Request:**
```
GET /strings/all
```

**Response (200 OK):**
```json
[
  {
    "id": "...",
    "value": "string1",
    "properties": {...},
    "created_at": "..."
  },
  {
    "id": "...",
    "value": "string2",
    "properties": {...},
    "created_at": "..."
  }
]
```

### 4. Filter by Multiple Criteria

**Request:**
```
GET /strings/search?is_palindrome=true&min_length=5&max_length=20
```

**Query Parameters:**
- `value` - Exact string value to search
- `is_palindrome` - Boolean (true/false)
- `min_length` - Minimum string length
- `max_length` - Maximum string length
- `word_count` - Exact number of words
- `contains_character` - String must contain this character

**Examples:**

Find palindromic strings:
```
GET /strings/search?is_palindrome=true
```

Find strings longer than 10 characters:
```
GET /strings/search?min_length=10
```

Find single-word palindromes:
```
GET /strings/search?is_palindrome=true&word_count=1
```

Find strings containing 'a' that are between 5-15 characters:
```
GET /strings/search?contains_character=a&min_length=5&max_length=15
```

### 5. Natural Language Queries

**Request:**
```
GET /strings/natural-language?query=all single word palindromic strings
```

**Available Queries:**
- `"all single word palindromic strings"` - Single word palindromes
- `"strings longer than 10 characters"` - Strings with length > 10
- `"palindromic strings that contain the first vowel"` - Palindromes starting with a vowel
- `"strings containing the letter z"` - Strings that contain 'z'

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "...",
      "value": "racecar",
      "properties": {...},
      "created_at": "..."
    }
  ],
  "count": 1,
  "interpreted_query": {
    "original": "all single word palindromic strings",
    "parsed_filters": {
      "word_count": 1,
      "is_palindrome": true
    }
  }
}
```

**Error Responses:**

400 Bad Request - Invalid or unrecognized query:
```json
{
  "message": "Unable to parse natural language query",
  "statusCode": 400
}
```

422 Unprocessable Entity - Conflicting filters:
```json
{
  "message": "Query parsed but resulted in conflicting filters",
  "statusCode": 422
}
```

### 6. Delete a String

**Request:**
```
DELETE /strings/hello
```

**Response (204 No Content):**
```
(empty body)
```

**Error Response (404 Not Found):**
```json
{
  "message": "String not found",
  "statusCode": 404
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK` - Successful GET request
- `201 Created` - String successfully uploaded
- `204 No Content` - String successfully deleted
- `400 Bad Request` - Missing or invalid parameters
- `404 Not Found` - String not found
- `409 Conflict` - String already exists
- `422 Unprocessable Entity` - Query has conflicting filters
- `500 Internal Server Error` - Server error

## Data Storage

Strings are persisted to a JSON file at `./data/strings.json`. The file is automatically created when you first upload a string.

## Project Structure

```
src/
├── modules/
│   └── strings/
│       ├── strings.controller.ts
│       ├── strings.service.ts
│       ├── DTO/
│       │   ├── upload-string.dto.ts
│       │   ├── get-string.dto.ts
│       │   └── get-string-filter.dto.ts
│       └── strings.module.ts
├── http/
│   └── http-config.module.ts
└── main.ts
```

## Example Usage

### cURL

Upload a string:
```bash
curl -X POST http://localhost:3000/strings \
  -H "Content-Type: application/json" \
  -d '{"value":"racecar"}'
```

Get all palindromes:
```bash
curl http://localhost:3000/strings/search?is_palindrome=true
```

Delete a string:
```bash
curl -X DELETE http://localhost:3000/strings/racecar
```

### JavaScript/Fetch

```javascript
// Upload
const res = await fetch('http://localhost:3000/strings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ value: 'hello' })
});

// Filter
const res = await fetch('http://localhost:3000/strings/search?is_palindrome=true');

// Delete
await fetch('http://localhost:3000/strings/hello', { method: 'DELETE' });
```

## License

MIT
