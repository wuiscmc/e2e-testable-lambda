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
### dev ##
##############
FROM node:${NODE_VERSION}-alpine${NODE_BASE_IMAGE_TAG} AS dev
WORKDIR /app
COPY package.json ./
COPY --from=build-env /app/node_modules/ node_modules/

COPY .gitignore package.json index.js server.js ./

CMD ["node", "server.js"]

###################
### Test image ####
###################
FROM node:${NODE_VERSION}-alpine${NODE_BASE_IMAGE_TAG} AS test-runner
WORKDIR /app
COPY package.json ./
COPY --from=build-env /app/node_modules/ node_modules/

# Add app files
COPY .gitignore package.json index.js ./

# Copy test files
COPY tests/ ./tests
LABEL com.acast.ci.test-runner="true"

CMD ["npm", "run", "test"]
