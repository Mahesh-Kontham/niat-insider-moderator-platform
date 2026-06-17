from django import forms
from django.contrib.auth.hashers import make_password

from .models import CustomUser


class CustomUserAdminForm(forms.ModelForm):
    password = forms.CharField(
        widget=forms.PasswordInput(),
        required=False
    )

    class Meta:
        model = CustomUser
        fields = "__all__"

    def save(self, commit=True):
        user = super().save(commit=False)

        password = self.cleaned_data.get("password")

        if password:
            user.password = make_password(password)

        if commit:
            user.save()

        return user