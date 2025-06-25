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
            if (fileEditor) fileEditor.style.display = 'flex';
        } else {
            fileEditor.disabled = !isEditMode;
            editBtn.disabled = isEditMode;
            if (isEditMode) {
                if (fileHighlight) fileHighlight.style.display = 'none';
                if (fileEditor) fileEditor.style.display = 'flex';
            } else {
                if (fileHighlight && fileHighlightCode) {
                    const file = files[currentFileIndex];
                    const extension = file.name.split('.').pop().toLowerCase();
                    const lang = getPrismLanguage(extension);
                    fileHighlightCode.className = 'language-' + lang;
                    fileHighlightCode.textContent = file.content;
                    Prism.highlightElement(fileHighlightCode);
                    fileHighlight.style.display = 'block';
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
            let fileItemClass = 'file-item flex items-center gap-4 bg-[#111418] hover:bg-[#1a2129] px-4 min-h-14 justify-between cursor-pointer rounded-lg';
            if (isRecent) fileItemClass += ' bg-[#073b4c]';
            if (realIndex === currentFileIndex) fileItemClass += ' bg-[#283039]';
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
    const API_BASE = 'http://localhost:3001/api/groups';

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
    let selectedGroupCode = null;

    // Show files section when a group is selected
    function selectGroup(code) {
        selectedGroupCode = code;
        if (groupFilesSection) groupFilesSection.classList.remove('hidden');
        fetchAndRenderGroupFiles();
    }
    // Hide files section
    function deselectGroup() {
        selectedGroupCode = null;
        if (groupFilesSection) groupFilesSection.classList.add('hidden');
    }
    // Fetch and render files for selected group
    async function fetchAndRenderGroupFiles() {
        if (!selectedGroupCode) return;
        groupFilesList.innerHTML = '<div class="text-[#9cabba]">Loading...</div>';
        groupFilesMessage.textContent = '';
        try {
            const res = await fetch(`${API_BASE}/${selectedGroupCode}/files`);
            const data = await res.json();
            if (res.ok && data.files && data.files.length > 0) {
                groupFilesList.innerHTML = '';
                data.files.forEach(file => {
                    const div = document.createElement('div');
                    div.className = 'flex flex-col bg-[#232a36] rounded px-3 py-2 mb-2';
                    // File preview logic
                    let preview = '';
                    const ext = file.originalname.split('.').pop().toLowerCase();
                    if (["png","jpg","jpeg","gif","bmp","webp"].includes(ext)) {
                        preview = `<img src="${API_BASE}/${selectedGroupCode}/files/${file.filename}" alt="preview" class="max-h-32 max-w-xs rounded mb-2" />`;
                    } else if (["txt","md","json","js","py","html","css"].includes(ext)) {
                        preview = `<button class='show-preview-btn text-xs text-[#38bdf8] underline mb-2' data-filename='${file.filename}'>Show Preview</button><pre class='file-preview-content hidden bg-[#181c23] text-white rounded p-2 mb-2 text-xs overflow-x-auto'></pre>`;
                    }
                    div.innerHTML = `
                        <div class='flex items-center justify-between'>
                            <span class="text-white font-normal">${file.originalname}</span>
                            <span class="text-[#9cabba] text-xs ml-2">${(file.size/1024).toFixed(1)} KB</span>
                            <div class='flex gap-2'>
                                <button class="download-group-file-btn bg-[#38bdf8] hover:bg-[#06d6a0] text-black rounded px-2 py-1 text-xs" data-filename="${file.filename}">Download</button>
                                <button class="delete-group-file-btn bg-[#e57373] hover:bg-red-500 text-white rounded px-2 py-1 text-xs" data-filename="${file.filename}">Delete</button>
                            </div>
                        </div>
                        ${preview}
                    `;
                    groupFilesList.appendChild(div);
                });
                // Download listeners
                groupFilesList.querySelectorAll('.download-group-file-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const filename = btn.getAttribute('data-filename');
                        window.open(`${API_BASE}/${selectedGroupCode}/files/${filename}`);
                    });
                });
                // Delete listeners
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
                // Preview listeners for text files
                groupFilesList.querySelectorAll('.show-preview-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const filename = btn.getAttribute('data-filename');
                        const pre = btn.nextElementSibling;
                        if (pre.classList.contains('hidden')) {
                            pre.textContent = 'Loading...';
                            pre.classList.remove('hidden');
                            try {
                                const res = await fetch(`${API_BASE}/${selectedGroupCode}/files/${filename}`);
                                if (res.ok) {
                                    const text = await res.text();
                                    pre.textContent = text.slice(0, 2000) + (text.length > 2000 ? '\n... (truncated)' : '');
                                } else {
                                    pre.textContent = 'Preview failed.';
                                }
                            } catch (e) {
                                pre.textContent = 'Network error.';
                            }
                        } else {
                            pre.classList.add('hidden');
                        }
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
            const file = groupFileInput.files[0];
            if (!file) {
                groupFilesMessage.textContent = 'Please select a file.';
                return;
            }
            groupFilesMessage.textContent = 'Uploading...';
            const formData = new FormData();
            formData.append('file', file);
            formData.append('username', getUsername());
            try {
                const res = await fetch(`${API_BASE}/${selectedGroupCode}/files`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (res.ok) {
                    groupFilesMessage.textContent = 'File uploaded!';
                    groupFileInput.value = '';
                    fetchAndRenderGroupFiles();
                } else {
                    groupFilesMessage.textContent = data.error || 'Upload failed.';
                }
            } catch (e) {
                groupFilesMessage.textContent = 'Network error.';
            }
        });
    }
    // Deselect group if group list is empty or user leaves
    // (Handled in fetchAndRenderGroups)
});