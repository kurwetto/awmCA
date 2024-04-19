from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse

class UserLoginTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.login_url = reverse('login')
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='password123')

    def test_user_authenticated_redirect(self):
        self.client.force_login(self.user)
        response = self.client.get(self.login_url)
        self.assertRedirects(response, reverse('worldapp'))

    def test_valid_login(self):
        response = self.client.post(self.login_url, {'username': 'test@example.com', 'password': 'password123'})
        self.assertEqual(response.status_code, 302)  # Check if the response is a redirect
        self.assertEqual(response.url, reverse('worldapp'))  # Check if the redirection URL is correct

    def test_invalid_login(self):
        response = self.client.post(self.login_url, {'username': 'test@example.com', 'password': 'wrongpassword'})
        self.assertEqual(response.status_code, 200)  # Check if the page reloads on invalid login

    def test_get_request(self):
        response = self.client.get(self.login_url)
        self.assertEqual(response.status_code, 200)  # Check if the page loads successfully
