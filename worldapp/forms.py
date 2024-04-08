from django.contrib.auth.forms import AuthenticationForm, ReadOnlyPasswordHashField, PasswordChangeForm, \
    UserCreationForm
from django import forms
from django.contrib.auth import get_user_model
from worldapp.models import Pub, Artist, Song

User = get_user_model()
class UserLoginForm(AuthenticationForm):
    username = forms.CharField(label='Username', widget=forms.EmailInput(attrs={'class': 'form-control'}))
    password = forms.CharField(label='Password', widget=forms.PasswordInput(attrs={'class': 'form-control'}))

class UsernameUpdateForm(forms.ModelForm):
    username = forms.CharField(label='Username', max_length=150, widget=forms.TextInput(attrs={'class': 'form-control'}))

    class Meta:
        model = User
        fields = ['username']

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username).exclude(pk=self.instance.pk).exists():
            raise forms.ValidationError("Username is already in use.")
        return username

class CustomPasswordChangeForm(PasswordChangeForm):
    old_password = forms.CharField(label='Old password',
                                   widget=forms.PasswordInput(attrs={'class': 'form-control'}))
    new_password1 = forms.CharField(label='New password',
                                    widget=forms.PasswordInput(attrs={'class': 'form-control'}))
    new_password2 = forms.CharField(label='Confirm new password',
                                    widget=forms.PasswordInput(attrs={'class': 'form-control'}))


class UserRegisterForm(UserCreationForm):
    username = forms.CharField(label='Username', max_length=150,
                               widget=forms.TextInput(attrs={'class': 'form-control'}))
    email = forms.EmailField(label='Email Address', max_length=320, widget=forms.EmailInput(attrs={'class': 'form-control'}))
    first_name = forms.CharField(label='First Name', max_length=35, widget=forms.TextInput(attrs={'class': 'form-control'}))
    last_name = forms.CharField(label='Last Name', max_length=35, widget=forms.TextInput(attrs={'class': 'form-control'}))
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput(attrs={'class': 'form-control'}))
    password2 = forms.CharField(label='Confirm Password', widget=forms.PasswordInput(attrs={'class': 'form-control'}))

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password1', 'password2']

    def clean_email(self):
        """ Verify that email address is available. """
        email = self.cleaned_data.get('email')
        qs = User.objects.filter(email=email)
        if qs.exists():
            raise forms.ValidationError("Email is already in use.")
        return email

# class UserRegisterForm(forms.ModelForm):
#     """Default"""
#     username = forms.CharField(label='Username', max_length=150, widget=forms.TextInput(attrs={'class': 'form-control'}))
#     email = forms.CharField(label='Email Address', max_length=320, widget=forms.EmailInput(attrs={'class': 'form-control'}))
#     first_name = forms.CharField(label='First Name', max_length=35, widget=forms.TextInput(attrs={'class': 'form-control'}))
#     last_name = forms.CharField(label='Last Name', max_length=35, widget=forms.TextInput(attrs={'class': 'form-control'}))
#     password = forms.CharField(label='Password', widget=forms.PasswordInput(attrs={'class': 'form-control'}))
#     password1 = forms.CharField(label='Confirm Password', widget=forms.PasswordInput(attrs={'class': 'form-control'}))
#
#     class Meta:
#         model = User
#         fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password1']
#
#     def clean_email(self):
#         """ Verify that email address is available. """
#         email = self.cleaned_data.get('email')
#         qs = User.objects.filter(email=email)
#         if qs.exists():
#             raise forms.ValidationError("Email is already in use.")
#         return email
#
#     def clean(self):
#         """ Verify that passwords match. """
#         cleaned_data = super().clean()
#         password = cleaned_data.get("password")
#         password1 = cleaned_data.get("password1")
#         if password is not None and password != password1:
#             self.add_error("password1", "Passwords must match.")
#         return cleaned_data
#
#     def save(self, commit=True):
#         # Save the provided password in hashed format
#         user = super().save(commit=False)
#         user.set_password(self.cleaned_data["password"])
#         if commit:
#             user.save()
#         return user

class UserAdminCreationForm(forms.ModelForm):
    """ Form for creating new users, includes all the required fields. """
    password = forms.CharField(label='Password', widget=forms.PasswordInput)
    password1 = forms.CharField(label='Confirm Password', widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ['email']

    def clean(self):
        """ Verifying passwords match. """
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        password1 = cleaned_data.get("password1")
        if password is not None and password != password1:
            self.add_error("password1", "Your passwords must match")
        return cleaned_data

    def save(self, commit=True):
        # Save the provided password in hashed format
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user


class UserAdminChangeForm(forms.ModelForm):
    """
    Updating users. Includes all the fields on
    the user, but replaces the password field with admins
    password hash display field.
    """
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 'is_active', 'date_joined']

    def clean_password(self):
        # Regardless of what the user provides, return the initial value.
        # This is done here, rather than on the field, because the
        # field does not have access to the initial value
        return self.initial["password"]

class PubForm(forms.ModelForm):
    artist = forms.ModelChoiceField(queryset=Artist.objects.all())
    songURL = forms.ChoiceField(choices=[])
    date = forms.DateTimeField(input_formats=['%Y-%m-%d %H:%M'])  # Add this line

    def __init__(self, *args, **kwargs):
        super(PubForm, self).__init__(*args, **kwargs)
        self.fields['songURL'].choices = [(song.song.url, song.song.url) for song in Song.objects.all()]

    class Meta:
        model = Pub
        fields = ['artist', 'songURL', 'date']  # Add 'date' here