from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient, APITestCase

from boards.models import Board, Card, List

User = get_user_model()


class BoardAuthTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='demo', password='demo123')
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_token_auth_works(self):
        unauth_client = APIClient()
        response = unauth_client.post('/api/auth/token/', {'username': 'demo', 'password': 'demo123'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)

    def test_authenticated_board_list_request(self):
        response = self.client.get('/api/boards/')
        self.assertEqual(response.status_code, 200)

    def test_unauthenticated_card_patch_is_rejected(self):
        board = Board.objects.create(title='Board')
        board_list = List.objects.create(board=board, title='List 1', position=0)
        card = Card.objects.create(list=board_list, title='Card 1', position=0)

        unauth_client = APIClient()
        response = unauth_client.patch(f'/api/cards/{card.id}/', {'position': 1}, format='json')
        self.assertIn(response.status_code, [401, 403])


class CardOrderTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='secret123')
        self.board = Board.objects.create(title='Board')
        self.board_list = List.objects.create(board=self.board, title='To Do', position=0)
        self.card_a = Card.objects.create(list=self.board_list, title='A', position=0)
        self.card_b = Card.objects.create(list=self.board_list, title='B', position=1)
        self.card_c = Card.objects.create(list=self.board_list, title='C', position=2)

    def test_reordering_a_card_updates_positions(self):
        client = APIClient()
        token = Token.objects.create(user=self.user)
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

        response = client.patch(f'/api/cards/{self.card_c.id}/', {'position': 0}, format='json')
        self.assertEqual(response.status_code, 200)

        self.card_a.refresh_from_db()
        self.card_b.refresh_from_db()
        self.card_c.refresh_from_db()

        self.assertEqual(self.card_c.position, 0)
        self.assertEqual(self.card_a.position, 1)
        self.assertEqual(self.card_b.position, 2)


class ListOrderTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='secret123')
        self.board = Board.objects.create(title='Board')
        self.list_a = List.objects.create(board=self.board, title='To Do', position=0)
        self.list_b = List.objects.create(board=self.board, title='In Progress', position=1)
        self.list_c = List.objects.create(board=self.board, title='Done', position=2)

    def test_list_order_is_returned_by_position(self):
        client = APIClient()
        token = Token.objects.create(user=self.user)
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

        response = client.patch(f'/api/lists/{self.list_a.id}/', {'position': 1}, format='json')
        self.assertEqual(response.status_code, 200)

        response = client.patch(f'/api/lists/{self.list_b.id}/', {'position': 0}, format='json')
        self.assertEqual(response.status_code, 200)

        board_response = client.get(f'/api/boards/{self.board.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual([lst['title'] for lst in board_response.data['lists']], ['In Progress', 'To Do', 'Done'])
