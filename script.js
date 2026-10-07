// No sample posts - starts empty, filled only by what you write below
const posts = [];

const postListEl = document.getElementById('postList');
const fullPostEl = document.getElementById('fullPost');
const fullTitleEl = document.getElementById('fullTitle');
const fullMetaEl = document.getElementById('fullMeta');
const fullImageEl = document.getElementById('fullImage');
const fullContentEl = document.getElementById('fullContent');
const backBtn = document.getElementById('backBtn');
const postForm = document.getElementById('postForm');
const titleInput = document.getElementById('titleInput');
const contentInput = document.getElementById('contentInput');
const categoryInput = document.getElementById('categoryInput');
const imageInput = document.getElementById('imageInput');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');
const importInput = document.getElementById('importInput');

resetBtn.addEventListener('click', () => {
    editingId = null;
    editingImage = null;
    submitBtn.value = 'Publish Post';
});

let currentFilter = 'All';
let editingId = null;       // null = creating a new post; otherwise the id being edited
let editingImage = null;    // keeps the old image when editing, unless a new one is picked

// Load any posts saved earlier in this browser (localStorage only stores text,
// so JSON.stringify/parse converts the array to text and back)
const savedPosts = JSON.parse(localStorage.getItem('myPosts')) || [];

// Combine the built-in posts with any posts the user submitted earlier
let allPosts = [...posts, ...savedPosts];

// Shrinks an uploaded image file down to a reasonable size before saving it
function resizeImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, 800 / img.width);
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            callback(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Rough reading time estimate based on word count (200 words per minute)
function getReadTime(text) {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
}

// Render the list of blog post cards (filtered by category if one is selected)
function renderPostList() {
    postListEl.innerHTML = '';

    const filtered = currentFilter === 'All'
        ? allPosts
        : allPosts.filter(p => (p.category || 'Thoughts') === currentFilter);

    filtered.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.innerHTML = `
            ${post.image ? `<img class="post-image" src="${post.image}" alt="">` : ''}
            <span class="category-tag">${post.category || 'Thoughts'}</span>
            <h2>${post.title}</h2>
            <p class="meta">${post.date} · <span class="read-time">${getReadTime(post.content)}</span> · <span class="view-count">&#128065; ${post.views || 0}</span></p>
            <span class="read-more">Read more &rarr;</span>
            <button class="like-btn ${post.liked ? 'liked' : ''}" data-id="${post.id}">
                &hearts; <span class="like-count">${post.likes || 0}</span>
            </button>
            <button class="edit-btn" data-id="${post.id}">Edit</button>
            <button class="share-btn" data-id="${post.id}">Share</button>
            <button class="delete-btn" data-id="${post.id}">Delete</button>
        `;

        // Clicking the card opens the full post, unless the click was on a button
        card.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            showFullPost(post.id);
        });
        postListEl.appendChild(card);

        // Like button
        const likeBtn = card.querySelector('.like-btn');
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            post.liked = !post.liked;
            post.likes = (post.likes || 0) + (post.liked ? 1 : -1);

            const saved = savedPosts.find(p => p.id === post.id);
            if (saved) {
                saved.liked = post.liked;
                saved.likes = post.likes;
                localStorage.setItem('myPosts', JSON.stringify(savedPosts));
            }
            renderPostList();
        });

        // Edit button — fills the form with this post's data
        const editBtn = card.querySelector('.edit-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            titleInput.value = post.title;
            contentInput.value = post.content;
            categoryInput.value = post.category || 'Thoughts';

            editingId = post.id;
            editingImage = post.image || null;
            submitBtn.value = 'Update Post';

            document.getElementById('write').scrollIntoView({ behavior: 'smooth' });
        });

        // Share button — copies a short summary to the clipboard
        const shareBtn = card.querySelector('.share-btn');
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const summary = `${post.title}\n\n${post.excerpt}\n\n— via My Blog`;

            navigator.clipboard.writeText(summary)
                .then(() => alert('Copied! You can now paste this to share the post.'))
                .catch(() => alert('Could not copy automatically. Please copy the text manually.'));
        });

        // Delete button
        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            allPosts = allPosts.filter(p => p.id !== post.id);

            const index = savedPosts.findIndex(p => p.id === post.id);
            if (index !== -1) {
                savedPosts.splice(index, 1);
                localStorage.setItem('myPosts', JSON.stringify(savedPosts));
            }
            renderPostList();
        });
    });
}

// Show a single post in full
function showFullPost(id) {
    const post = allPosts.find(p => p.id === id);
    if (!post) return;

    // Count this as a view, and persist it if the post was user-submitted
    post.views = (post.views || 0) + 1;
    const saved = savedPosts.find(p => p.id === id);
    if (saved) {
        saved.views = post.views;
        localStorage.setItem('myPosts', JSON.stringify(savedPosts));
    }

    fullTitleEl.textContent = post.title;
    fullMetaEl.textContent = `${post.category || 'Thoughts'} · ${post.date} · ${getReadTime(post.content)} · ${post.views} views`;
    fullContentEl.textContent = post.content;

    if (post.image) {
        fullImageEl.src = post.image;
        fullImageEl.classList.remove('hidden');
    } else {
        fullImageEl.classList.add('hidden');
    }

    postListEl.classList.add('hidden');
    fullPostEl.classList.remove('hidden');
}

// Go back to the post list
backBtn.addEventListener('click', () => {
    fullPostEl.classList.add('hidden');
    postListEl.classList.remove('hidden');
});

// Category filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.category;
        renderPostList();
    });
});

// Nav links also take you back to the post list if a full post is open
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        fullPostEl.classList.add('hidden');
        postListEl.classList.remove('hidden');
    });
});

// Handle the "Write a New Post" form submission (creates OR updates a post)
postForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const title = titleInput.value;
    const content = contentInput.value;
    const file = imageInput.files[0];

    function finishSave(image) {
        if (editingId) {
            // Update the existing post in place
            const post = allPosts.find(p => p.id === editingId);
            const saved = savedPosts.find(p => p.id === editingId);

            const updated = {
                title,
                content,
                excerpt: content.substring(0, 60) + '...',
                category: categoryInput.value,
                image: image || null,
                category: categoryInput.value,
                likes: 0,
                views: 0
            };

            if (post) Object.assign(post, updated);
            if (saved) Object.assign(saved, updated);

            localStorage.setItem('myPosts', JSON.stringify(savedPosts));

            editingId = null;
            editingImage = null;
            submitBtn.value = 'Publish Post';
        } else {
            // Create a brand new post
            const newPost = {
                id: Date.now(),
                title: title,
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                excerpt: content.substring(0, 60) + '...',
                content: content,
                image: image || null,
                category: categoryInput.value,
                likes: 0
            };

            allPosts.unshift(newPost);
            savedPosts.unshift(newPost);

            try {
                localStorage.setItem('myPosts', JSON.stringify(savedPosts));
            } catch (err) {
                allPosts.shift();
                savedPosts.shift();
                alert('Storage is full. Try a smaller image or delete some posts.');
                return;
            }
        }

        renderPostList();
        postForm.reset();
    }

    if (file) {
        resizeImage(file, finishSave);
    } else {
        finishSave(null);
    }
});
// Export all posts as a downloadable .json backup file
exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(savedPosts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-blog-backup.json';
    link.click();

    URL.revokeObjectURL(url);
});

// Import posts from a previously exported .json file
importInput.addEventListener('change', () => {
    const file = importInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        let imported;
        try {
            imported = JSON.parse(e.target.result);
        } catch (err) {
            alert('That file doesn\'t look like a valid backup.');
            return;
        }

        if (!Array.isArray(imported)) {
            alert('That file doesn\'t look like a valid backup.');
            return;
        }

        // Skip any post whose id already exists, so importing twice won't duplicate everything
        const existingIds = new Set(savedPosts.map(p => p.id));
        const newOnes = imported.filter(p => !existingIds.has(p.id));

        savedPosts.push(...newOnes);
        allPosts.push(...newOnes);
        localStorage.setItem('myPosts', JSON.stringify(savedPosts));

        renderPostList();
        alert(`Imported ${newOnes.length} post(s).`);
        importInput.value = ''; // reset so re-importing the same file still triggers 'change'
    };
    reader.readAsText(file);
});

// Initial render
renderPostList();