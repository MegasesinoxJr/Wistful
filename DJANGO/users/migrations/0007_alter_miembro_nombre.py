# Generated by Django 5.0.11 on 2025-04-18 11:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_valoracion'),
    ]

    operations = [
        migrations.AlterField(
            model_name='miembro',
            name='nombre',
            field=models.CharField(max_length=100, unique=True),
        ),
    ]
