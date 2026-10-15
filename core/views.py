from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required

def index(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    return render(request, 'index.html')

def tools(request):
    return render(request, 'tools.html')

def preis(request):
    return render(request, 'preis.html')

def kontakt(request):
    return render(request, 'kontakt.html')

# --- Geschützter VIP-Bereich ---

@login_required
def dashboard_view(request):
    return render(request, 'dashboard.html')

@login_required
def notiz_whiteboard_view(request):
    return render(request, 'notiz_whiteboard.html')

@login_required
def kanban_view(request):
    return render(request, 'kanban.html')

@login_required
def ordner_view(request):
    return render(request, 'ordner.html')

@login_required
def kalender_view(request):
    return render(request, 'kalender.html')

@login_required
def einstellungen_view(request):
    return render(request, 'einstellungen.html')