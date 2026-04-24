# Face Matching Server

Local Python service for attendance selfie verification using DeepFace.

## Setup

1. Create a virtual environment in `face_matching/`:

```bash
python -m venv .venv
```

2. Activate it:

Windows (PowerShell):

```bash
.venv\Scripts\Activate.ps1
```

Windows (CMD):

```bash
.venv\Scripts\activate.bat
```

macOS/Linux:

```bash
source .venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Start the Flask server:

```bash
python app.py
```

Optional (custom host/port):

```bash
HOST=127.0.0.1 PORT=8000 python app.py
```

PowerShell equivalent:

```bash
$env:HOST="127.0.0.1"; $env:PORT="8000"; python app.py
```

## Backend Configuration

Set this in the backend environment:

```bash
FACE_MATCHING_SERVER=http://127.0.0.1:8000
```

The Nitro backend posts to `POST /verify` with selfie/profile images as data URLs.

Health check endpoint:

```bash
GET /health
```
