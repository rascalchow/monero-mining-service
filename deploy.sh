#!/bin/bash

echo "Start deploy"
cd ~/API
nvm use 16
git pull origin master
npm install 
pm2 restart server
echo "Deploy end"