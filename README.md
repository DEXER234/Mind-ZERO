# MindZero File Manager

A simple, modern, **personal file manager** web app. Manage your files (upload, edit, save, download, delete) directly in your browser—**no backend or server required**. All files are stored locally in your browser's localStorage.

## Features

- 📁 Upload text/code files from your computer
- 📝 Edit files in a beautiful, responsive editor
- 💾 Save changes instantly (stored in your browser)
- ⬇️ Download files back to your computer
- 🗑️ Delete files you no longer need
- 🕹️ Rename your project title
- ⚡ Works offline (no internet required after first load)
- **Group Collaboration**:
  - Create or join groups.
  - Upload and share files with group members.
  - **Badges**: The group creator gets a green 'admin' badge next to their name. Other members get a blue 'team' badge.
  - **Kick Members**: The admin can remove (kick) other members from the group.
  - **File Comments/Notes**: Each group file has a comments section. All group members can add notes or comments per file. Comments show username, text, and timestamp.
- **Profile Customization**: Set your name, avatar, and info.
- **Modern UI**: Responsive, dark-themed interface with Tailwind CSS and FontAwesome icons.

## How It Works

- All files are stored in your browser's localStorage (under the key `myFiles`).
- No data is sent to any server. Your files are private and stay on your device.
- Works in all modern browsers (Chrome, Edge, Firefox, Safari).

## Getting Started

1. **Download or clone this repository.**
2. Open `admin/admin.html` in your web browser.
3. Start managing your files!

> **Note:** If you want to clear all files, clear your browser's localStorage for this site.

## File Structure

```
admin/
  ├── admin.html   # Main HTML file (open this in your browser)
  └── admin.js     # All file manager logic (local-only)
```

## Screenshots

*(Add your own screenshots here!)*

## License

MIT License. Free for personal and educational use.

## How to Use

1. **Start the Backend**
   - Run `node server/index.js` (requires Node.js).
2. **Open `index.html` in your browser**
   - Make sure the file starts with `<!DOCTYPE html>` to avoid quirks mode issues.
3. **Personal Files**
   - Use the left sidebar to upload and manage your own files.
4. **Groups**
   - Create or join a group from the sidebar.
   - Select a group to see the group files section.
   - Upload files to the group.
   - Add comments/notes to any group file.
   - See badges next to member names. Admins can kick members.

## Troubleshooting

- **Badges or Comments Not Showing?**
  - Make sure you are in the Group Files section (not just personal files).
  - Make sure your browser is loading the latest `admin.js` (do a hard refresh: `Ctrl+F5`).
  - Ensure your `index.html` starts with `<!DOCTYPE html>` (very first line).
  - Check the browser console for errors or missing script loads.
- **Script Not Loading?**
  - Confirm `<script src="admin.js"></script>` is at the end of your `index.html`.
  - `admin.js` must be in the same folder as `index.html`.

## Development Notes

- All group and file data is stored in memory on the backend (for demo/testing only).
- Comments and group membership are not persistent if the server restarts.

## Credits
- UI: Tailwind CSS, FontAwesome
- Syntax Highlighting: Prism.js

---
For any issues, please open an issue or contact the maintainer.
