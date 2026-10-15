from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('tools/', views.tools, name='tools'),
    path('preis/', views.preis, name='preis'),
    path('kontakt/', views.kontakt, name='kontakt'),

    # Authentifizierung
    path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),

    # Geschützter VIP-Bereich (Deutsche URLs & Namen)
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('notizen/', views.notiz_whiteboard_view, name='notiz_whiteboard'),
    path('kanban/', views.kanban_view, name='kanban'),
    path('ordner/', views.ordner_view, name='ordner'),
    path('kalender/', views.kalender_view, name='kalender'),
    path('einstellungen/', views.einstellungen_view, name='einstellungen'),
]