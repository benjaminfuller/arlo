#!/bin/bash

# Usage: ./build-arlo.sh -n [CONTAINER NAME] -p [PORT]
set -e

while getopts n:p: flag
do
    case "${flag}" in
	n) name=${OPTARG};;
	p) port=${OPTARG};;
    esac
done

echo "Building container $name and running on ports $port-$((port + 1))"

docker stop $name || true
docker rm $name || true
docker rmi $name || true
docker build -f /root/arlo/Dockerfile-arlo.demo . -t $name
docker run -d --name $name -p $port:3000 -p $((port + 1)):3001 $name
