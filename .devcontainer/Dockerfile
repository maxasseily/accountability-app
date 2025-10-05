# .devcontainer/Dockerfile
FROM node:18-bullseye

WORKDIR /workspace

# Optional: watchman improves React Native file watching
RUN apt-get update && \
    apt-get install -y watchman git && \
    rm -rf /var/lib/apt/lists/*

CMD ["bash"]
