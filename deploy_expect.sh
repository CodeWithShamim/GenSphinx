#!/usr/bin/expect -f
set timeout 60
spawn npm run deploy
expect "Enter password to decrypt keystore:"
send "\r"
expect "Enter password to decrypt keystore:"
send "\r"
expect "Enter password to decrypt keystore:"
send "\r"
interact
