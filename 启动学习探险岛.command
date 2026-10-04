#!/bin/bash
cd "$(dirname "$0")" || exit 1
server_status=$(curl -fsS http://127.0.0.1:4173/api/health 2>/dev/null)
if [[ "$server_status" == *'"app":"math-island"'* ]]; then
  echo '学习探险岛已经在运行：http://localhost:4173'
else
  node server.mjs
fi
