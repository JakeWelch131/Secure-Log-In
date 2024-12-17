document.getElementById('changePasswordForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const data = {
        username: formData.get('username'),
        oldPassword: formData.get('oldPassword'),
		newPassword: formData.get('newPassword'),
    };
    fetch('/update-password', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Password change successful');
			window.location.href = 'login.html';
        } else {
            alert(`Cannot change password ${data.message}`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});