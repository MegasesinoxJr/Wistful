# Generated by Django 5.0.11 on 2025-04-26 00:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0012_combatiente_experiencia'),
    ]

    operations = [
        migrations.AlterField(
            model_name='miembro',
            name='role',
            field=models.CharField(choices=[('miembro', 'Miembro'), ('vip', 'VIP'), ('colaborador', 'Colaborador'), ('admin', 'Administrador'), ('root', 'Root')], default='miembro', max_length=25),
        ),
    ]
