from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rendezvous', '0003_delete_avis'),
    ]

    operations = [
        migrations.AddField(
            model_name='rendezvous',
            name='type_consultation',
            field=models.CharField(
                choices=[('consultation', 'Consultation'), ('urgence', 'Urgence')],
                default='consultation',
                max_length=20,
                verbose_name='Type de consultation'
            ),
        ),
    ]
