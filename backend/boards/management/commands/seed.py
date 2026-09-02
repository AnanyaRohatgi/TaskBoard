from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from boards.models import Board, List, Card, Label, ChecklistItem, Comment, CardActivity

try:
    from rest_framework.authtoken.models import Token
except Exception:
    Token = None

User = get_user_model()


def create_demo_user():
    email = "demo@example.com"
    username = "demo"
    password = "demo"
    user, created = User.objects.get_or_create(username=username, defaults={
        'email': email,
    })
    if created:
        user.set_password(password)
        user.save()
    return user, created


class Command(BaseCommand):
    help = 'Seed the database with demo data for boards, lists, cards, labels, checklist, comments and a demo user.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding demo data...')

        user, user_created = create_demo_user()
        if user_created:
            self.stdout.write(self.style.SUCCESS(f'Created demo user: {user.username} / password: demo'))
        else:
            self.stdout.write(f'Demo user already exists: {user.username}')

        # Create board
        board_title = 'Demo Board'
        board, b_created = Board.objects.get_or_create(title=board_title, defaults={'description': 'Demo board created by seed script'})
        if b_created:
            self.stdout.write(self.style.SUCCESS(f'Created board: {board.title}'))
        else:
            self.stdout.write(f'Board already exists: {board.title}')

        # Labels
        label_defs = [
            ('Bug', '#e74c3c'),
            ('Feature', '#3498db'),
            ('Chore', '#f1c40f'),
        ]
        labels = []
        for name, color in label_defs:
            lbl, _ = Label.objects.get_or_create(board=board, name=name, defaults={'color': color})
            labels.append(lbl)

        # Lists and Cards
        lists_data = [
            ('To Do', [
                {'title': 'Set up project scaffold', 'description': 'Initial repo with backend and frontend scaffold'},
                {'title': 'Write seed script', 'description': 'Create management command to populate demo data'},
            ]),
            ('In Progress', [
                {'title': 'Implement API endpoints', 'description': 'Add serializers and viewsets for boards, lists and cards'},
            ]),
            ('Done', [
                {'title': 'Design brief', 'description': 'Finalize the developer brief and acceptance criteria'},
            ]),
        ]

        for idx, (lst_title, cards) in enumerate(lists_data):
            lst, l_created = List.objects.get_or_create(board=board, title=lst_title, defaults={'position': idx})
            if l_created:
                self.stdout.write(self.style.SUCCESS(f'Created list: {lst.title}'))
            else:
                self.stdout.write(f'List exists: {lst.title}')

            for c_idx, cdata in enumerate(cards):
                card, c_created = Card.objects.get_or_create(list=lst, title=cdata['title'], defaults={
                    'description': cdata.get('description', ''),
                    'position': c_idx,
                })
                if c_created:
                    self.stdout.write(self.style.SUCCESS(f'  Created card: {card.title}'))
                else:
                    self.stdout.write(f'  Card exists: {card.title}')

                # add a label to first card
                if c_idx == 0 and labels:
                    card.labels.add(labels[1])  # Feature

                # add checklist
                ChecklistItem.objects.get_or_create(card=card, text='Acceptance criteria met', defaults={'done': False})
                ChecklistItem.objects.get_or_create(card=card, text='Tests written', defaults={'done': False})

                # add comment
                Comment.objects.get_or_create(card=card, author=user, text=f'Auto-seeded comment for card {card.title}')

                # activity
                CardActivity.objects.get_or_create(card=card, type='created', defaults={'payload': {'by': user.username, 'time': timezone.now().isoformat()}})

        # Create a sample archived board to show archive behavior
        archived_board, _ = Board.objects.get_or_create(title='Archived Board', defaults={'description': 'An archived board', 'archived': True})

        # Create token if available
        if Token is not None:
            token, t_created = Token.objects.get_or_create(user=user)
            if t_created:
                self.stdout.write(self.style.SUCCESS(f'Created token for demo user: {token.key}'))
            else:
                self.stdout.write(f'Demo token exists: {token.key}')
        else:
            self.stdout.write('rest_framework.authtoken not available; skipping token creation')

        self.stdout.write(self.style.SUCCESS('Seeding complete.'))
