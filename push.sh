git add .
read -p "[*] Type Commit Message:" commit_message
echo "$commit_message"
git commit -m "$commit_message"
git push -u origin main
