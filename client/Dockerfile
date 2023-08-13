FROM node:18

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

USER nextjs
ENV NODE_ENV production
EXPOSE 3000
CMD ["yarn", "start"]
