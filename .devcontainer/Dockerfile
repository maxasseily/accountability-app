# .devcontainer/Dockerfile
FROM node:20-bookworm

WORKDIR /workspace

# Optional: watchman improves React Native file watching
RUN apt-get update && \
    apt-get install -y watchman git && \
    rm -rf /var/lib/apt/lists/*

# Install Graphite CLI globally
RUN npm install -g @withgraphite/graphite-cli@stable

CMD ["bash"]
