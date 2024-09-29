git add .
current_datetime=$(date "+%Y-%m-%d %I:%M:%S %p")
commit_message="backup at $current_datetime"
echo "$commit_message"
git commit -m "$commit_message"
git push -u origin2
