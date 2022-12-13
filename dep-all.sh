#!/bin/bash

echo "Start deploy"
nvm use 14
git pull origin master
yarn

cd ../dashboard
git pull origin main
yarn
npm run build
pm2 restart all
echo "Deploy end"