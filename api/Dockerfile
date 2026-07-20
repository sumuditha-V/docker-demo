# Start from a small official Node image. "alpine" = minimal Linux, ~5x smaller.
FROM node:22-alpine

# Every command after this runs inside /app in the image.
WORKDIR /app

# Copy ONLY the manifests first. Docker caches each step; if these two files
# haven't changed, it reuses the cached npm install instead of re-running it.
COPY package*.json ./

# "ci" (not "install") installs the exact versions from package-lock.json.
# --omit=dev skips devDependencies — smaller image, fewer vulnerabilities.
RUN npm ci --omit=dev

# Now copy the source. This layer changes on every code edit, which is exactly
# why it comes AFTER the install step.
COPY . .

# Documentation only — it does not publish the port. Compose does that.
EXPOSE 3000

# Note: "node server.js", not "npm start". Node then runs as PID 1 and
# receives SIGTERM directly, so the graceful shutdown in server.js works.
CMD ["node", "server.js"]
