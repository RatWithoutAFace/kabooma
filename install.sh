#!/bin/sh

if command -v node &>/dev/null; then
  echo "Node.js is already installed. Proceeding with Kabooma dependencies installation."
else
  echo "Node.js not found. Installing Node.js..."
  sudo apt update
  sudo apt install snapd
  sudo snap install node --classic 
fi
node --version
echo "-------------------------------------"
echo "Installed Node.js."
echo "Now installing Kabooma dependencies"
echo "-------------------------------------"
npm install

while true; do
    read -p "Do you wish to run this program? [Y/N] " yn
    case $yn in
        [Yy]* ) node index; break;;
        [Nn]* ) exit;;
        * ) echo "Please answer yes or no.";;
    esac
done
