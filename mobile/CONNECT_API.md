# Connecting the app to the FastAPI backend

## 1. Find your machine's LAN IP

On Windows (run in Git Bash or CMD):
```
ipconfig | findstr "IPv4"
```
Example result: `192.168.1.42`

## 2. Set the API URL

Edit `.env` (at the project root) and update:
```
EXPO_PUBLIC_API_URL=http://192.168.1.42:8000
```
Replace `192.168.1.42` with your actual IP. Your phone and computer must be on the **same Wi-Fi**.

## 3. Start the FastAPI backend

```bash
cd /c/Users/Charity/Documents/njangui
source venv/bin/activate          # or: venv\Scripts\activate on Windows
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

`--host 0.0.0.0` is critical — without it the API only listens on localhost and your phone can't reach it.

## 4. Start the Expo app

```bash
cd /c/Users/Charity/Documents/njangui-app
npx expo start --clear
```

Scan the QR code with Expo Go on your Android phone.

## 5. Backend endpoints expected

The service layer calls these FastAPI routes:

| Service | Endpoint |
|---------|----------|
| `sendOtp(phone)` | `POST /auth/send-otp` |
| `verifyOtp(phone, code)` | `POST /auth/verify-otp` → `{ access_token }` |
| `setPin(pin)` | `POST /auth/set-pin` |
| `verifyPin(pin)` | `POST /auth/verify-pin` |
| `getMe()` | `GET /auth/me` → `UserRead` |
| `listProviders(params)` | `GET /providers` |
| `getProvider(id)` | `GET /providers/:id` |
| `registerProvider(data)` | `POST /providers/register` |
| `listCategories()` | `GET /categories` |
| `listLocations()` | `GET /locations` |
| `initiateTransaction(data)` | `POST /transactions` |
| `listTransactions(params)` | `GET /transactions` |
| `confirmTransaction(id)` | `POST /transactions/:id/confirm` |
| `cancelTransaction(id)` | `POST /transactions/:id/cancel` |
| `rateTransaction(id, data)` | `POST /transactions/:id/rate` |

## 6. Graceful degradation

While the backend isn't ready, the app shows:
- Loading spinners on button press
- Alert dialogs with the API error message
- The transactions list screen shows an error banner with a "tap to retry" action

## 7. CORS

Make sure your FastAPI `main.py` has:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
