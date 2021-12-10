#!/bin/bash
set -e
docker stop  noauth || true
docker rm noauth || true
docker rmi noauth || true
docker build -f /root/arlo/Dockerfile-nOauth.demo . -t noauth
docker run -d --name noauth -p 8080:8080 noauth
