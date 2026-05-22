
# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rendezvous', '0007_notepatient'),
    ]

    operations = [
        migrations.AlterField(
            model_name='rendezvous',
            name='type_consultation',
            field=models.CharField(
                max_length=20,
                choices=[('consultation', 'Consultation'), ('urgence', 'Urgence')],
                default=None,
                null=True,
                blank=True,
                verbose_name='Type de consultation'
            ),
        ),
    ]
