ARG NODE_BASE_IMAGE_TAG=3.11
ARG NODE_VERSION=16

##############
### builder ##
##############
FROM node:${NODE_VERSION}-alpine${NODE_BASE_IMAGE_TAG} AS build-env
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

##############
### server  ##
##############
FROM node:${NODE_VERSION}-alpine${NODE_BASE_IMAGE_TAG} AS server
WORKDIR /app
COPY package.json ./
COPY --from=build-env /app/node_modules/ node_modules/

COPY package.json index.js server.js ./

CMD ["node", "server.js"]

###################
### Test image ####
###################
FROM node:${NODE_VERSION}-alpine${NODE_BASE_IMAGE_TAG} AS test-runner
WORKDIR /app
COPY package.json ./
COPY --from=build-env /app/node_modules/ node_modules/

# Add app files
COPY package.json index.js ./

# Copy test files
COPY tests/ ./tests
LABEL com.acast.ci.test-runner="true"

CMD ["npm", "run", "test"]
