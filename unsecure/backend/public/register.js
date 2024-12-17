document.getElementById('registrationForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const data = {
        username: formData.get('username'),
        password: formData.get('password'),
		email: formData.get('email'),
    };
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Registration successful');
			window.location.href = 'login.html';
        } else {
            alert('User name already exists');
			window.location.href = 'login.html';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});