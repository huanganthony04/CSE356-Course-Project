# #!/bin/bash
ip6tables -I OUTPUT -p tcp -m tcp --dport 25 -j DROP
iptables -t nat -I OUTPUT -o ens3 -p tcp -m tcp --dport 25 -j DNAT --to-destination 130.245.136.123:11587

pm2 start startup.config.js

cd ./client
npm run build
serve -s dist -p 5173