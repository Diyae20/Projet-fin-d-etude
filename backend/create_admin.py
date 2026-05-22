import os
import django

# Configuration de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_or_reset_admin():
    """
    Crée un nouvel utilisateur administrateur ou réinitialise le mot de passe d'un administrateur existant
    """
    username = 'admin'
    email = 'admin@example.com'
    password = 'admin123'

    # Vérifier si l'utilisateur existe déjà
    try:
        user = User.objects.get(username=username)
        print(f"L'utilisateur {username} existe déjà. Réinitialisation du mot de passe...")
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"Mot de passe de l'utilisateur {username} réinitialisé avec succès!")
    except User.DoesNotExist:
        print(f"Création d'un nouvel utilisateur administrateur {username}...")
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_staff=True,
            is_superuser=True
        )
        print(f"Nouvel utilisateur administrateur {username} créé avec succès!")

    print("Informations de connexion:")
    print(f"Nom d'utilisateur: {username}")
    print(f"Mot de passe: {password}")
    print("URL de connexion: http://127.0.0.1:8000/admin/")

if __name__ == '__main__':
    create_or_reset_admin()
