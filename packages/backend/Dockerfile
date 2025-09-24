FROM oven/bun:1 as base

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y curl unzip procps

RUN apt-get update && apt-get install -y curl procps

RUN curl -L -o lightpanda "https://github.com/lightpanda-io/browser/releases/download/nightly/lightpanda-x86_64-linux"
RUN chmod a+x ./lightpanda
RUN mv lightpanda /usr/local/bin/

COPY package.json ./
RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "start"]

