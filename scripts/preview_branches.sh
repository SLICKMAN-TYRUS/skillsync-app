#!/bin/bash
set -euo pipefail

cd /root/Desktop/skillsync-app
git fetch --all --prune
remotes=$(git for-each-ref --format='%(refname:short)' refs/remotes/origin | grep -v '^origin/HEAD$')
echo "Remotes: $remotes"

for r in $remotes; do
  name=${r#origin/}
  echo
  echo "==== $name ===="
  if git show-ref --verify --quiet refs/heads/$name; then
    git switch "$name"
  else
    git switch -c "$name" "$r"
  fi

  echo "On branch: $(git branch --show-current)"
  cd frontend
  rm -f /root/Desktop/skillsync-app/frontend_web.log
  echo "Starting server for $name..."
  npm run web > /root/Desktop/skillsync-app/frontend_web.log 2>&1 &
  pid=$!
  echo "Started (pid=$pid), waiting for compile..."

  compiled=0
  i=0
  while [ $i -lt 45 ]; do
    if grep -q "web compiled successfully" /root/Desktop/skillsync-app/frontend_web.log; then
      compiled=1
      break
    fi
    sleep 1
    i=$((i+1))
  done

  if [ $compiled -eq 1 ]; then
    echo "Compiled for $name. Saving head..."
    curl -sS http://127.0.0.1:19006 | sed -n '1,240p' > /tmp/${name}_head.html || true
    echo "Saved /tmp/${name}_head.html"
  else
    echo "Did not compile within timeout for $name. Saving log tail..."
    tail -n 200 /root/Desktop/skillsync-app/frontend_web.log > /tmp/${name}_log_tail.txt || true
    echo "Saved /tmp/${name}_log_tail.txt"
  fi

  echo "Stopping server (pkill)..."
  pkill -f 'node .*/node_modules/.bin/expo start' || true
  sleep 1
  cd /root/Desktop/skillsync-app
done

echo "ALL DONE"
