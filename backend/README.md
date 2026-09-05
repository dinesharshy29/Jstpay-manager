# AI Risk Manager API

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Set Firebase Admin values in `.env` or your deployment secret manager. Never commit `.env` or service-account JSON.

For the AI assistant, configure the server environment only:

```bash
OPENROUTER_API_KEY=your-key
OPENROUTER_MODEL=your-model
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

Never use these values in `NEXT_PUBLIC_*` variables. The assistant returns an explicit configuration error until both the key and model are set.
