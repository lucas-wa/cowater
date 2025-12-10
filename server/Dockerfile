FROM python:3.11-slim-bookworm

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY service-account.json .

ENV GOOGLE_APPLICATION_CREDENTIALS="/app/service-account.json"

COPY app .

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port 8000 --reload"]