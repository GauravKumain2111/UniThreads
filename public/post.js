document.addEventListener('DOMContentLoaded', () => {
    loadPosts();

    const postForm = document.getElementById('postForm');
    postForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent form from refreshing the page
        addPost();
    });
});

async function loadPosts() {
    try {
        const response = await fetch('/api/posts');
        const posts = await response.json();

        const postsContainer = document.getElementById('postsContainer');
        postsContainer.innerHTML = '';

        const loggedInUserEmail = localStorage.getItem('userEmail');
        const profilePictureUrl = 'dp.png'; // Replace with your actual image path

        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('post');

            const likedByUser = post.likedBy.includes(loggedInUserEmail);

            const postContent = `
                <div class="profile-info">
                    <img src="${profilePictureUrl}" alt="Profile Picture" class="profile-pic">
                    <div class="user-details">
                        <p class="email-id" style="font-family: 'Roboto', sans-serif;">${post.email}</p>
                    </div>
                </div>
                <div class="post-content">
                    <p>${post.content}</p>
                    ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post image" style="max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 10px; border: 0.5px solid white;">` : ''}
                </div>
                <hr class="divider">
                <div style="display: flex; align-items: center;">
                    <div id="heart-${post.id}" class="heart ${likedByUser ? 'active' : ''}" onclick="likePost(${post.id})" style="padding: 10px;"></div>
                    <span id="like-count-${post.id}" class="like-count" style="margin-right: 10px;">${post.likes}</span>
                    ${post.email === loggedInUserEmail ? `
                        <button 
                            onclick="deletePost(${post.id})"
                            style="
                                background-color: #483D8B;
                                border: none;
                                color: white;
                                padding: 8px 16px;
                                border-radius: 5px;
                                cursor: pointer;
                                font-size: 0.875em;
                                transition: background-color 0.3s ease, transform 0.2s ease;
                                outline: none;
                                margin-left: 20px;
                                align-self: center;
                            ">
                            Delete
                        </button>` : ''}
                </div>
                <div class="comments-section">
                    <div class="comment-form">
                        <textarea id="commentContent${post.id}" placeholder="Add a comment..."></textarea>
                        <button onclick="addComment(${post.id})">Comment</button>
                    </div>
                    ${post.comments.map(comment => `
                        <div class="comment">
                            <div class="comment-content">${comment.content}</div>
                        </div>
                    `).join('')}
                </div>
            `;

            postElement.innerHTML = postContent;
            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

async function addPost() {
    try {
        const postForm = document.getElementById('postForm');
        const formData = new FormData(postForm);

        const userEmail = localStorage.getItem('userEmail');
        formData.append('email', userEmail);

        await fetch('/api/posts', {
            method: 'POST',
            body: formData,
        });

        loadPosts();
        postForm.reset();
    } catch (error) {
        console.error('Error adding post:', error);
    }
}

async function likePost(postId) {
    try {
        const userEmail = localStorage.getItem('userEmail');
        const heartElement = document.getElementById(`heart-${postId}`);
        const likeCountElement = document.getElementById(`like-count-${postId}`);

        const isLiked = heartElement.classList.contains('active');

        if (isLiked) {
            // Unlike the post
            await fetch(`/api/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: userEmail })
            });

            // Decrease the like count and toggle the heart's color
            likeCountElement.textContent = parseInt(likeCountElement.textContent) - 1;
            heartElement.classList.remove('active');
        } else {
            // Like the post
            await fetch(`/api/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: userEmail })
            });

            // Increase the like count and toggle the heart's color
            likeCountElement.textContent = parseInt(likeCountElement.textContent) + 1;
            heartElement.classList.add('active');
        }
    } catch (error) {
        console.error('Error liking post:', error);
    }
}

async function addComment(postId) {
    const commentContent = document.getElementById(`commentContent${postId}`).value;

    if (commentContent.trim() === '') {
        alert('Please write something!');
        return;
    }

    try {
        await fetch(`/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ commentContent }),
        });

        loadPosts();
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}

async function deletePost(postId) {
    try {
        await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
        });

        loadPosts(); // Reload posts after deletion
    } catch (error) {
        console.error('Error deleting post:', error);
    }
}
