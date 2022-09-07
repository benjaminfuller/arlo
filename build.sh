#!/bin/bash
set -e
docker stop  arlo-ben || true
docker rm arlo-ben || true
docker rmi arlodemo-ben || true
docker build -f /root/arlo/Dockerfile.demo . -t arlodemo-ben
docker run -d --name arlo-ben -p 3000:3000 -p 3001:3001 -p 8080:8080 arlodemo-ben
