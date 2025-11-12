FROM node:18.18.2

COPY app/package.json /code/app/package.json

COPY app/package-lock.json /code/app/package-lock.json

WORKDIR /code/app

RUN npm install

COPY app /code/app/

ARG VITE_API_URL

ENV VITE_API_URL=${VITE_API_URL}

RUN echo "VITE_API_URL=${VITE_API_URL}" >> /code/app/.env

RUN npm run build

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
