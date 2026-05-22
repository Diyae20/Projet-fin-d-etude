
# Generated migration for adding total_rendezvous_count field to User model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_user_medecin'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='total_rendezvous_count',
            field=models.IntegerField(default=0, verbose_name='Nombre total de rendez-vous'),
        ),
    ]
