document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const filesContainer = document.getElementById('files-container');
    const fileEditor = document.getElementById('file-editor');
    const saveBtn = document.getElementById('save-btn');
    const downloadBtn = document.getElementById('download-btn');
    const filenameDisplay = document.getElementById('filename-display');
    const lastModified = document.getElementById('last-modified');
    const modifiedBy = document.getElementById('modified-by');
    const projectTitle = document.getElementById('project-title');
    const fileSearch = document.getElementById('file-search');
    const editBtn = document.getElementById('edit-btn');
    const fileModeIndicator = document.getElementById('file-mode-indicator');
    const emptyState = document.getElementById('empty-state');
    const avatarInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarIcon = document.getElementById('avatar-icon');
    const userNameEl = document.getElementById('user-name');
    const userInfoEl = document.getElementById('user-info');
    const fileHighlight = document.getElementById('file-highlight');
    const fileHighlightCode = fileHighlight ? fileHighlight.querySelector('code') : null;
    const createGroupBtn = document.getElementById('create-group-btn');
    const joinGroupBtn = document.getElementById('join-group-btn');
    const createGroupBtnMobile = document.getElementById('create-group-btn-mobile');
    const joinGroupBtnMobile = document.getElementById('join-group-btn-mobile');
    const hidePreviewBtn = document.getElementById('hide-preview-btn');
    const showPreviewBtn = document.getElementById('show-preview-btn');

    // State variables
    let files = [];
    let currentFileIndex = -1;
    let isEdited = false;
    let projectName = "My Personal File Manager";
    const STORAGE_KEY = 'myFiles';
    const TITLE_KEY = 'myFileManagerTitle';
    let searchQuery = '';
    let isEditMode = false;
    const AVATAR_KEY = 'myFileManagerAvatar';
    const USER_NAME_KEY = 'myFileManagerUserName';
    const USER_INFO_KEY = 'myFileManagerUserInfo';
    const USERNAME_KEY = 'myFileManagerUsername';
    let previewHidden = false;

    // --- Local Storage Helpers ---
    function loadFiles() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            files = data ? JSON.parse(data) : [];
        } catch (e) {
            files = [];
        }
        updateFileList();
    }

    function saveFilesToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    }

    function loadProjectTitle() {
        const storedTitle = localStorage.getItem(TITLE_KEY);
        if (storedTitle && typeof storedTitle === 'string') {
            projectName = storedTitle;
            projectTitle.textContent = projectName;
        } else {
            projectTitle.textContent = projectName;
        }
    }

    function saveProjectTitle() {
        localStorage.setItem(TITLE_KEY, projectName);
    }

    // --- Username Prompt ---
    function getUsername() {
        let username = localStorage.getItem(USERNAME_KEY);
        if (!username) {
            username = prompt('Enter your username:');
            if (username && username.trim()) {
                username = username.trim();
                localStorage.setItem(USERNAME_KEY, username);
            } else {
                showNotification('Username is required!', 'error');
                return getUsername();
            }
        }
        return username;
    }

    // --- UI Logic ---
    function getPrismLanguage(extension) {
        const map = {
            'js': 'javascript', 'py': 'python', 'html': 'markup', 'css': 'css',
            'json': 'json', 'md': 'markdown', 'csv': 'none', 'xml': 'markup',
            'sql': 'sql', 'cpp': 'cpp', 'c': 'c', 'java': 'java',
            'php': 'php', 'txt': 'none'
        };
        return map[extension] || 'none';
    }

    function updateEditorState() {
        if (currentFileIndex < 0 || !files[currentFileIndex]) {
            fileEditor.value = '';
            fileEditor.disabled = true;
            filenameDisplay.textContent = 'Select a file to edit';
            saveBtn.disabled = true;
            downloadBtn.disabled = true;
            editBtn.disabled = true;
            isEditMode = false;
            if (fileHighlight) fileHighlight.style.display = 'none';
            if (fileEditor) fileEditor.style.display = 'none';
            if (hidePreviewBtn) hidePreviewBtn.style.display = 'none';
            if (showPreviewBtn) showPreviewBtn.style.display = 'none';
            previewHidden = false;
        } else {
            fileEditor.disabled = !isEditMode;
            editBtn.disabled = isEditMode;
            if (isEditMode) {
                if (fileHighlight) fileHighlight.style.display = 'none';
                if (fileEditor) fileEditor.style.display = 'flex';
                if (hidePreviewBtn) hidePreviewBtn.style.display = 'none';
                if (showPreviewBtn) showPreviewBtn.style.display = 'none';
                previewHidden = false;
            } else {
                if (fileHighlight && fileHighlightCode) {
                    const file = files[currentFileIndex];
                    const extension = file.name.split('.').pop().toLowerCase();
                    const lang = getPrismLanguage(extension);
                    fileHighlightCode.className = 'language-' + lang;
                    fileHighlightCode.textContent = file.content;
                    Prism.highlightElement(fileHighlightCode);
                    if (!previewHidden) {
                        fileHighlight.style.display = 'block';
                        if (hidePreviewBtn) hidePreviewBtn.style.display = 'block';
                        if (showPreviewBtn) showPreviewBtn.style.display = 'none';
                    } else {
                        fileHighlight.style.display = 'none';
                        if (hidePreviewBtn) hidePreviewBtn.style.display = 'none';
                        if (showPreviewBtn) showPreviewBtn.style.display = 'block';
                    }
                }
                if (fileEditor) fileEditor.style.display = 'none';
            }
        }
        updateFileModeIndicator();
    }

    function updateFileList() {
        filesContainer.innerHTML = '';
        let filteredFiles = files;
        if (searchQuery.trim() !== '') {
            const q = searchQuery.trim().toLowerCase();
            filteredFiles = files.filter(f => f.name.toLowerCase().includes(q));
        }
        if (filteredFiles.length === 0) {
            // Show empty state illustration
            if (emptyState) emptyState.classList.remove('hidden');
            currentFileIndex = -1;
            updateEditorState();
            return;
        } else {
            if (emptyState) emptyState.classList.add('hidden');
        }
        filteredFiles.forEach((file, index) => {
            // Find the real index in the files array
            const realIndex = files.indexOf(file);
            const fileItem = document.createElement('div');
            // Highlight recent files (last 5 minutes)
            let isRecent = false;
            if (file.lastModified) {
                const now = Date.now();
                const fileTime = new Date(file.lastModified).getTime();
                if (now - fileTime < 5 * 60 * 1000) {
                    isRecent = true;
                }
            }
            let fileItemClass = 'file-item flex items-center gap-4 px-4 min-h-14 justify-between cursor-pointer rounded-lg';
            if (isRecent) fileItemClass += ' ring-2 ring-[#06d6a0]';
            if (realIndex === currentFileIndex) fileItemClass += ' ring-2 ring-[#4f8cff]';
            fileItem.className = fileItemClass;
            fileItem.dataset.index = realIndex;
            // Get file extension for icon
            const extension = file.name.split('.').pop().toLowerCase();
            const icon = getFileIcon(extension);
            // Highlight match
            let displayName = file.name;
            if (searchQuery.trim() !== '') {
                const q = searchQuery.trim();
                const regex = new RegExp(`(${q})`, 'ig');
                displayName = file.name.replace(regex, '<span class="bg-[#4f8cff] text-white rounded px-1">$1</span>');
            }
            // File type badge
            const typeMap = {
                'js': {label: 'JS', color: '#facc15'},
                'py': {label: 'PY', color: '#38bdf8'},
                'html': {label: 'HTML', color: '#f472b6'},
                'css': {label: 'CSS', color: '#06d6a0'},
                'json': {label: 'JSON', color: '#a78bfa'},
                'md': {label: 'MD', color: '#fbbf24'},
                'csv': {label: 'CSV', color: '#f59e42'},
                'xml': {label: 'XML', color: '#818cf8'},
                'sql': {label: 'SQL', color: '#f87171'},
                'cpp': {label: 'C++', color: '#60a5fa'},
                'c': {label: 'C', color: '#f472b6'},
                'java': {label: 'JAVA', color: '#f59e42'},
                'php': {label: 'PHP', color: '#a78bfa'},
                'txt': {label: 'TXT', color: '#9cabba'}
            };
            let typeBadge = '';
            if (typeMap[extension]) {
                typeBadge = `<span class=\"ml-2 text-xs font-bold px-2 py-0.5 rounded\" style=\"background:${typeMap[extension].color};color:#181c23;\">${typeMap[extension].label}</span>`;
            }
            // Show green tick for valid file types
            const validExtensions = Object.keys(typeMap);
            let greenTick = '';
            if (validExtensions.includes(extension)) {
                greenTick = '<i class=\"fas fa-check-circle text-[#06d6a0] ml-2\"></i>';
            }
            // Format upload date
            let uploadDate = '';
            let fileSize = '';
            if (file.lastModified) {
                const { relative, full } = timeAgo(file.lastModified);
                uploadDate = `<span class=\"text-xs text-[#9cabba] bg-[#232a36] rounded px-2 py-0.5 whitespace-nowrap\">${relative} (${full})</span>`;
            }
            // File size (human readable)
            if (typeof file.content === 'string') {
                const bytes = new Blob([file.content]).size;
                let size = bytes;
                let unit = 'B';
                if (bytes > 1024 * 1024) {
                    size = (bytes / (1024 * 1024)).toFixed(2);
                    unit = 'MB';
                } else if (bytes > 1024) {
                    size = (bytes / 1024).toFixed(2);
                    unit = 'KB';
                }
                fileSize = `<span class=\"ml-2 text-xs text-[#9cabba] bg-[#232a36] rounded px-2 py-0.5 whitespace-nowrap\">${size} ${unit}</span>`;
            }
            fileItem.innerHTML = `
                <div class=\"flex flex-col flex-1 min-w-0\">
                    <div class=\"flex items-center gap-3 min-w-0\">
                        <i class=\"${icon} text-[#9cabba]\"></i>
                        <span class=\"text-white text-base font-normal leading-normal flex-1 truncate\">${displayName}${typeBadge}${greenTick}</span>
                    </div>
                    <div class=\"flex flex-wrap mt-1\">${uploadDate}${fileSize}</div>
                </div>
                <div class=\"shrink-0 flex gap-2\">
                    <div class=\"text-[#9cabba] hover:text-white flex size-7 items-center justify-center download-btn\" title=\"Download\">
                        <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20px\" height=\"20px\" fill=\"currentColor\" viewBox=\"0 0 256 256\">
                            <path d=\"M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,132.69V40a8,8,0,0,0-16,0v92.69L93.66,106.34a8,8,0,0,0-11.32,11.32Z\"></path>
                        </svg>
                    </div>
                    <div class=\"text-[#38bdf8] hover:text-[#06d6a0] flex size-7 items-center justify-center share-btn cursor-pointer\" title=\"Share\">
                        <i class=\"fas fa-share-nodes\"></i>
                    </div>
                    <div class=\"text-[#e57373] hover:text-red-500 flex size-7 items-center justify-center delete-btn cursor-pointer\" title=\"Delete\">
                        <i class=\"fas fa-trash\"></i>
                    </div>
                </div>
            `;
            // Download
            fileItem.querySelector('.download-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                downloadFile(realIndex);
            });
            // Share
            fileItem.querySelector('.share-btn').addEventListener('click', async (e) => {
                e.stopPropagation();
                const file = files[realIndex];
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: file.name,
                            text: file.content,
                        });
                        showNotification('File shared!', 'success');
                    } catch (err) {
                        showNotification('Share cancelled or failed', 'error');
                    }
                } else if (navigator.clipboard) {
                    try {
                        await navigator.clipboard.writeText(file.content);
                        showNotification('File content copied to clipboard!', 'success');
                    } catch (err) {
                        showNotification('Failed to copy to clipboard', 'error');
                    }
                } else {
                    showNotification('Sharing not supported on this browser', 'error');
                }
            });
            // Delete
            fileItem.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Delete "${file.name}"? This cannot be undone.`)) {
                    deleteFile(realIndex);
                }
            });
            // Select file
            fileItem.addEventListener('click', () => {
                handleFileSelection(realIndex);
            });
            filesContainer.appendChild(fileItem);
        });
        updateEditorState();
    }

    function getFileIcon(extension) {
        const iconMap = {
            'txt': 'far fa-file-alt',
            'py': 'fab fa-python',
            'js': 'fab fa-js',
            'html': 'fab fa-html5',
            'css': 'fab fa-css3-alt',
            'cpp': 'fas fa-file-code',
            'c': 'fas fa-file-code',
            'java': 'fab fa-java',
            'php': 'fab fa-php',
            'json': 'fas fa-code',
            'md': 'fas fa-markdown',
            'csv': 'fas fa-file-csv',
            'xml': 'fas fa-file-code',
            'sql': 'fas fa-database'
        };
        return iconMap[extension] || 'far fa-file';
    }

    function handleFileUpload(event) {
        const uploadedFiles = Array.from(event.target.files);
        if (uploadedFiles.length === 0) return;
        uploadedFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(evt) {
                const content = evt.target.result;
                files.push({
                    name: file.name,
                    content: content,
                    lastModified: new Date().toISOString(),
                    modifiedBy: "You"
                });
                saveFilesToStorage();
                updateFileList();
                showNotification(`File "${file.name}" uploaded!`, 'success');
            };
            reader.onerror = function() {
                showNotification('Error reading file', 'error');
            };
            reader.readAsText(file);
        });
        fileInput.value = '';
    }

    function handleFileSelection(index) {
        if (index === currentFileIndex) return;
        if (isEdited && currentFileIndex >= 0) {
            if (!confirm('You have unsaved changes. Continue without saving?')) {
                return;
            }
        }
        currentFileIndex = index;
        isEdited = false;
        isEditMode = false;
        updateFileList();
        // Load file content into editor
        const selectedFile = files[currentFileIndex];
        fileEditor.value = selectedFile.content;
        filenameDisplay.textContent = selectedFile.name;
        // Update buttons
        saveBtn.disabled = true;
        downloadBtn.disabled = false;
        editBtn.disabled = false;
        fileEditor.disabled = true;
        // Update status
        const { relative, full } = timeAgo(selectedFile.lastModified);
        lastModified.textContent = `Last modified: ${relative} (${full})`;
        modifiedBy.textContent = `By: ${selectedFile.modifiedBy}`;
        updateFileModeIndicator();
    }

    function saveCurrentFile() {
        if (currentFileIndex < 0) return;
        const file = files[currentFileIndex];
        file.content = fileEditor.value;
        const nowISO = new Date().toISOString();
        file.lastModified = nowISO;
        file.modifiedBy = "You";
        saveFilesToStorage();
        isEdited = false;
        saveBtn.disabled = true;
        const { relative, full } = timeAgo(nowISO);
        lastModified.textContent = `Last modified: ${relative} (${full})`;
        modifiedBy.textContent = `By: You`;
        updateFileList();
        showNotification('File saved!', 'success');
        // Return to view-only mode
        isEditMode = false;
        fileEditor.disabled = true;
        editBtn.disabled = false;
        updateEditorState();
        updateFileModeIndicator();
    }

    function deleteFile(index) {
        files.splice(index, 1);
        saveFilesToStorage();
        if (currentFileIndex === index) {
            currentFileIndex = -1;
        } else if (currentFileIndex > index) {
            currentFileIndex--;
        }
        updateFileList();
        showNotification('File deleted!', 'success');
    }

    function downloadFile(index) {
        const file = files[index];
        const blob = new Blob([file.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // --- Notification System ---
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            info: 'bg-blue-500 text-white',
            warning: 'bg-yellow-500 text-black'
        };
        notification.className += ` ${colors[type] || colors.info}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // --- Main UI Enable/Disable ---
    uploadBtn.disabled = false;
    saveBtn.disabled = true;
    downloadBtn.disabled = true;
    fileEditor.disabled = true;
    editBtn.disabled = true;

    // --- File/Editor Event Listeners ---
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    fileEditor.addEventListener('input', () => {
        isEdited = true;
        saveBtn.disabled = false;
    });
    saveBtn.addEventListener('click', saveCurrentFile);
    downloadBtn.addEventListener('click', () => {
        if (currentFileIndex >= 0) downloadFile(currentFileIndex);
    });
    editBtn.addEventListener('click', () => {
        if (currentFileIndex < 0) return;
        isEditMode = true;
        fileEditor.disabled = false;
        editBtn.disabled = true;
        saveBtn.disabled = false;
        fileEditor.focus();
        updateEditorState();
        updateFileModeIndicator();
    });

    // --- Project Title Editing ---
    projectTitle.addEventListener('click', () => {
        const newName = prompt("Enter new project name:", projectName);
        if (newName && newName.trim() !== "" && newName !== projectName) {
            projectName = newName.trim();
            projectTitle.textContent = projectName;
            saveProjectTitle();
        }
    });

    // --- Search Functionality ---
    if (fileSearch) {
        fileSearch.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            updateFileList();
        });
    }

    // --- Profile Customization ---
    function loadProfileData() {
        const savedAvatar = localStorage.getItem(AVATAR_KEY);
        if (savedAvatar) {
            avatarPreview.style.backgroundImage = `url(${savedAvatar})`;
            if (avatarIcon) avatarIcon.style.display = 'none';
        }
        const savedUserName = localStorage.getItem(USER_NAME_KEY);
        userNameEl.textContent = savedUserName || '(click to enter your name)';
        
        const savedUserInfo = localStorage.getItem(USER_INFO_KEY);
        userInfoEl.textContent = savedUserInfo || '(click to enter your info)';
    }

    if (avatarPreview) {
        avatarPreview.addEventListener('click', () => avatarInput.click());
    }
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const dataUrl = evt.target.result;
                    localStorage.setItem(AVATAR_KEY, dataUrl);
                    avatarPreview.style.backgroundImage = `url(${dataUrl})`;
                    if (avatarIcon) avatarIcon.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    if (userNameEl) {
        userNameEl.addEventListener('click', () => {
            const currentName = localStorage.getItem(USER_NAME_KEY) || '';
            const newName = prompt("Enter your name:", currentName);
            if (newName && newName.trim()) {
                const finalName = newName.trim();
                userNameEl.textContent = finalName;
                localStorage.setItem(USER_NAME_KEY, finalName);
            } else if (newName === '') {
                userNameEl.textContent = '(click to enter your name)';
                localStorage.removeItem(USER_NAME_KEY);
            }
        });
    }
    if (userInfoEl) {
        userInfoEl.addEventListener('click', () => {
            const currentInfo = localStorage.getItem(USER_INFO_KEY) || '';
            const newInfo = prompt("Enter your role/info:", currentInfo);
            if (newInfo && newInfo.trim()) {
                const finalInfo = newInfo.trim();
                userInfoEl.textContent = finalInfo;
                localStorage.setItem(USER_INFO_KEY, finalInfo);
            } else if (newInfo === '') {
                userInfoEl.textContent = '(click to enter your info)';
                localStorage.removeItem(USER_INFO_KEY);
            }
        });
    }

    // --- Initial Data Load ---
    loadFiles();
    loadProjectTitle();
    loadProfileData();
    getUsername();

    function updateFileModeIndicator() {
        if (!fileModeIndicator) return;
        if (isEditMode) {
            fileModeIndicator.innerHTML = '<i class="fas fa-edit text-[#06d6a0]"></i> <span class="text-xs font-semibold text-[#06d6a0]">EDIT MODE</span>';
        } else {
            fileModeIndicator.innerHTML = '<i class="fas fa-eye text-[#4f8cff]"></i> <span class="text-xs font-semibold text-[#4f8cff]">VIEW MODE</span>';
        }
    }

    function timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

        let relativeTime;
        if (seconds < 5) {
            relativeTime = "just now";
        } else {
            const minute = 60;
            const hour = minute * 60;
            const day = hour * 24;
            const month = day * 30; // Approximation
            const year = day * 365;

            if (seconds < minute) {
                relativeTime = `${seconds} seconds ago`;
            } else if (seconds < hour) {
                const minutes = Math.round(seconds / minute);
                relativeTime = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            } else if (seconds < day) {
                const hours = Math.round(seconds / hour);
                relativeTime = `${hours} hour${hours > 1 ? 's' : ''} ago`;
            } else if (seconds < month) {
                const days = Math.round(seconds / day);
                relativeTime = `${days} day${days > 1 ? 's' : ''} ago`;
            } else if (seconds < year) {
                const months = Math.round(seconds/month);
                relativeTime = `${months} month${months > 1 ? 's' : ''} ago`;
            } else {
                const years = Math.round(seconds/year);
                relativeTime = `${years} year${years > 1 ? 's' : ''} ago`;
            }
        }
        return { relative: relativeTime, full: date.toLocaleString() };
    }

    // --- Group Modal and API Logic ---
    // Modal elements
    const createGroupModal = document.getElementById('create-group-modal');
    const joinGroupModal = document.getElementById('join-group-modal');
    const createGroupCancel = document.getElementById('create-group-cancel');
    const joinGroupCancel = document.getElementById('join-group-cancel');
    const createGroupConfirm = document.getElementById('create-group-confirm');
    const joinGroupConfirm = document.getElementById('join-group-confirm');
    const createGroupName = document.getElementById('create-group-name');
    const joinGroupCode = document.getElementById('join-group-code');
    const createGroupResult = document.getElementById('create-group-result');
    const joinGroupResult = document.getElementById('join-group-result');
    const groupList = document.getElementById('group-list');

    // Open modals
    function openModal(modal) { modal.classList.remove('hidden'); }
    function closeModal(modal) { modal.classList.add('hidden'); }

    if (createGroupBtn) createGroupBtn.onclick = () => { createGroupName.value = ''; createGroupResult.textContent = ''; openModal(createGroupModal); };
    if (joinGroupBtn) joinGroupBtn.onclick = () => { joinGroupCode.value = ''; joinGroupResult.textContent = ''; openModal(joinGroupModal); };
    if (createGroupBtnMobile) createGroupBtnMobile.onclick = () => { createGroupName.value = ''; createGroupResult.textContent = ''; openModal(createGroupModal); };
    if (joinGroupBtnMobile) joinGroupBtnMobile.onclick = () => { joinGroupCode.value = ''; joinGroupResult.textContent = ''; openModal(joinGroupModal); };
    if (createGroupCancel) createGroupCancel.onclick = () => closeModal(createGroupModal);
    if (joinGroupCancel) joinGroupCancel.onclick = () => closeModal(joinGroupModal);

    // API base
    const API_BASE = 'https://mind-zero.onrender.com/api/groups';

    // Create Group
    if (createGroupConfirm) createGroupConfirm.onclick = async () => {
        const groupName = createGroupName.value.trim();
        const username = getUsername();
        if (!groupName) {
            createGroupResult.textContent = 'Group name required.';
            return;
        }
        createGroupResult.textContent = 'Creating...';
        try {
            const res = await fetch(`${API_BASE}/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupName, username })
            });
            const data = await res.json();
            if (res.ok) {
                createGroupResult.textContent = `Group created! Code: ${data.code}`;
                await fetchAndRenderGroups();
            } else {
                createGroupResult.textContent = data.error || 'Error creating group.';
            }
        } catch (e) {
            createGroupResult.textContent = 'Network error.';
        }
    };

    // Join Group
    if (joinGroupConfirm) joinGroupConfirm.onclick = async () => {
        const code = joinGroupCode.value.trim().toUpperCase();
        const username = getUsername();
        if (!code) {
            joinGroupResult.textContent = 'Group code required.';
            return;
        }
        joinGroupResult.textContent = 'Joining...';
        try {
            const res = await fetch(`${API_BASE}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, username })
            });
            const data = await res.json();
            if (res.ok) {
                joinGroupResult.textContent = `Joined group: ${data.group.name}`;
                await fetchAndRenderGroups();
            } else {
                joinGroupResult.textContent = data.error || 'Error joining group.';
            }
        } catch (e) {
            joinGroupResult.textContent = 'Network error.';
        }
    };

    // Fetch and render group list
    async function fetchAndRenderGroups() {
        const username = getUsername();
        if (!groupList) return;
        groupList.innerHTML = '<div class="text-[#9cabba]">Loading...</div>';
        try {
            const res = await fetch(`${API_BASE}/list?username=${encodeURIComponent(username)}`);
            const data = await res.json();
            if (res.ok && data.groups && data.groups.length > 0) {
                groupList.innerHTML = '';
                data.groups.forEach(group => {
                    const div = document.createElement('div');
                    div.className = 'flex items-center justify-between bg-[#232a36] rounded px-3 py-2 cursor-pointer hover:bg-[#283039]';
                    div.innerHTML = `<span class="text-white font-medium">${group.name}</span><span class="text-[#9cabba] text-xs ml-2">${group.code}</span><button class="leave-group-btn bg-[#e57373] hover:bg-red-500 text-white rounded px-2 py-1 ml-2 text-xs" data-code="${group.code}">Leave</button>`;
                    div.addEventListener('click', (e) => {
                        // Only select if not clicking the leave button
                        if (!e.target.classList.contains('leave-group-btn')) {
                            selectGroup(group.code);
                        }
                    });
                    groupList.appendChild(div);
                });
                // Add leave group listeners
                groupList.querySelectorAll('.leave-group-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const code = btn.getAttribute('data-code');
                        await leaveGroup(code);
                        deselectGroup();
                    });
                });
            } else {
                groupList.innerHTML = '<div class="text-[#9cabba]">No groups yet.</div>';
                deselectGroup();
            }
        } catch (e) {
            groupList.innerHTML = '<div class="text-[#e57373]">Error loading groups.</div>';
            deselectGroup();
        }
    }
    // Leave group
    async function leaveGroup(code) {
        const username = getUsername();
        try {
            await fetch(`${API_BASE}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, username })
            });
            await fetchAndRenderGroups();
        } catch (e) {
            showNotification('Error leaving group', 'error');
        }
    }
    // Initial group list load
    fetchAndRenderGroups();

    // Hamburger menu logic
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const desktopNav = document.getElementById('desktop-nav');
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('hidden');
        });
        // Hide menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileNav.classList.add('hidden');
            }
        });
    }
    // Mobile group buttons
    if (createGroupBtnMobile) {
        createGroupBtnMobile.addEventListener('click', () => {
            showNotification('Create Group clicked!', 'info');
        });
    }
    if (joinGroupBtnMobile) {
        joinGroupBtnMobile.addEventListener('click', () => {
            showNotification('Join Group clicked!', 'info');
        });
    }
    // Optionally, sync profile info/avatar for mobile (not required for demo)

    // --- Group File Sharing Logic ---
    const groupFilesSection = document.getElementById('group-files-section');
    const groupFilesList = document.getElementById('group-files-list');
    const groupFilesMessage = document.getElementById('group-files-message');
    const groupFileUploadForm = document.getElementById('group-file-upload-form');
    const groupFileInput = document.getElementById('group-file-input');
    const groupFileDrop = document.getElementById('group-file-drop');
    const groupFileSelected = document.getElementById('group-file-selected');
    const groupFileUploadFeedback = document.getElementById('group-file-upload-feedback');
    const groupNewFolderName = document.getElementById('group-new-folder-name');
    const groupCreateFolderBtn = document.getElementById('group-create-folder-btn');
    const groupFolderFeedback = document.getElementById('group-folder-feedback');
    const groupFolderSelect = document.getElementById('group-folder-select');
    const groupFolderUploadInput = document.getElementById('group-folder-upload-input');
    const groupFolderUploadBtn = document.getElementById('group-folder-upload-btn');
    const groupFolderUploadSelected = document.getElementById('group-folder-upload-selected');
    let selectedGroupCode = null;
    let groupFolders = [];

    function loadGroupFolders() {
        // Load folders from localStorage (per group) or initialize
        if (!selectedGroupCode) return;
        const key = `groupFolders_${selectedGroupCode}`;
        const data = localStorage.getItem(key);
        groupFolders = data ? JSON.parse(data) : [];
        renderGroupFolderSelect();
    }

    function saveGroupFolders() {
        if (!selectedGroupCode) return;
        const key = `groupFolders_${selectedGroupCode}`;
        localStorage.setItem(key, JSON.stringify(groupFolders));
    }

    function renderGroupFolderSelect() {
        if (!groupFolderSelect) return;
        groupFolderSelect.innerHTML = '<option value="">(No Folder)</option>';
        groupFolders.forEach(folder => {
            const opt = document.createElement('option');
            opt.value = folder;
            opt.textContent = folder;
            groupFolderSelect.appendChild(opt);
        });
    }

    if (groupCreateFolderBtn) {
        groupCreateFolderBtn.addEventListener('click', () => {
            const name = groupNewFolderName.value.trim();
            if (!name) {
                groupFolderFeedback.textContent = 'Folder name required.';
                return;
            }
            if (groupFolders.includes(name)) {
                groupFolderFeedback.textContent = 'Folder already exists.';
                return;
            }
            groupFolders.push(name);
            saveGroupFolders();
            renderGroupFolderSelect();
            groupNewFolderName.value = '';
            groupFolderFeedback.textContent = 'Folder created!';
            setTimeout(() => groupFolderFeedback.textContent = '', 1500);
        });
    }

    if (groupFolderSelect) {
        groupFolderSelect.addEventListener('change', () => {
            // Optionally, update UI or feedback
        });
    }

    if (groupFolderUploadBtn && groupFolderUploadInput) {
        groupFolderUploadBtn.addEventListener('click', () => {
            groupFolderUploadInput.click();
        });
        groupFolderUploadInput.addEventListener('change', () => {
            if (groupFolderUploadInput.files.length) {
                groupFolderUploadSelected.textContent = `${groupFolderUploadInput.files.length} files selected from folder.`;
            } else {
                groupFolderUploadSelected.textContent = '';
            }
        });
    }

    // Drag-and-drop for file upload
    if (groupFileDrop && groupFileInput) {
        groupFileDrop.addEventListener('dragover', e => {
            e.preventDefault();
            groupFileDrop.classList.add('bg-[#181c23]');
        });
        groupFileDrop.addEventListener('dragleave', e => {
            e.preventDefault();
            groupFileDrop.classList.remove('bg-[#181c23]');
        });
        groupFileDrop.addEventListener('drop', e => {
            e.preventDefault();
            groupFileDrop.classList.remove('bg-[#181c23]');
            if (e.dataTransfer.files.length) {
                groupFileInput.files = e.dataTransfer.files;
                showSelectedFileName();
            }
        });
        groupFileInput.addEventListener('change', showSelectedFileName);
        function showSelectedFileName() {
            if (groupFileInput.files.length) {
                groupFileSelected.textContent = groupFileInput.files[0].name;
            } else {
                groupFileSelected.textContent = '';
            }
        }
    }

    // Show files section when a group is selected
    function selectGroup(code) {
        selectedGroupCode = code;
        if (groupFilesSection) groupFilesSection.classList.remove('hidden');
        loadGroupFolders();
        fetchAndRenderGroupFiles();
    }
    // Hide files section
    function deselectGroup() {
        selectedGroupCode = null;
        if (groupFilesSection) groupFilesSection.classList.add('hidden');
        groupFolders = [];
        renderGroupFolderSelect();
    }
    // Fetch and render files for selected group
    async function fetchAndRenderGroupFiles() {
        if (!selectedGroupCode) return;
        // Fetch group info (members)
        let groupInfo = null;
        try {
            const res = await fetch(`${API_BASE}/list?username=${encodeURIComponent(getUsername())}`);
            const data = await res.json();
            if (res.ok && data.groups) {
                groupInfo = data.groups.find(g => g.code === selectedGroupCode);
            }
        } catch (e) {}
        // Render group member info
        const groupMembersDiv = document.getElementById('group-members-info');
        if (groupMembersDiv && groupInfo) {
            // The creator is the first member in the array
            const creator = groupInfo.members[0];
            const currentUser = getUsername();
            groupMembersDiv.innerHTML = `<span class='text-[#4f8cff] font-semibold'>Members (${groupInfo.members.length}):</span> <span class='text-[#9cabba] text-xs'>${groupInfo.members.map(m => {
                if (m === creator) {
                    return `<span class='bg-[#232a36] rounded px-2 py-1 mr-1 flex items-center gap-1'>${m} <span class="ml-1 text-xs font-bold" style="color:#06d6a0;">admin</span></span>`;
                } else {
                    // Show kick button only if current user is admin
                    let kickBtn = '';
                    if (currentUser === creator) {
                        kickBtn = `<button class='kick-member-btn ml-2 bg-[#e57373] hover:bg-red-500 text-white rounded px-2 py-0.5 text-xs' data-member='${m}'>Kick</button>`;
                    }
                    return `<span class='bg-[#232a36] rounded px-2 py-1 mr-1 flex items-center gap-1'>${m} <span class=\"ml-1 text-xs font-bold\" style=\"color:#4f8cff;\">team</span>${kickBtn}</span>`;
                }
            }).join('')}</span>`;
            // Add event listeners for kick buttons
            if (currentUser === creator) {
                groupMembersDiv.querySelectorAll('.kick-member-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const member = btn.getAttribute('data-member');
                        if (member && confirm(`Kick ${member} from the group?`)) {
                            try {
                                const res = await fetch(`${API_BASE}/kick`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ code: selectedGroupCode, member, requester: currentUser })
                                });
                                if (res.ok) {
                                    fetchAndRenderGroupFiles();
                                    showNotification(`${member} has been kicked out.`, 'success');
                                } else {
                                    showNotification('Failed to kick member.', 'error');
                                }
                            } catch (e) {
                                showNotification('Network error.', 'error');
                            }
                        }
                    });
                });
            }
        } else if (groupMembersDiv) {
            groupMembersDiv.innerHTML = '';
        }
        groupFilesList.innerHTML = '<div class="text-[#9cabba]">Loading...</div>';
        groupFilesMessage.textContent = '';
        try {
            const res = await fetch(`${API_BASE}/${selectedGroupCode}/files`);
            const data = await res.json();
            if (res.ok && data.files && data.files.length > 0) {
                // --- Build a nested folder tree ---
                function buildTree(files) {
                    const root = {};
                    files.forEach(file => {
                        const parts = (file.folder || '').split('/').filter(Boolean);
                        let node = root;
                        for (const part of parts) {
                            if (!node[part]) node[part] = { _isFolder: true, _children: {} };
                            node = node[part]._children;
                        }
                        if (!node._files) node._files = [];
                        node._files.push(file);
                    });
                    return root;
                }
                // --- Render the tree as HTML ---
                function renderTree(node, parentPath = '') {
                    let html = '';
                    for (const key in node) {
                        if (key === '_files') continue;
                        if (node[key]._isFolder) {
                            const folderId = `folder-${parentPath.replace(/\//g, '-')}-${key}`;
                            html += `<div class="ml-2">
                                <div class="flex items-center cursor-pointer folder-toggle" data-folder-id="${folderId}">
                                    <i class="fas fa-folder mr-2 text-[#fbbf24]"></i>
                                    <span class="text-[#fbbf24] font-bold">${key}</span>
                                    <i class="fas fa-chevron-down ml-1 text-xs transition-transform"></i>
                                </div>
                                <div class="folder-children" id="${folderId}" style="display:none;">
                                    ${renderTree(node[key]._children, parentPath ? parentPath + '/' + key : key)}
                                </div>
                            </div>`;
                        }
                    }
                    // Render files at this level
                    if (node._files) {
                        node._files.forEach(file => {
                            html += renderFileItem(file);
                        });
                    }
                    return html;
                }
                // --- Render a file item ---
                function renderFileItem(file) {
                    // File preview logic
                    let preview = '';
                    const ext = file.originalname.split('.').pop().toLowerCase();
                    if (["png","jpg","jpeg","gif","bmp","webp"].includes(ext)) {
                        preview = `<img src="${API_BASE}/${selectedGroupCode}/files/${file.filename}" alt="preview" class="max-h-32 max-w-xs rounded mb-2" />`;
                    } else if (["pdf"].includes(ext)) {
                        preview = `<button class='show-preview-btn bg-[#4f8cff] text-white rounded px-2 py-1 text-xs mb-2 w-fit' data-filename='${file.filename}'>Show Preview</button><div class='file-preview-content hidden mb-2'><embed src='${API_BASE}/${selectedGroupCode}/files/${file.filename}' type='application/pdf' width='100%' height='400px' class='rounded' /></div>`;
                    } else if (["txt","md","json","js","py","html","css","csv","xml","log","conf","sh","bat","ini","yml","yaml","ts","c","cpp","java","php","rb","go","rs","pl","swift","kt","scala"].includes(ext)) {
                        preview = `<button class='show-preview-btn bg-[#4f8cff] text-white rounded px-2 py-1 text-xs mb-2 w-fit' data-filename='${file.filename}'>Show Preview</button><pre class='file-preview-content hidden bg-[#181c23] text-white rounded p-2 mb-2 text-xs overflow-x-auto'></pre>`;
                    }
                    // Format upload date/time (always show, fallback if missing)
                    let uploadDate = '';
                    if (file.uploadDate) {
                        const d = new Date(file.uploadDate);
                        uploadDate = d.toLocaleString();
                    } else {
                        uploadDate = '';
                    }
                    // Comments section placeholder
                    const commentsSectionId = `comments-section-${file.filename.replace(/[^a-zA-Z0-9]/g, '')}`;
                    return `<div class='flex flex-col bg-[#232a36] rounded px-3 py-2 mb-2 ml-6'>
                        <div class='flex items-center justify-between'>
                            <div class="flex flex-col">
                                <span class="text-white font-normal">${file.originalname}</span>
                                <span class="text-xs text-[#9cabba] mt-1">Uploaded by <span class="font-semibold text-[#4f8cff]">${file.uploader || 'Unknown'}</span> on <span class="font-semibold">${uploadDate}</span></span>
                            </div>
                            <span class="text-[#9cabba] text-xs ml-2">${(file.size/1024).toFixed(1)} KB</span>
                            <div class='flex gap-2'>
                                <button class="download-group-file-btn bg-[#38bdf8] hover:bg-[#06d6a0] text-black rounded px-2 py-1 text-xs" data-filename="${file.filename}">Download</button>
                                <button class="delete-group-file-btn bg-[#e57373] hover:bg-red-500 text-white rounded px-2 py-1 text-xs" data-filename="${file.filename}">Delete</button>
                            </div>
                        </div>
                        ${preview}
                        <div id="${commentsSectionId}" class="mt-2 bg-[#181c23] rounded p-2"></div>
                    </div>`;
                }
                // --- Render the tree ---
                const tree = buildTree(data.files);
                groupFilesList.innerHTML = renderTree(tree);
                // --- Folder expand/collapse logic ---
                groupFilesList.querySelectorAll('.folder-toggle').forEach(toggle => {
                    toggle.addEventListener('click', function() {
                        const folderId = this.getAttribute('data-folder-id');
                        const children = document.getElementById(folderId);
                        if (children) {
                            const icon = this.querySelector('.fa-chevron-down');
                            if (children.style.display === 'none') {
                                children.style.display = 'block';
                                if (icon) icon.style.transform = 'rotate(180deg)';
                            } else {
                                children.style.display = 'none';
                                if (icon) icon.style.transform = 'rotate(0deg)';
                            }
                        }
                    });
                });
                // --- File actions (download, delete, preview, comments) ---
                groupFilesList.querySelectorAll('.download-group-file-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const filename = btn.getAttribute('data-filename');
                        window.open(`${API_BASE}/${selectedGroupCode}/files/${filename}`);
                    });
                });
                groupFilesList.querySelectorAll('.delete-group-file-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const filename = btn.getAttribute('data-filename');
                        if (confirm('Delete this file?')) {
                            try {
                                const res = await fetch(`${API_BASE}/${selectedGroupCode}/files/${filename}`, { method: 'DELETE' });
                                if (res.ok) {
                                    fetchAndRenderGroupFiles();
                                } else {
                                    groupFilesMessage.textContent = 'Delete failed.';
                                }
                            } catch (e) {
                                groupFilesMessage.textContent = 'Network error.';
                            }
                        }
                    });
                });
                groupFilesList.querySelectorAll('.show-preview-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const filename = btn.getAttribute('data-filename');
                        const previewContainer = btn.nextElementSibling;
                        if (previewContainer.classList.contains('hidden')) {
                            if (previewContainer.tagName === 'PRE') {
                                previewContainer.textContent = 'Loading...';
                                try {
                                    const res = await fetch(`${API_BASE}/${selectedGroupCode}/files/${filename}`);
                                    if (res.ok) {
                                        const text = await res.text();
                                        previewContainer.textContent = text.slice(0, 2000) + (text.length > 2000 ? '\n... (truncated)' : '');
                                    } else {
                                        previewContainer.textContent = 'Preview failed.';
                                    }
                                } catch (e) {
                                    previewContainer.textContent = 'Network error.';
                                }
                            }
                            previewContainer.classList.remove('hidden');
                        } else {
                            previewContainer.classList.add('hidden');
                        }
                    });
                });
                // --- Comments section ---
                data.files.forEach(file => {
                    const commentsSectionId = `comments-section-${file.filename.replace(/[^a-zA-Z0-9]/g, '')}`;
                    renderCommentsSection(selectedGroupCode, file.filename, commentsSectionId);
                });
                // Folder right-click
                groupFilesList.querySelectorAll('.folder-toggle').forEach(toggle => {
                    toggle.addEventListener('contextmenu', function(e) {
                        e.preventDefault();
                        const folderPath = this.getAttribute('data-folder-path');
                        showContextMenu(e.pageX, e.pageY, [
                            { label: 'Rename Folder', action: async () => {
                                const newName = prompt('Enter new folder name:', folderPath.split('/').pop());
                                if (newName && newName.trim() && newName !== folderPath.split('/').pop()) {
                                    const parentPath = folderPath.includes('/') ? folderPath.substring(0, folderPath.lastIndexOf('/')) : '';
                                    const toFolder = parentPath ? parentPath + '/' + newName.trim() : newName.trim();
                                    try {
                                        const res = await fetch(`${API_BASE}/${selectedGroupCode}/folders/rename`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ fromFolder: folderPath, toFolder })
                                        });
                                        if (res.ok) fetchAndRenderGroupFiles();
                                        else alert('Failed to rename folder');
                                    } catch (e) { alert('Network error'); }
                                }
                            } },
                            { label: 'Delete Folder', action: async () => {
                                if (confirm('Delete folder and all its files?')) {
                                    try {
                                        const res = await fetch(`${API_BASE}/${selectedGroupCode}/folders/delete`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ folder: folderPath })
                                        });
                                        if (res.ok) fetchAndRenderGroupFiles();
                                        else alert('Failed to delete folder');
                                    } catch (e) { alert('Network error'); }
                                }
                            } },
                            { label: 'New Folder', action: async () => {
                                const folderName = prompt('Enter new folder name:');
                                if (folderName && folderName.trim()) {
                                    try {
                                        const res = await fetch(`${API_BASE}/${selectedGroupCode}/folders/create`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ parentFolder: folderPath, folderName: folderName.trim() })
                                        });
                                        if (res.ok) fetchAndRenderGroupFiles();
                                        else alert('Failed to create folder');
                                    } catch (e) { alert('Network error'); }
                                }
                            } }
                        ]);
                    });
                });
                // File right-click
                groupFilesList.querySelectorAll('.file-row').forEach(row => {
                    row.addEventListener('contextmenu', function(e) {
                        e.preventDefault();
                        const filename = this.getAttribute('data-filename');
                        showContextMenu(e.pageX, e.pageY, [
                            { label: 'Download', action: () => window.open(`${API_BASE}/${selectedGroupCode}/files/${filename}`) },
                            { label: 'Delete', action: async () => {
                                if (confirm('Delete this file?')) {
                                    try {
                                        const res = await fetch(`${API_BASE}/${selectedGroupCode}/files/${filename}`, { method: 'DELETE' });
                                        if (res.ok) fetchAndRenderGroupFiles();
                                    } catch (e) {}
                                }
                            } },
                            { label: 'Rename', action: async () => {
                                const newName = prompt('Enter new file name (with extension):');
                                if (newName && newName.trim()) {
                                    try {
                                        const res = await fetch(`${API_BASE}/${selectedGroupCode}/files/rename`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ filename, newName: newName.trim() })
                                        });
                                        if (res.ok) fetchAndRenderGroupFiles();
                                        else alert('Failed to rename file');
                                    } catch (e) { alert('Network error'); }
                                }
                            } }
                        ]);
                    });
                });
                // --- Drag-and-drop for files (frontend only) ---
                let draggedFile = null;
                groupFilesList.querySelectorAll('.file-item').forEach(item => {
                    item.addEventListener('dragstart', function(e) {
                        draggedFile = {
                            filename: this.getAttribute('data-filename'),
                            fromFolder: this.getAttribute('data-folder')
                        };
                        e.dataTransfer.effectAllowed = 'move';
                    });
                });
                groupFilesList.querySelectorAll('.folder-toggle').forEach(toggle => {
                    toggle.addEventListener('dragover', function(e) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                    });
                    toggle.addEventListener('drop', async function(e) {
                        e.preventDefault();
                        const toFolder = this.getAttribute('data-folder-path');
                        if (draggedFile && draggedFile.filename) {
                            try {
                                const res = await fetch(`${API_BASE}/${selectedGroupCode}/files/move`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ filename: draggedFile.filename, toFolder })
                                });
                                if (res.ok) fetchAndRenderGroupFiles();
                                else alert('Failed to move file');
                            } catch (e) { alert('Network error'); }
                        }
                        draggedFile = null;
                    });
                });
            } else {
                groupFilesList.innerHTML = '<div class="text-[#9cabba]">No files in this group.</div>';
            }
        } catch (e) {
            groupFilesList.innerHTML = '<div class="text-[#e57373]">Error loading files.</div>';
        }
    }
    // Handle file upload
    if (groupFileUploadForm) {
        groupFileUploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedGroupCode) return;
            // Folder-based upload logic
            groupFileUploadFeedback.textContent = 'Uploading...';
            const username = getUsername();
            const selectedFolder = groupFolderSelect ? groupFolderSelect.value : '';
            // If folder upload input has files, upload all
            if (groupFolderUploadInput && groupFolderUploadInput.files.length) {
                const filesArr = Array.from(groupFolderUploadInput.files);
                let successCount = 0, failCount = 0;
                for (const file of filesArr) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('username', username);
                    // Use the folder structure from webkitRelativePath
                    const relPath = file.webkitRelativePath || file.name;
                    const folder = relPath.includes('/') ? relPath.split('/').slice(0, -1).join('/') : selectedFolder;
                    formData.append('folder', folder);
                    try {
                        const res = await fetch(`${API_BASE}/${selectedGroupCode}/files`, {
                            method: 'POST',
                            body: formData
                        });
                        if (res.ok) successCount++; else failCount++;
                    } catch (e) { failCount++; }
                }
                groupFileUploadFeedback.textContent = `Uploaded ${successCount} files, ${failCount} failed.`;
                groupFolderUploadInput.value = '';
                groupFolderUploadSelected.textContent = '';
                fetchAndRenderGroupFiles();
                return;
            }
            // Single file upload
            const file = groupFileInput.files[0];
            if (!file) {
                groupFilesMessage.textContent = 'Please select a file.';
                return;
            }
            const formData = new FormData();
            formData.append('file', file);
            formData.append('username', username);
            formData.append('folder', selectedFolder);
            try {
                const res = await fetch(`${API_BASE}/${selectedGroupCode}/files`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (res.ok) {
                    groupFileUploadFeedback.textContent = 'File uploaded!';
                    // Save to My Files (personal)
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(evt) {
                            const content = evt.target.result;
                            files.push({
                                name: file.name,
                                content: content,
                                lastModified: new Date().toISOString(),
                                modifiedBy: "You"
                            });
                            saveFilesToStorage();
                            updateFileList();
                        };
                        reader.readAsText(file);
                    }
                    groupFileInput.value = '';
                    groupFileSelected.textContent = '';
                    fetchAndRenderGroupFiles();
                } else {
                    groupFileUploadFeedback.textContent = data.error || 'Upload failed.';
                }
            } catch (e) {
                groupFileUploadFeedback.textContent = 'Network error.';
            }
        });
    }
    // Render and handle comments for a file
    async function renderCommentsSection(groupCode, filename, sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        section.innerHTML = '<div class="text-[#9cabba] text-xs">Loading comments...</div>';
        try {
            const res = await fetch(`${API_BASE}/${groupCode}/files/${filename}/comments`);
            const data = await res.json();
            if (res.ok) {
                const comments = data.comments || [];
                section.innerHTML = `
                    <div class="mb-2 text-[#4f8cff] font-semibold text-xs">Notes / Comments</div>
                    <div class="flex flex-col gap-1 mb-2">
                        ${comments.length === 0 ? '<div class="text-[#9cabba] text-xs">No comments yet.</div>' : comments.map(c => `<div class='bg-[#232a36] rounded px-2 py-1 text-xs mb-1'><span class='font-bold text-[#38bdf8]'>${c.username}</span>: <span class='text-[#facc15]'>${c.text}</span> <span class='text-[#9cabba] ml-2'>${new Date(c.timestamp).toLocaleString()}</span></div>`).join('')}
                    </div>
                    <form class="add-comment-form flex gap-2 mt-1">
                        <input type="text" class="comment-input flex-1 rounded bg-[#232a36] text-white px-2 py-1 text-xs" placeholder="Add a note or comment..." required />
                        <button type="submit" class="bg-[#06d6a0] text-black rounded px-3 py-1 text-xs font-bold">Add</button>
                    </form>
                    <div class="add-comment-feedback text-xs mt-1"></div>
                `;
                // Add comment form logic
                const form = section.querySelector('.add-comment-form');
                const input = section.querySelector('.comment-input');
                const feedback = section.querySelector('.add-comment-feedback');
                if (form && input) {
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const text = input.value.trim();
                        if (!text) return;
                        form.querySelector('button').disabled = true;
                        feedback.textContent = 'Adding...';
                        try {
                            const res = await fetch(`${API_BASE}/${groupCode}/files/${filename}/comments`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ username: getUsername(), text })
                            });
                            if (res.ok) {
                                input.value = '';
                                feedback.textContent = 'Comment added!';
                                await renderCommentsSection(groupCode, filename, sectionId);
                            } else {
                                feedback.textContent = 'Failed to add comment.';
                            }
                        } catch (e) {
                            feedback.textContent = 'Network error.';
                        } finally {
                            form.querySelector('button').disabled = false;
                        }
                    });
                }
            } else {
                section.innerHTML = '<div class="text-[#e57373] text-xs">Failed to load comments.</div>';
            }
        } catch (e) {
            section.innerHTML = '<div class="text-[#e57373] text-xs">Network error.</div>';
        }
    }

    if (hidePreviewBtn && showPreviewBtn && fileHighlight) {
        hidePreviewBtn.addEventListener('click', () => {
            previewHidden = true;
            fileHighlight.style.display = 'none';
            hidePreviewBtn.style.display = 'none';
            showPreviewBtn.style.display = 'block';
        });
        showPreviewBtn.addEventListener('click', () => {
            previewHidden = false;
            fileHighlight.style.display = 'block';
            hidePreviewBtn.style.display = 'block';
            showPreviewBtn.style.display = 'none';
        });
    }
});