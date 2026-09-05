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

For the NVIDIA NIM Risk Copilot, configure the server environment only:

```bash
NVIDIA_NIM_API_KEY=your-rotated-key
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_NIM_MODEL=nvidia/nemotron-3-ultra-550b-a55b
```

Never use these values in `NEXT_PUBLIC_*` variables or commit them to Git. The assistant returns an explicit configuration error until both the key and model are set. The key supplied in chat should be revoked and replaced before local testing.
