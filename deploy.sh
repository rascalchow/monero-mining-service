#!/bin/bash

echo "Start deploy"
cd ~/nurseai
nvm use 9.11.1
git pull origin master
npm install 
pm2 restart server
echo "Deploy end"